package com.kd4.runningcoach.service

import com.github.benmanes.caffeine.cache.Caffeine
import com.kd4.runningcoach.dto.*
import com.kd4.runningcoach.repository.UserProfileRepository
import org.springframework.stereotype.Service
import java.time.DayOfWeek
import java.time.LocalDate
import java.time.temporal.ChronoUnit
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.TimeUnit
import kotlin.math.roundToInt

data class UserCacheEntry(
    val today: ConcurrentHashMap<LocalDate, TodayResponse> = ConcurrentHashMap(),
    val monthly: ConcurrentHashMap<String, MonthlyScheduleResponse> = ConcurrentHashMap(),
)

@Service
class ScheduleService(
    private val userProfileRepository: UserProfileRepository,
    private val paceCalculator: PaceCalculator,
) {

    private val userCache = Caffeine.newBuilder()
        .expireAfterWrite(5, TimeUnit.MINUTES)
        .maximumSize(500)
        .build<Long, UserCacheEntry>()

    // --- 로그인 유저용 ---
    fun getToday(userId: Long, date: LocalDate = LocalDate.now()): TodayResponse {
        val entry = userCache.get(userId) { UserCacheEntry() }!!
        return entry.today.getOrPut(date) {
            calculateToday(getProfileData(userId), date)
        }
    }

    fun getMonthlySchedule(userId: Long, year: Int, month: Int): MonthlyScheduleResponse {
        val entry = userCache.get(userId) { UserCacheEntry() }!!
        val key = "$year-$month"
        return entry.monthly.getOrPut(key) {
            calculateMonthly(getProfileData(userId), year, month)
        }
    }

    fun evictUser(userId: Long) {
        userCache.invalidate(userId)
    }

    // --- 게스트용 ---
    fun getTodayGuest(data: ProfileData, date: LocalDate = LocalDate.now()): TodayResponse {
        return calculateToday(data, date)
    }

    fun getMonthlyGuest(data: ProfileData, year: Int, month: Int): MonthlyScheduleResponse {
        return calculateMonthly(data, year, month)
    }

    // === 핵심 계산 로직 (ProfileData 기반) ===

    private fun calculateToday(data: ProfileData, date: LocalDate): TodayResponse {
        val planSelection = paceCalculator.determinePlanType(data.targetDate, date)
        val totalWeeks = planSelection.totalWeeks
        val currentWeek = planSelection.currentWeek
        val plan = paceCalculator.generatePlan(data.goalTimeSeconds, data.goalEvent, totalWeeks)

        val workout = getWorkoutForDate(data, date, currentWeek, totalWeeks, plan)

        val distanceToday = workout?.distanceKm ?: 0.0
        val workoutTypeToday = workout?.workoutType
        val tomorrowSelection = paceCalculator.determinePlanType(data.targetDate, date.plusDays(1))
        val tomorrowPlan = if (tomorrowSelection.totalWeeks != totalWeeks) {
            paceCalculator.generatePlan(data.goalTimeSeconds, data.goalEvent, tomorrowSelection.totalWeeks)
        } else plan
        val tomorrowWorkout = getWorkoutForDate(data, date.plusDays(1), tomorrowSelection.currentWeek, tomorrowSelection.totalWeeks, tomorrowPlan)
        val distanceTomorrow = tomorrowWorkout?.distanceKm ?: 0.0
        val workoutTypeTomorrow = tomorrowWorkout?.workoutType

        val calories = calculateCalories(
            data.bodyWeight, distanceToday, workoutTypeToday,
            distanceTomorrow, workoutTypeTomorrow,
            data.targetWeight, data.targetDate, date
        )

        return TodayResponse(
            date = date,
            weekNumber = currentWeek.coerceIn(1, totalWeeks),
            totalWeeks = totalWeeks,
            workout = workout,
            calories = calories,
            isRestDay = workout == null || workout.workoutType == "REST",
        )
    }

    private fun calculateMonthly(data: ProfileData, year: Int, month: Int): MonthlyScheduleResponse {
        val trainingDaysOfWeek = data.trainingDays.split(",").map { toDayOfWeek(it) }

        val startDate = LocalDate.of(year, month, 1)
        val endDate = startDate.withDayOfMonth(startDate.lengthOfMonth())

        val days = mutableListOf<ScheduleDayDto>()
        var current = startDate
        while (!current.isAfter(endDate)) {
            val planSelection = paceCalculator.determinePlanType(data.targetDate, current)
            val plan = paceCalculator.generatePlan(data.goalTimeSeconds, data.goalEvent, planSelection.totalWeeks)
            val isTrainingDay = current.dayOfWeek in trainingDaysOfWeek
            val workout = getWorkoutForDate(data, current, planSelection.currentWeek, planSelection.totalWeeks, plan)

            days.add(ScheduleDayDto(
                date = current,
                weekNumber = planSelection.currentWeek.coerceIn(1, planSelection.totalWeeks),
                workout = workout,
                isRestDay = !isTrainingDay || workout?.workoutType == "REST",
                isTrainingDay = isTrainingDay,
            ))
            current = current.plusDays(1)
        }

        return MonthlyScheduleResponse(year = year, month = month, days = days)
    }

    private fun getWorkoutForDate(
        data: ProfileData,
        date: LocalDate,
        currentWeek: Int,
        totalWeeks: Int,
        plan: List<PaceCalculator.WeeklyPlan>,
    ): WorkoutDto? {
        // 대회일 이후는 빈값
        if (date.isAfter(data.targetDate)) return null

        val trainingDaysList = data.trainingDays.split(",")
        val longRunDow = toDayOfWeek(data.longRunDay)
        val todayDow = date.dayOfWeek
        val trainingDows = trainingDaysList.map { toDayOfWeek(it) }
        val vdotPaces = plan.firstOrNull()?.vdotPaces ?: return null

        // 레이스 데이 = targetDate 당일 (훈련일 여부 무관)
        if (date == data.targetDate) {
            return WorkoutDto(
                workoutType = "RACE",
                distanceKm = paceCalculator.raceDistanceKm(data.goalEvent),
                paceTarget = PaceCalculator.formatPace(vdotPaces.mPaceSec),
                description = "레이스 데이!",
            )
        }

        if (todayDow !in trainingDows) return null
        if (currentWeek < 1 || currentWeek > totalWeeks) return null

        val weekPlan = plan.find { it.weekNumber == currentWeek } ?: return null
        val vp = weekPlan.vdotPaces

        // 훈련일을 요일 순서로 정렬, 롱런은 마지막
        val nonLongDays = trainingDaysList
            .map { toDayOfWeek(it) }
            .filter { it != longRunDow }
            .sortedBy { it.value }
        val orderedDays = nonLongDays + longRunDow

        val position = orderedDays.indexOf(todayDow)
        if (position < 0) return null

        val pattern = getPattern(orderedDays.size, weekPlan.level, weekPlan.phase)
        if (position >= pattern.size) return null

        return when (pattern[position]) {
            "EASY" -> WorkoutDto(
                workoutType = "EASY",
                distanceKm = weekPlan.easyRunKm,
                paceTarget = PaceCalculator.formatPace(vp.ePaceSec),
                description = "편한 페이스 조깅",
            )
            "AR" -> WorkoutDto(
                workoutType = "AR",
                distanceKm = weekPlan.arRunKm,
                paceTarget = PaceCalculator.formatPace(vp.ePaceSec),
                description = "에어로빅 런 ${"%.1f".format(weekPlan.arRunKm)}km - 대화 가능한 편안한 페이스",
            )
            "ACTIVE_RECOVERY" -> {
                val recoveryKm = (weekPlan.easyRunKm * 0.6 * 10).roundToInt() / 10.0
                WorkoutDto(
                    workoutType = "ACTIVE_RECOVERY",
                    distanceKm = recoveryKm,
                    paceTarget = PaceCalculator.formatPace(vp.ePaceSec),
                    description = "회복 조깅 ${recoveryKm}km - 가볍게 풀어주기",
                )
            }
            "INTERVAL" -> {
                val spec = weekPlan.intervalSpec!!
                WorkoutDto(
                    workoutType = "INTERVAL",
                    distanceKm = weekPlan.intervalTotalKm,
                    paceTarget = PaceCalculator.formatPace(vp.iPaceSec),
                    description = "워밍업 2km + ${spec.description()} + 쿨다운 1km",
                )
            }
            "TEMPO" -> {
                val tempoWork = weekPlan.tempoRunKm - 3.0
                WorkoutDto(
                    workoutType = "TEMPO",
                    distanceKm = weekPlan.tempoRunKm,
                    paceTarget = PaceCalculator.formatPace(vp.tPaceSec),
                    description = "워밍업 2km + 템포 ${"%.1f".format(tempoWork)}km + 쿨다운 1km",
                )
            }
            "PACE_RUN" -> WorkoutDto(
                workoutType = "PACE_RUN",
                distanceKm = weekPlan.paceRunKm,
                paceTarget = PaceCalculator.formatPace(vp.mPaceSec),
                description = "페이스런 ${"%.1f".format(weekPlan.paceRunKm)}km",
            )
            "LONG" -> WorkoutDto(
                workoutType = "LONG",
                distanceKm = weekPlan.longRunKm,
                paceTarget = PaceCalculator.formatPace(vp.ePaceSec),
                description = "롱런 ${weekPlan.longRunKm}km",
            )
            else -> null
        }
    }

    private fun getPattern(dayCount: Int, level: PaceCalculator.Level, phase: String): List<String> {
        val clamped = dayCount.coerceIn(3, 6)

        // 페이즈에 따른 기본 패턴 결정
        val base = when {
            // 테이퍼: 모든 레벨 볼륨 축소, 강도 유지
            phase == "TAPER" -> when (level) {
                PaceCalculator.Level.BEGINNER -> when (clamped) {
                    3 -> listOf("EASY", "EASY", "EASY")
                    4 -> listOf("EASY", "EASY", "EASY", "EASY")
                    5 -> listOf("EASY", "EASY", "EASY", "EASY", "EASY")
                    else -> listOf("EASY", "EASY", "EASY", "EASY", "EASY", "EASY")
                }
                else -> when (clamped) {
                    3 -> listOf("EASY", "TEMPO", "EASY")
                    4 -> listOf("EASY", "TEMPO", "EASY", "EASY")
                    5 -> listOf("EASY", "INTERVAL", "EASY", "TEMPO", "EASY")
                    else -> listOf("EASY", "INTERVAL", "EASY", "TEMPO", "EASY", "EASY")
                }
            }

            // 회복: 볼륨 감소
            phase == "RECOVERY" || phase == "CYCLE_RECOVERY" -> when (clamped) {
                3 -> listOf("EASY", "AR", "EASY")
                4 -> listOf("EASY", "AR", "EASY", "EASY")
                5 -> listOf("EASY", "AR", "EASY", "EASY", "EASY")
                else -> listOf("EASY", "AR", "EASY", "EASY", "EASY", "EASY")
            }

            // 빌드업/베이스: E 위주 + 레벨에 따라 T/I 도입
            phase in listOf("BUILD", "BASE") -> when (level) {
                PaceCalculator.Level.BEGINNER -> when (clamped) {
                    3 -> listOf("EASY", "AR", "LONG")
                    4 -> listOf("AR", "EASY", "AR", "LONG")
                    5 -> listOf("AR", "EASY", "AR", "EASY", "LONG")
                    else -> listOf("AR", "EASY", "AR", "EASY", "EASY", "LONG")
                }
                PaceCalculator.Level.INTERMEDIATE -> when (clamped) {
                    3 -> listOf("AR", "TEMPO", "LONG")
                    4 -> listOf("AR", "TEMPO", "EASY", "LONG")
                    5 -> listOf("AR", "INTERVAL", "EASY", "TEMPO", "LONG")
                    else -> listOf("AR", "INTERVAL", "EASY", "TEMPO", "ACTIVE_RECOVERY", "LONG")
                }
                PaceCalculator.Level.ADVANCED -> when (clamped) {
                    3 -> listOf("INTERVAL", "TEMPO", "LONG")
                    4 -> listOf("INTERVAL", "EASY", "TEMPO", "LONG")
                    5 -> listOf("AR", "INTERVAL", "EASY", "TEMPO", "LONG")
                    else -> listOf("AR", "INTERVAL", "EASY", "TEMPO", "ACTIVE_RECOVERY", "LONG")
                }
            }

            // 5주 사이클: 포커스별 패턴
            phase == "CYCLE_SPEED" -> when (clamped) {
                3 -> listOf("EASY", "INTERVAL", "LONG")
                4 -> listOf("EASY", "INTERVAL", "EASY", "LONG")
                5 -> listOf("AR", "INTERVAL", "EASY", "EASY", "LONG")
                else -> listOf("AR", "INTERVAL", "EASY", "EASY", "ACTIVE_RECOVERY", "LONG")
            }
            phase == "CYCLE_THRESHOLD" -> when (clamped) {
                3 -> listOf("EASY", "TEMPO", "LONG")
                4 -> listOf("EASY", "TEMPO", "EASY", "LONG")
                5 -> listOf("AR", "TEMPO", "EASY", "EASY", "LONG")
                else -> listOf("AR", "TEMPO", "EASY", "EASY", "ACTIVE_RECOVERY", "LONG")
            }
            phase == "CYCLE_VO2MAX" -> when (clamped) {
                3 -> listOf("EASY", "INTERVAL", "LONG")
                4 -> listOf("EASY", "INTERVAL", "EASY", "LONG")
                5 -> listOf("AR", "INTERVAL", "EASY", "EASY", "LONG")
                else -> listOf("AR", "INTERVAL", "EASY", "EASY", "ACTIVE_RECOVERY", "LONG")
            }
            phase == "CYCLE_RACE_PACE" -> when (clamped) {
                3 -> listOf("EASY", "PACE_RUN", "LONG")
                4 -> listOf("EASY", "PACE_RUN", "EASY", "LONG")
                5 -> listOf("AR", "PACE_RUN", "EASY", "EASY", "LONG")
                else -> listOf("AR", "PACE_RUN", "EASY", "EASY", "ACTIVE_RECOVERY", "LONG")
            }

            // Develop: T 페이스 도입
            phase == "DEVELOP" -> when (level) {
                PaceCalculator.Level.BEGINNER -> when (clamped) {
                    3 -> listOf("EASY", "TEMPO", "LONG")
                    4 -> listOf("AR", "EASY", "TEMPO", "LONG")
                    5 -> listOf("AR", "EASY", "TEMPO", "EASY", "LONG")
                    else -> listOf("AR", "EASY", "TEMPO", "EASY", "ACTIVE_RECOVERY", "LONG")
                }
                PaceCalculator.Level.INTERMEDIATE -> when (clamped) {
                    3 -> listOf("TEMPO", "EASY", "LONG")
                    4 -> listOf("AR", "TEMPO", "EASY", "LONG")
                    5 -> listOf("AR", "TEMPO", "EASY", "EASY", "LONG")
                    else -> listOf("AR", "TEMPO", "EASY", "EASY", "ACTIVE_RECOVERY", "LONG")
                }
                PaceCalculator.Level.ADVANCED -> when (clamped) {
                    3 -> listOf("TEMPO", "EASY", "LONG")
                    4 -> listOf("TEMPO", "EASY", "INTERVAL", "LONG")
                    5 -> listOf("AR", "TEMPO", "EASY", "INTERVAL", "LONG")
                    else -> listOf("AR", "TEMPO", "EASY", "INTERVAL", "ACTIVE_RECOVERY", "LONG")
                }
            }

            // Peak: I 인터벌 추가, 고강도
            phase == "PEAK" -> when (level) {
                PaceCalculator.Level.BEGINNER -> when (clamped) {
                    3 -> listOf("EASY", "TEMPO", "LONG")
                    4 -> listOf("AR", "EASY", "TEMPO", "LONG")
                    5 -> listOf("AR", "EASY", "TEMPO", "EASY", "LONG")
                    else -> listOf("AR", "EASY", "TEMPO", "EASY", "ACTIVE_RECOVERY", "LONG")
                }
                PaceCalculator.Level.INTERMEDIATE -> when (clamped) {
                    3 -> listOf("INTERVAL", "TEMPO", "LONG")
                    4 -> listOf("AR", "INTERVAL", "TEMPO", "LONG")
                    5 -> listOf("AR", "INTERVAL", "EASY", "TEMPO", "LONG")
                    else -> listOf("AR", "INTERVAL", "EASY", "TEMPO", "ACTIVE_RECOVERY", "LONG")
                }
                PaceCalculator.Level.ADVANCED -> when (clamped) {
                    3 -> listOf("INTERVAL", "TEMPO", "LONG")
                    4 -> listOf("INTERVAL", "EASY", "TEMPO", "LONG")
                    5 -> listOf("AR", "INTERVAL", "EASY", "TEMPO", "LONG")
                    else -> listOf("AR", "INTERVAL", "EASY", "TEMPO", "ACTIVE_RECOVERY", "LONG")
                }
            }

            // 기본 폴백
            else -> when (level) {
                PaceCalculator.Level.BEGINNER -> when (clamped) {
                    3 -> listOf("EASY", "AR", "LONG")
                    4 -> listOf("AR", "EASY", "AR", "LONG")
                    5 -> listOf("AR", "EASY", "AR", "EASY", "LONG")
                    else -> listOf("AR", "EASY", "AR", "EASY", "EASY", "LONG")
                }
                else -> when (clamped) {
                    3 -> listOf("INTERVAL", "TEMPO", "LONG")
                    4 -> listOf("AR", "INTERVAL", "TEMPO", "LONG")
                    5 -> listOf("AR", "INTERVAL", "EASY", "TEMPO", "LONG")
                    else -> listOf("AR", "INTERVAL", "EASY", "TEMPO", "ACTIVE_RECOVERY", "LONG")
                }
            }
        }

        if (dayCount > 6) {
            return List(dayCount - 6) { "EASY" } + base
        }
        return base
    }

    private fun calculateCalories(
        bodyWeight: Double,
        distanceToday: Double,
        workoutTypeToday: String?,
        distanceTomorrow: Double,
        workoutTypeTomorrow: String?,
        targetWeight: Double?,
        targetDate: LocalDate,
        today: LocalDate,
    ): CaloriesDto {
        val bmr = (bodyWeight * 24).toInt()
        val trainingBurn = (distanceToday * bodyWeight * 1.0).toInt()
        val typeToday = workoutTypeToday ?: "REST"

        val intensityBonus = when (typeToday) {
            "REST" -> 0
            "ACTIVE_RECOVERY" -> trainingBurn
            "EASY", "AR" -> trainingBurn
            "TEMPO", "PACE_RUN" -> trainingBurn
            "INTERVAL" -> trainingBurn
            "LONG" -> trainingBurn
            "RACE" -> trainingBurn
            else -> trainingBurn
        }

        val typeTomorrow = workoutTypeTomorrow ?: "REST"
        val isHighIntensityTomorrow = typeTomorrow in listOf("INTERVAL", "LONG")
        val carbLoadingRecommended = isHighIntensityTomorrow

        val tomorrowPrep = if (isHighIntensityTomorrow) {
            (distanceTomorrow * bodyWeight * 0.3 + 200).toInt()
        } else 0

        val weightToLose: Double
        val dietDaysRemaining: Int
        val dailyDeficit: Int

        if (targetWeight == null || bodyWeight <= targetWeight) {
            dailyDeficit = 0
            weightToLose = 0.0
            dietDaysRemaining = 0
        } else {
            val dietEndDate = targetDate.minusDays(7)
            val days = ChronoUnit.DAYS.between(today, dietEndDate).toInt().coerceAtLeast(0)
            weightToLose = bodyWeight - targetWeight
            dietDaysRemaining = days

            // 롱런 전날에만 적자 면제
            val isBeforeLongRun = typeTomorrow == "LONG"
            dailyDeficit = if (isBeforeLongRun) 0 else 500
        }

        // BMR를 최저선으로 보장
        val totalRecommended = maxOf(bmr, bmr + intensityBonus + tomorrowPrep - dailyDeficit)

        return CaloriesDto(
            bmr = bmr,
            trainingBurn = trainingBurn,
            intensityBonus = intensityBonus,
            tomorrowPrep = tomorrowPrep,
            dailyDeficit = dailyDeficit,
            totalRecommended = totalRecommended,
            targetWeight = targetWeight,
            weightToLose = weightToLose,
            dietDaysRemaining = dietDaysRemaining,
            tomorrowWorkoutType = workoutTypeTomorrow,
            carbLoadingRecommended = carbLoadingRecommended,
        )
    }

    private fun getProfileData(userId: Long): ProfileData {
        val p = userProfileRepository.findByUserId(userId) ?: throw RuntimeException("Profile not found")
        return ProfileData(
            goalEvent = p.goalEvent,
            goalTimeSeconds = p.goalTimeSeconds,
            targetDate = p.targetDate,
            trainingDays = p.trainingDays,
            longRunDay = p.longRunDay,
            bodyWeight = p.bodyWeight,
            targetWeight = p.targetWeight,
        )
    }

    private fun toDayOfWeek(day: String): DayOfWeek = when (day.uppercase()) {
        "MON" -> DayOfWeek.MONDAY
        "TUE" -> DayOfWeek.TUESDAY
        "WED" -> DayOfWeek.WEDNESDAY
        "THU" -> DayOfWeek.THURSDAY
        "FRI" -> DayOfWeek.FRIDAY
        "SAT" -> DayOfWeek.SATURDAY
        "SUN" -> DayOfWeek.SUNDAY
        else -> throw IllegalArgumentException("Invalid day: $day")
    }
}
