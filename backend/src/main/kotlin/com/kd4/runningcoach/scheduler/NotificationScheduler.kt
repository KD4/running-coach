package com.kd4.runningcoach.scheduler

import com.kd4.runningcoach.entity.AuthProvider
import com.kd4.runningcoach.repository.UserProfileRepository
import com.kd4.runningcoach.service.ScheduleService
import com.kd4.runningcoach.service.TossMessageService
import org.slf4j.LoggerFactory
import org.springframework.data.domain.PageRequest
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component
import java.time.LocalDate
import java.time.ZoneId
import java.time.ZonedDateTime

@Component
class NotificationScheduler(
    private val userProfileRepository: UserProfileRepository,
    private val tossMessageService: TossMessageService,
    private val scheduleService: ScheduleService,
) {

    private val log = LoggerFactory.getLogger(NotificationScheduler::class.java)

    companion object {
        private const val CHUNK_SIZE = 500

        private val WORKOUT_TYPE_KO = mapOf(
            "EASY" to "이지런",
            "AR" to "에어로빅 런",
            "ACTIVE_RECOVERY" to "회복 조깅",
            "INTERVAL" to "인터벌",
            "TEMPO" to "템포런",
            "REPETITION" to "레피티션",
            "PACE_RUN" to "페이스런",
            "LONG" to "롱런",
            "RACE" to "레이스",
        )
    }

    @Scheduled(cron = "0 0 * * * *", zone = "Asia/Seoul")
    fun sendDailyNotifications() {
        val now = ZonedDateTime.now(ZoneId.of("Asia/Seoul"))
        val currentHour = now.hour
        val today = now.toLocalDate()
        log.info("[NotificationScheduler] Running for hour={} (KST)", currentHour)

        var lastId = 0L
        var totalSent = 0
        val pageable = PageRequest.ofSize(CHUNK_SIZE)

        while (true) {
            val chunk = userProfileRepository.findNotificationChunk(currentHour, lastId, pageable)
            if (chunk.isEmpty()) break

            for (profile in chunk) {
                val user = profile.user
                if (user.provider != AuthProvider.TOSS || user.providerUserId.isNullOrBlank()) {
                    continue
                }
                try {
                    val workoutType = resolveWorkoutTypeKo(user.id, today)
                    tossMessageService.sendMessage(user.providerUserId!!, workoutType)
                    totalSent++
                } catch (e: Exception) {
                    log.error("[NotificationScheduler] Failed to send to user id={}: {}", user.id, e.message)
                }
            }

            lastId = chunk.last().id
            if (chunk.size < CHUNK_SIZE) break
        }

        log.info("[NotificationScheduler] Done. totalSent={}", totalSent)
    }

    private fun resolveWorkoutTypeKo(userId: Long, date: LocalDate): String {
        val todayResponse = scheduleService.getToday(userId, date)
        if (todayResponse.isRestDay) return "휴식"
        val type = todayResponse.workout?.workoutType ?: return "휴식"
        return WORKOUT_TYPE_KO[type] ?: type
    }
}
