package com.kd4.runningcoach.dto

data class NotificationSettingRequest(
    val enabled: Boolean,
    val hour: Int,
)

data class NotificationSettingResponse(
    val enabled: Boolean,
    val hour: Int,
)
