package com.kd4.runningcoach.repository

import com.kd4.runningcoach.entity.UserProfile
import org.springframework.data.jpa.repository.JpaRepository

interface UserProfileRepository : JpaRepository<UserProfile, Long> {
    fun findByUserId(userId: Long): UserProfile?
    fun deleteByUserId(userId: Long)
}
