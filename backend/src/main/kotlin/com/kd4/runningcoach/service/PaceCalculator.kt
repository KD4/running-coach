package com.kd4.runningcoach.service

import org.springframework.stereotype.Component
import java.time.LocalDate
import java.time.temporal.ChronoUnit
import kotlin.math.min
import kotlin.math.roundToInt

@Component
class PaceCalculator {

    enum class Level { BEGINNER, INTERMEDIATE, ADVANCED }

    data class PlanSelection(
        val totalWeeks: Int,
        val currentWeek: Int,
    )

    data class VdotPaces(
        val ePaceSec: Int,   // Easy
        val arPaceSec: Int,  // Aerobic Run (MP + 50)
        val mPaceSec: Int,   // Marathon
        val tPaceSec: Int,   // Threshold
        val iPaceSec: Int,   // Interval
        val rPaceSec: Int,   // Repetition
    )

    data class IntervalSpec(
        val intervalDistanceM: Int,
        val reps: Int,
        val recoveryDistanceM: Int,
    ) {
        fun totalKm(): Double {
            val workM = intervalDistanceM * reps + recoveryDistanceM * (reps - 1)
            return 2.0 + workM / 1000.0 + 1.0
        }

        fun description(): String =
            "${intervalDistanceM}m × ${reps}개, 세트 간 ${recoveryDistanceM}m 회복 조깅"
    }

    data class WeeklyPlan(
        val weekNumber: Int,
        val vdotPaces: VdotPaces,
        val level: Level,
        val longRunKm: Double,
        val easyRunKm: Double,
        val tempoRunKm: Double,
        val paceRunKm: Double,
        val arRunKm: Double,
        val intervalSpec: IntervalSpec?,
        val intervalTotalKm: Double,
        val repetitionSpec: IntervalSpec?,
        val repetitionTotalKm: Double,
        val phase: String,
        val volumeMultiplier: Double,
    )

    /**
     * 대회까지 남은 주수에 따라 통합 플랜의 totalWeeks와 currentWeek을 결정한다.
     *
     * - 18주 이하: 순수 18주 메인 플랜 (currentWeek = 18 - weeksToRace + 1)
     * - 19주+: 5주 순환 사이클 + 18주 메인 플랜 통합
     *   cycleWeeks = ceil((weeksToRace - 18) / 5) * 5  (5주 단위 올림)
     *   totalWeeks = cycleWeeks + 18
     *   currentWeek = totalWeeks - weeksToRace + 1
     *
     * 5주 단위 올림 덕분에 totalWeeks가 5주간 안정적으로 유지된다.
     * 예) 대회 25주 전: cycleWeeks=10, totalWeeks=28, currentWeek=4
     */
    fun determinePlanType(targetDate: LocalDate, today: LocalDate): PlanSelection {
        val weeksToRace = ChronoUnit.WEEKS.between(today, targetDate).toInt().coerceAtLeast(0)

        return if (weeksToRace <= 18) {
            PlanSelection(
                totalWeeks = 18,
                currentWeek = (18 - weeksToRace + 1).coerceIn(1, 18),
            )
        } else {
            val excess = weeksToRace - 18
            val cycleWeeks = ((excess + 4) / 5) * 5  // 5주 단위 올림
            val totalWeeks = cycleWeeks + 18
            PlanSelection(
                totalWeeks = totalWeeks,
                currentWeek = (totalWeeks - weeksToRace + 1).coerceIn(1, totalWeeks),
            )
        }
    }

    fun calculateVdotPaces(goalTimeSeconds: Int, goalEvent: String): VdotPaces {
        val mp = goalTimeSeconds.toDouble() / raceDistanceKm(goalEvent)
        return VdotPaces(
            ePaceSec = (mp + 75).roundToInt(),   // Easy
            arPaceSec = (mp + 50).roundToInt(),  // Aerobic Run
            mPaceSec = mp.roundToInt(),           // Marathon
            tPaceSec = (mp - 12).roundToInt(),    // Threshold
            iPaceSec = (mp - 27).roundToInt(),    // Interval
            rPaceSec = (mp - 43).roundToInt(),    // Repetition
        )
    }

    fun raceDistanceKm(goalEvent: String): Double = when (goalEvent) {
        "10K" -> 10.0
        "HALF" -> 21.0975
        "MARATHON" -> 42.195
        else -> 42.195
    }

    fun determineLevel(racePaceSec: Int): Level = when {
        racePaceSec >= 540 -> Level.BEGINNER
        racePaceSec < 390 -> Level.ADVANCED
        else -> Level.INTERMEDIATE
    }

    fun generatePlan(goalTimeSeconds: Int, goalEvent: String, totalWeeks: Int): List<WeeklyPlan> {
        val vdotPaces = calculateVdotPaces(goalTimeSeconds, goalEvent)
        val level = determineLevel(vdotPaces.mPaceSec)

        return (1..totalWeeks).map { week ->
            generateWeeklyPlan(week, totalWeeks, goalEvent, vdotPaces, level)
        }
    }

