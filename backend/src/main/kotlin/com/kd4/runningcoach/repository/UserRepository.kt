package com.kd4.runningcoach.repository

import com.kd4.runningcoach.entity.AuthProvider
import com.kd4.runningcoach.entity.User
import org.springframework.data.jpa.repository.JpaRepository

interface UserRepository : JpaRepository<User, Long> {
    fun findByProviderAndProviderUserId(provider: AuthProvider, providerUserId: String): User?
    fun findByEmail(email: String): User?
    fun findBySessionToken(sessionToken: String): User?
}
