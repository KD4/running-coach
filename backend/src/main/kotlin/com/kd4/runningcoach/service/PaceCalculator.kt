package com.kd4.runningcoach.service

import org.springframework.stereotype.Component
import kotlin.math.min
import kotlin.math.roundToInt

@Component
class PaceCalculator {

    enum class Level { BEGINNER, INTERMEDIATE, ADVANCED }

    data class Paces(
        val racePaceSec: Int,
        val jogPaceSec: Int,
        val longRunPaceSec: Int,
        val tempoPaceSec: Int,
        val intervalPaceSec: Int,
        val paceRunPaceSec: Int,
        val arPaceSec: Int,
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
        val paces: Paces,
        val level: Level,
        val longRunKm: Double,
        val easyRunKm: Double,
        val tempoRunKm: Double,
        val paceRunKm: Double,
        val arRunKm: Double,
        val intervalSpec: IntervalSpec?,
        val intervalTotalKm: Double,
        val blockPosition: Int,
        val volumeMultiplier: Double,
    )

    fun raceDistanceKm(goalEvent: String): Double = when (goalEvent) {
        "10K" -> 10.0
        "HALF" -> 21.0975
        "MARATHON" -> 42.195
        else -> 42.195
    }

    fun defaultTotalWeeks(goalEvent: String): Int = when (goalEvent) {
        "10K" -> 8
        "HALF" -> 10
        "MARATHON" -> 12
        else -> 12
    }

    fun determineLevel(racePaceSec: Int): Level = when {
        racePaceSec >= 540 -> Level.BEGINNER
        racePaceSec < 390 -> Level.ADVANCED
        else -> Level.INTERMEDIATE
    }

    fun calculatePaces(goalTimeSeconds: Int, goalEvent: String): Paces {
        val mp = goalTimeSeconds.toDouble() / raceDistanceKm(goalEvent)
        return Paces(
            racePaceSec = mp.roundToInt(),
            jogPaceSec = (mp + 75).roundToInt(),
            longRunPaceSec = (mp + 52).roundToInt(),
            tempoPaceSec = (mp - 12).roundToInt(),
            intervalPaceSec = (mp - 25).roundToInt(),
            paceRunPaceSec = (mp + 15).roundToInt(),
            arPaceSec = (mp + 62).roundToInt(),
        )
    }

    fun generatePlan(goalTimeSeconds: Int, goalEvent: String, totalWeeks: Int): List<WeeklyPlan> {
        val paces = calculatePaces(goalTimeSeconds, goalEvent)
        val level = determineLevel(paces.racePaceSec)

        return (1..totalWeeks).map { week ->
            val isTaper = week > totalWeeks - 2
            val blockPosition = ((week - 1) % 4) + 1
            val blockNumber = (week - 1) / 4

            val positionMultiplier = when (blockPosition) {
                1 -> 0.8   // 적응
                2 -> 1.0   // 발전
                3 -> 1.1   // 강화
                4 -> 0.7   // 회복
                else -> 1.0
            }
            val blockBaseMultiplier = 1.0 + blockNumber * 0.05

            val volumeMultiplier = if (isTaper) 0.5
                                   else positionMultiplier * blockBaseMultiplier

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

            val spec = if (level == Level.BEGINNER) null
                       else getIntervalSpec(week, totalWeeks, level)

            val baseEasyKm = easyRunKm(goalEvent, week)

            WeeklyPlan(
                weekNumber = week,
                paces = paces,
                level = level,
                longRunKm = round1(longRunKm(goalEvent, week, totalWeeks) * longRunRatio * volumeMultiplier),
                easyRunKm = round1(baseEasyKm * levelRatio * volumeMultiplier),
                tempoRunKm = round1(tempoRunKm(goalEvent, week) * levelRatio * volumeMultiplier),
                paceRunKm = round1(tempoRunKm(goalEvent, week) * levelRatio * volumeMultiplier),
                arRunKm = round1(baseEasyKm * 1.2 * levelRatio * volumeMultiplier),
                intervalSpec = spec,
                intervalTotalKm = if (spec != null) round1(spec.totalKm()) else 0.0,
                blockPosition = blockPosition,
                volumeMultiplier = round1(volumeMultiplier),
            )
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