    private fun generateWeeklyPlan(
        week: Int,
        totalWeeks: Int,
        goalEvent: String,
        vdotPaces: VdotPaces,
        level: Level,
    ): WeeklyPlan {
        val cycleWeeks = (totalWeeks - 18).coerceAtLeast(0)
        val isCycleWeek = week <= cycleWeeks
        val mainWeek = if (isCycleWeek) 0 else week - cycleWeeks  // 1..18 for main, 0 for cycle

        val phase = determinePhase(week, totalWeeks)
        val baseVolume = phaseVolumeMultiplier(phase, if (isCycleWeek) 1 else mainWeek)
        val undulating = if (isCycleWeek) 1.0 else undulatingVolumeMultiplier(mainWeek)
        val volumeMultiplier = baseVolume * undulating

        val levelRatio = when (level) {
            Level.BEGINNER -> 0.7
            Level.INTERMEDIATE -> 1.0
            Level.ADVANCED -> 1.0
        }
        val longRunRatio = when (level) {
            Level.BEGINNER -> 0.7
            Level.INTERMEDIATE -> 1.0
            Level.ADVANCED -> 1.1
        }

        // 사이클 주차: 초반 BASE 수준(week 3)의 거리, 메인 주차: 주차별 점진 증가
        val distanceWeek = if (isCycleWeek) 3 else mainWeek

        val spec = if (level == Level.BEGINNER) null
                   else getIntervalSpec(distanceWeek, 18, level)

        // R페이스 스펙: BASE_SPEED, CYCLE_SPEED, CYCLE_VO2MAX에서만
        val repPhases = setOf("BASE_SPEED", "CYCLE_SPEED", "CYCLE_VO2MAX")
        val repSpec = if (phase in repPhases) getRepetitionSpec(if (isCycleWeek) 5 else mainWeek, level) else null

        val baseEasyKm = easyRunKm(goalEvent, distanceWeek)

        return WeeklyPlan(
            weekNumber = week,
            vdotPaces = vdotPaces,
            level = level,
            longRunKm = round1(longRunKm(goalEvent, distanceWeek, 18) * longRunRatio * volumeMultiplier),
            easyRunKm = round1(baseEasyKm * levelRatio * volumeMultiplier),
            tempoRunKm = round1(tempoRunKm(goalEvent, distanceWeek) * levelRatio * volumeMultiplier),
            paceRunKm = round1(tempoRunKm(goalEvent, distanceWeek) * levelRatio * volumeMultiplier),
            arRunKm = round1(baseEasyKm * 1.2 * levelRatio * volumeMultiplier),
            intervalSpec = spec,
            intervalTotalKm = if (spec != null) round1(spec.totalKm()) else 0.0,
            repetitionSpec = repSpec,
            repetitionTotalKm = if (repSpec != null) round1(repSpec.totalKm()) else 0.0,
            phase = phase,
            volumeMultiplier = round1(volumeMultiplier),
        )
    }

    /**
     * 통합 플랜 페이즈 결정:
     * - totalWeeks > 18: 처음 (totalWeeks-18)주는 5주 순환 사이클, 나머지 18주는 메인 플랜
     * - totalWeeks == 18: 순수 18주 메인 플랜
     *
     * 사이클: CYCLE_SPEED → CYCLE_THRESHOLD → CYCLE_VO2MAX → CYCLE_RACE_PACE → CYCLE_RECOVERY (5주 반복)
     * 메인: BASE(1-6) → DEVELOP(7-12) → PEAK(13-16) → TAPER(17-18)
     */
    fun determinePhase(week: Int, totalWeeks: Int): String {
        val cycleWeeks = (totalWeeks - 18).coerceAtLeast(0)

        if (week <= cycleWeeks) {
            val cyclePos = ((week - 1) % 5) + 1
            return when (cyclePos) {
                1 -> "CYCLE_SPEED"
                2 -> "CYCLE_THRESHOLD"
                3 -> "CYCLE_VO2MAX"
                4 -> "CYCLE_RACE_PACE"
                5 -> "CYCLE_RECOVERY"
                else -> "CYCLE_RECOVERY"
            }
        }

        val mainWeek = week - cycleWeeks
        return when {
            mainWeek <= 3 -> "BASE_FOUNDATION"
            mainWeek <= 6 -> "BASE_SPEED"
            mainWeek <= 12 -> "DEVELOP"
            mainWeek <= 16 -> "PEAK"
            else -> "TAPER"  // 17-18
        }
    }

