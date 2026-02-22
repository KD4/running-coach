package com.kd4.runningcoach.dto

import java.time.LocalDate

data class TodayResponse(
    val date: LocalDate,
    val weekNumber: Int,
    val totalWeeks: Int,
    val workout: WorkoutDto?,
    val calories: CaloriesDto,
    val isRestDay: Boolean,
)

data class WorkoutDto(
    val workoutType: String,
    val distanceKm: Double,
    val paceTarget: String?,
    val description: String?,
)

data class CaloriesDto(
    val bmr: Int,
    val trainingBurn: Int,
    val intensityBonus: Int,
    val tomorrowPrep: Int,
    val dailyDeficit: Int,
    val totalRecommended: Int,
    val targetWeight: Double?,
    val weightToLose: Double,
    val dietDaysRemaining: Int,
    val tomorrowWorkoutType: String?,
    val carbLoadingRecommended: Boolean,
)

data class MonthlyScheduleResponse(
    val year: Int,
    val month: Int,
    val days: List<ScheduleDayDto>,
)

data class ScheduleDayDto(
    val date: LocalDate,
    val weekNumber: Int,
    val workout: WorkoutDto?,
    val isRestDay: Boolean,
    val isTrainingDay: Boolean,
)

// --- 스케줄 계산에 필요한 프로필 데이터 (DB UserProfile / 게스트 공용) ---
data class ProfileData(
    val goalEvent: String,
    val goalTimeSeconds: Int,
    val targetDate: LocalDate,
    val trainingDays: String,   // comma-separated: "TUE,THU,SAT"
    val longRunDay: String,
    val bodyWeight: Double,
    val targetWeight: Double? = null,
)

// --- Guest 요청 DTO ---
data class GuestTodayRequest(
    val goalEvent: String,
    val goalTimeSeconds: Int,
    val targetDate: LocalDate,
    val trainingDays: List<String>,
    val longRunDay: String,
    val bodyWeight: Double,
    val targetWeight: Double? = null,
) {
    fun toProfileData() = ProfileData(
        goalEvent = goalEvent,
        goalTimeSeconds = goalTimeSeconds,
        targetDate = targetDate,
        trainingDays = trainingDays.joinToString(","),
        longRunDay = longRunDay,
        bodyWeight = bodyWeight,
        targetWeight = targetWeight,
    )
}

data class GuestMonthlyRequest(
    val goalEvent: String,
    val goalTimeSeconds: Int,
    val targetDate: LocalDate,
    val trainingDays: List<String>,
    val longRunDay: String,
    val bodyWeight: Double,
    val targetWeight: Double? = null,
    val year: Int,
    val month: Int,
) {
    fun toProfileData() = ProfileData(
        goalEvent = goalEvent,
        goalTimeSeconds = goalTimeSeconds,
        targetDate = targetDate,
        trainingDays = trainingDays.joinToString(","),
        longRunDay = longRunDay,
        bodyWeight = bodyWeight,
        targetWeight = targetWeight,
    )
}
