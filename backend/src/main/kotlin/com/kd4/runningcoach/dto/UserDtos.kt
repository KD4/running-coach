package com.kd4.runningcoach.dto

import java.time.LocalDate

data class OnboardingRequest(
    val goalEvent: String,
    val goalTimeSeconds: Int,
    val targetDate: LocalDate,
    val trainingDays: List<String>,
    val longRunDay: String,
    val bodyWeight: Double,
    val targetWeight: Double? = null,
)

data class ProfileResponse(
    val goalEvent: String,
    val goalTimeSeconds: Int,
    val targetDate: LocalDate,
    val trainingDays: List<String>,
    val longRunDay: String,
    val bodyWeight: Double,
    val targetWeight: Double? = null,
)

data class ProfileUpdateRequest(
    val goalEvent: String?,
    val goalTimeSeconds: Int?,
    val targetDate: LocalDate?,
    val trainingDays: List<String>?,
    val longRunDay: String?,
    val bodyWeight: Double?,
    val targetWeight: Double? = null,
)