    private fun phaseVolumeMultiplier(phase: String, mainWeek: Int): Double {
        return when (phase) {
            "BUILD", "BASE" -> 0.8 + (mainWeek - 1) * 0.05
            "BASE_FOUNDATION" -> 0.8 + (mainWeek - 1) * 0.05
            "BASE_SPEED" -> 0.8 + (mainWeek - 1) * 0.05
            "DEVELOP" -> 1.0
            "PEAK" -> 1.1
            "RECOVERY" -> 0.7
            "TAPER" -> 0.5
            "CYCLE_RECOVERY" -> 0.7
            "CYCLE_SPEED", "CYCLE_THRESHOLD", "CYCLE_VO2MAX", "CYCLE_RACE_PACE" -> 0.9
            else -> 1.0
        }
    }

    private fun undulatingVolumeMultiplier(mainWeek: Int): Double {
        return when (mainWeek) {
            4 -> 0.7     // 리커버리 (BASE_SPEED 진입)
            10 -> 0.7    // 리커버리 (DEVELOP 중간)
            16 -> 0.8    // 프리테이퍼 (PEAK 마지막)
            else -> 1.0
        }
    }

    fun getRepetitionSpec(mainWeek: Int, level: Level): IntervalSpec? {
        if (level == Level.BEGINNER) return null

        return when (level) {
            Level.INTERMEDIATE -> when {
                mainWeek <= 6 -> IntervalSpec(200, 8, 200)
                mainWeek <= 10 -> IntervalSpec(200, 10, 200)
                else -> IntervalSpec(300, 8, 200)
            }
            Level.ADVANCED -> when {
                mainWeek <= 6 -> IntervalSpec(200, 10, 200)
                mainWeek <= 10 -> IntervalSpec(300, 10, 200)
                else -> IntervalSpec(400, 8, 200)
            }
            else -> null
        }
    }

    fun getIntervalSpec(week: Int, totalWeeks: Int, level: Level): IntervalSpec {
        val isTaper = week > totalWeeks - 2
        if (isTaper) {
            return when (level) {
                Level.ADVANCED -> IntervalSpec(400, 5, 130)
                else -> IntervalSpec(400, 4, 200)
            }
        }

        return when (level) {
            Level.INTERMEDIATE -> when {
                week <= 4 -> IntervalSpec(400, 8, 200)
                week <= 8 -> IntervalSpec(800, 6, 400)
                week <= 12 -> IntervalSpec(1000, 5, 400)
                else -> IntervalSpec(1600, 4, 600)
            }
            Level.ADVANCED -> when {
                week <= 4 -> IntervalSpec(800, (8 * 1.2).roundToInt(), 300)
                week <= 8 -> IntervalSpec(1000, (6 * 1.2).roundToInt(), 300)
                week <= 12 -> IntervalSpec(1600, (5 * 1.2).roundToInt(), 500)
                else -> IntervalSpec(1600, (4 * 1.2).roundToInt(), 500)
            }
            else -> IntervalSpec(400, 4, 200)
        }
    }

    // --- Long Run Distance (taper handled by volumeMultiplier externally) ---
    private fun longRunKm(goalEvent: String, week: Int, totalWeeks: Int): Double {
        val (start, step, cap) = when (goalEvent) {
            "10K" -> Triple(6.0, 0.5, 12.0)
            "HALF" -> Triple(10.0, 1.5, 21.0)
            "MARATHON" -> Triple(16.0, 2.0, 32.0)
            else -> Triple(16.0, 2.0, 32.0)
        }
        return min(start + (week - 1) * step, cap)
    }

    // --- Easy Run Distance ---
    private fun easyRunKm(goalEvent: String, week: Int): Double {
        val (base, step, cap) = when (goalEvent) {
            "10K" -> Triple(4.0, 0.25, 6.0)
            "HALF" -> Triple(5.0, 0.25, 8.0)
            "MARATHON" -> Triple(6.0, 0.25, 10.0)
            else -> Triple(6.0, 0.25, 10.0)
        }
        return min(base + (week - 1) * step, cap)
    }

    // --- Tempo Run Distance (warmup 2km + tempo work + cooldown 1km) ---
    private fun tempoRunKm(goalEvent: String, week: Int): Double {
        val (base, step, cap) = when (goalEvent) {
            "10K" -> Triple(3.0, 0.5, 6.0)
            "HALF" -> Triple(4.0, 0.5, 8.0)
            "MARATHON" -> Triple(5.0, 0.5, 10.0)
            else -> Triple(5.0, 0.5, 10.0)
        }
        val tempoWork = min(base + (week - 1) * step, cap)
        return 2.0 + tempoWork + 1.0
    }

    private fun round1(v: Double): Double = (v * 10).roundToInt() / 10.0

    companion object {
        fun formatPace(totalSeconds: Int): String {
            val m = totalSeconds / 60
            val s = totalSeconds % 60
            return "%d:%02d".format(m, s)
        }
    }
}
