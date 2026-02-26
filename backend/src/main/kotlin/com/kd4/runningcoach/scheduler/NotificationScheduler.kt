package com.kd4.runningcoach.scheduler

import com.kd4.runningcoach.entity.AuthProvider
import com.kd4.runningcoach.repository.UserProfileRepository
import com.kd4.runningcoach.service.TossMessageService
import org.slf4j.LoggerFactory
import org.springframework.data.domain.PageRequest
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component
import java.time.ZoneId
import java.time.ZonedDateTime

@Component
class NotificationScheduler(
    private val userProfileRepository: UserProfileRepository,
    private val tossMessageService: TossMessageService,
) {

    private val log = LoggerFactory.getLogger(NotificationScheduler::class.java)

    companion object {
        private const val CHUNK_SIZE = 500
    }

    @Scheduled(cron = "0 0 * * * *", zone = "Asia/Seoul")
    fun sendDailyNotifications() {
        val currentHour = ZonedDateTime.now(ZoneId.of("Asia/Seoul")).hour
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
                    tossMessageService.sendMessage(user.providerUserId!!)
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
}
