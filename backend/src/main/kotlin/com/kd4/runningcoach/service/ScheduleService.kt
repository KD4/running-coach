package com.kd4.runningcoach.service

import com.kd4.runningcoach.dto.*
import com.kd4.runningcoach.repository.UserProfileRepository
import org.springframework.stereotype.Service
import java.time.DayOfWeek
import java.time.LocalDate
import java.time.temporal.ChronoUnit

@Service
class ScheduleService(
    private val userProfileRepository: UserProfileRepository,
    private val paceCalculator: PaceCalculator,
) {

    // --- 로그인 유저용 ---
    fun getToday(userId: Long, date: LocalDate = LocalDate.now()): TodayResponse {
        return calculateToday(getProfileData(userId), date)
    }

    fun getMonthlySchedule(userId: Long, year: Int, month: Int): MonthlyScheduleResponse {
        return calculateMonthly(getProfileData(userId), year, month)
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
        val totalWeeks = paceCalculator.defaultTotalWeeks(data.goalEvent)
        val currentWeek = calculateCurrentWeek(data.targetDate, totalWeeks, date)
        val plan = paceCalculator.generatePlan(data.goalTimeSeconds, data.goalEvent, totalWeeks)

        val workout = getWorkoutForDate(data, date, currentWeek, totalWeeks, plan)

        val distanceToday = workout?.distanceKm ?: 0.0
        val tomorrowWeek = calculateCurrentWeek(data.targetDate, totalWeeks, date.plusDays(1))
        val tomorrowWorkout = getWorkoutForDate(data, date.plusDays(1), tomorrowWeek, totalWeeks, plan)
        val distanceTomorrow = tomorrowWorkout?.distanceKm ?: 0.0

        val calories = calculateCalories(data.bodyWeight, distanceToday, distanceTomorrow, data.targetWeight, data.targetDate, date)

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
        val totalWeeks = paceCalculator.defaultTotalWeeks(data.goalEvent)
        val plan = paceCalculator.generatePlan(data.goalTimeSeconds, data.goalEvent, totalWeeks)
        val trainingDaysOfWeek = data.trainingDays.split(",").map { toDayOfWeek(it) }

        val startDate = LocalDate.of(year, month, 1)
        val endDate = startDate.withDayOfMonth(startDate.lengthOfMonth())

        val days = mutableListOf<ScheduleDayDto>()
        var current = startDate
        while (!current.isAfter(endDate)) {
            val currentWeek = calculateCurrentWeek(data.targetDate, totalWeeks, current)
            val isTrainingDay = current.dayOfWeek in trainingDaysOfWeek
            val workout = getWorkoutForDate(data, current, currentWeek, totalWeeks, plan)

            days.add(ScheduleDayDto(
                date = current,
                weekNumber = currentWeek.coerceIn(1, totalWeeks),
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
        val trainingDaysList = data.trainingDays.split(",")
        val longRunDow = toDayOfWeek(data.longRunDay)
        val todayDow = date.dayOfWeek
        val trainingDows = trainingDaysList.map { toDayOfWeek(it) }

        if (todayDow !in trainingDows) return null
        if (currentWeek < 1 || currentWeek > totalWeeks) return null

        val weekPlan = plan.find { it.weekNumber == currentWeek } ?: return null
        val paces = weekPlan.paces

        if (todayDow == longRunDow) {
            if (currentWeek == totalWeeks) {
                return WorkoutDto(
                    workoutType = "RACE",
                    distanceKm = paceCalculator.raceDistanceKm(data.goalEvent),
                    paceTarget = PaceCalculator.formatPace(paces.racePaceSec),
                    description = "레이스 데이!",
                )
            }
            return WorkoutDto(
                workoutType = "LONG",
                distanceKm = weekPlan.longRunKm,
                paceTarget = PaceCalculator.formatPace(paces.longRunPaceSec),
                description = "롱런 ${weekPlan.longRunKm}km",
            )
        }

        val nonLongRunDays = trainingDaysList
            .filter { toDayOfWeek(it) != longRunDow }
            .map { toDayOfWeek(it) }

        val index = nonLongRunDays.indexOf(todayDow)
        if (index < 0) return null

        val slot = index % 3
        return when (slot) {
            0 -> WorkoutDto(
                workoutType = "EASY",
                distanceKm = weekPlan.easyRunKm,
                paceTarget = PaceCalculator.formatPace(paces.jogPaceSec),
                description = "편한 페이스 조깅",
            )
            1 -> {
                // 같은 주 안에서 hard slot이 여러 번이면 TEMPO/INTERVAL 교대
                val hardSlotOccurrence = (0..index).count { it % 3 == 1 } - 1
                val isTempoFirst = currentWeek % 2 == 1
                val isTempo = if (hardSlotOccurrence % 2 == 0) isTempoFirst else !isTempoFirst

                if (isTempo) {
                    val tempoWork = weekPlan.tempoRunKm - 3.0
                    WorkoutDto(
                        workoutType = "TEMPO",
                        distanceKm = weekPlan.tempoRunKm,
                        paceTarget = PaceCalculator.formatPace(paces.tempoPaceSec),
                        description = "워밍업 2km + 템포 ${"%.1f".format(tempoWork)}km + 쿨다운 1km",
                    )
                } else {
                    val intervalWork = weekPlan.intervalRunKm - 3.0
                    WorkoutDto(
                        workoutType = "INTERVAL",
                        distanceKm = weekPlan.intervalRunKm,
                        paceTarget = PaceCalculator.formatPace(paces.intervalPaceSec),
                        description = "워밍업 2km + 인터벌 ${"%.1f".format(intervalWork)}km + 쿨다운 1km",
                    )
                }
            }
            2 -> WorkoutDto(
                workoutType = "EASY",
                distanceKm = weekPlan.easyRunKm,
                paceTarget = PaceCalculator.formatPace(paces.jogPaceSec),
                description = "회복 조깅",
            )
            else -> null
        }
    }

    private fun calculateCalories(
        bodyWeight: Double,
        distanceToday: Double,
        distanceTomorrow: Double,
        targetWeight: Double?,
        targetDate: LocalDate,
        today: LocalDate,
    ): CaloriesDto {
        val bmr = (bodyWeight * 24).toInt()
        val trainingBurn = (distanceToday * bodyWeight * 1.0).toInt()
        val tomorrowPrep = (distanceTomorrow * bodyWeight * 1.0 * 0.5).toInt()
        val baseCalories = bmr + trainingBurn + tomorrowPrep

        val dailyDeficit: Int
        val weightToLose: Double
        val dietDaysRemaining: Int

        if (targetWeight == null || bodyWeight <= targetWeight) {
            dailyDeficit = 0
            weightToLose = 0.0
            dietDaysRemaining = 0
        } else {
            val dietEndDate = targetDate.minusDays(7)
            val days = ChronoUnit.DAYS.between(today, dietEndDate).toInt().coerceAtLeast(0)
            weightToLose = bodyWeight - targetWeight
            val totalDeficit = (weightToLose * 7700).toInt()
            val rawDeficit = if (days > 0) totalDeficit / days else 0
            dailyDeficit = rawDeficit.coerceAtMost(trainingBurn + tomorrowPrep)
            dietDaysRemaining = days
        }

        val totalRecommended = baseCalories - dailyDeficit

        return CaloriesDto(
            bmr = bmr,
            trainingBurn = trainingBurn,
            tomorrowPrep = tomorrowPrep,
            dailyDeficit = dailyDeficit,
            totalRecommended = totalRecommended,
            targetWeight = targetWeight,
            weightToLose = weightToLose,
            dietDaysRemaining = dietDaysRemaining,
        )
    }

    private fun calculateCurrentWeek(targetDate: LocalDate, totalWeeks: Int, today: LocalDate): Int {
        val weeksUntilTarget = ChronoUnit.WEEKS.between(today, targetDate).toInt()
        return totalWeeks - weeksUntilTarget
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
