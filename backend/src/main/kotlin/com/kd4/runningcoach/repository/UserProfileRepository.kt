package com.kd4.runningcoach.repository

import com.kd4.runningcoach.entity.UserProfile
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query

interface UserProfileRepository : JpaRepository<UserProfile, Long> {
    fun findByUserId(userId: Long): UserProfile?
    fun deleteByUserId(userId: Long)

    @Query(
        """
        SELECT p FROM UserProfile p JOIN FETCH p.user
        WHERE p.notificationEnabled = true
          AND p.notificationHour = :hour
          AND p.id > :lastId
        ORDER BY p.id
        """
    )
    fun findNotificationChunk(hour: Int, lastId: Long, pageable: Pageable): List<UserProfile>
}
