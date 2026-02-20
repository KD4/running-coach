package com.kd4.runningcoach.service

import org.springframework.stereotype.Component
import kotlin.math.min
import kotlin.math.roundToInt

@Component
class PaceCalculator {

    data class Paces(
        val racePaceSec: Int,
        val jogPaceSec: Int,
        val longRunPaceSec: Int,
        val tempoPaceSec: Int,
        val intervalPaceSec: Int,
    )

    data class WeeklyPlan(
        val weekNumber: Int,
        val paces: Paces,
        val longRunKm: Double,
        val easyRunKm: Double,
        val tempoRunKm: Double,
        val intervalRunKm: Double,
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

    fun calculatePaces(goalTimeSeconds: Int, goalEvent: String): Paces {
        val mp = goalTimeSeconds.toDouble() / raceDistanceKm(goalEvent)
        return Paces(
            racePaceSec = mp.roundToInt(),
            jogPaceSec = (mp + 75).roundToInt(),
            longRunPaceSec = (mp + 52).roundToInt(),
            tempoPaceSec = (mp - 12).roundToInt(),
            intervalPaceSec = (mp - 25).roundToInt(),
        )
    }

    fun generatePlan(goalTimeSeconds: Int, goalEvent: String, totalWeeks: Int): List<WeeklyPlan> {
        val paces = calculatePaces(goalTimeSeconds, goalEvent)
        val beginnerRatio = if (paces.racePaceSec >= 540) 0.9 else 1.0

        return (1..totalWeeks).map { week ->
            val isTaper = week > totalWeeks - 2
            val taperRatio = if (isTaper) 0.5 else 1.0
            val ratio = taperRatio * beginnerRatio

            WeeklyPlan(
                weekNumber = week,
                paces = paces,
                longRunKm = round1(longRunKm(goalEvent, week, totalWeeks) * beginnerRatio),
                easyRunKm = round1(easyRunKm(goalEvent, week) * ratio),
                tempoRunKm = round1(tempoRunKm(goalEvent, week) * ratio),
                intervalRunKm = round1(intervalRunKm(goalEvent, week) * ratio),
            )
        }
    }

    // --- Long Run Distance ---
    // Marathon: 16km start, +2km/week, max 32km, last 2 weeks taper 50%
    // Half:    10km start, +1.5km/week, max 21km
    // 10K:     6km start, +0.5km/week, max 12km
    private fun longRunKm(goalEvent: String, week: Int, totalWeeks: Int): Double {
        val (start, step, cap) = when (goalEvent) {
            "10K" -> Triple(6.0, 0.5, 12.0)
            "HALF" -> Triple(10.0, 1.5, 21.0)
            "MARATHON" -> Triple(16.0, 2.0, 32.0)
            else -> Triple(16.0, 2.0, 32.0)
        }
        val base = min(start + (week - 1) * step, cap)
        val isTaper = week > totalWeeks - 2
        return round1(if (isTaper) base * 0.5 else base)
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
        return 2.0 + tempoWork + 1.0  // warmup + work + cooldown
    }

    // --- Interval Run Distance (warmup 2km + interval work + cooldown 1km) ---
    private fun intervalRunKm(goalEvent: String, week: Int): Double {
        val (base, step, cap) = when (goalEvent) {
            "10K" -> Triple(2.0, 0.3, 5.0)
            "HALF" -> Triple(3.0, 0.4, 6.0)
            "MARATHON" -> Triple(4.0, 0.4, 8.0)
            else -> Triple(4.0, 0.4, 8.0)
        }
        val intervalWork = min(base + (week - 1) * step, cap)
        return 2.0 + intervalWork + 1.0
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
