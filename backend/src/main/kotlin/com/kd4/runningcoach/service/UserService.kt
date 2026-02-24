package com.kd4.runningcoach.service

import com.kd4.runningcoach.dto.OnboardingRequest
import com.kd4.runningcoach.dto.ProfileResponse
import com.kd4.runningcoach.dto.ProfileUpdateRequest
import com.kd4.runningcoach.entity.AuthProvider
import com.kd4.runningcoach.entity.UserProfile
import com.kd4.runningcoach.repository.UserProfileRepository
import com.kd4.runningcoach.repository.UserRepository
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class UserService(
    private val userRepository: UserRepository,
    private val userProfileRepository: UserProfileRepository,
) {

    private val log = LoggerFactory.getLogger(UserService::class.java)

    fun onboarding(userId: Long, request: OnboardingRequest): ProfileResponse {
        val user = userRepository.findById(userId).orElseThrow { RuntimeException("User not found") }

        val existing = userProfileRepository.findByUserId(userId)
        if (existing != null) throw RuntimeException("Profile already exists")

        val profile = userProfileRepository.save(
            UserProfile(
                user = user,
                goalEvent = request.goalEvent,
                goalTimeSeconds = request.goalTimeSeconds,
                targetDate = request.targetDate,
                trainingDays = request.trainingDays.joinToString(","),
                longRunDay = request.longRunDay,
                bodyWeight = request.bodyWeight,
                targetWeight = request.targetWeight,
            )
        )
        return profile.toResponse()
    }

    fun getProfile(userId: Long): ProfileResponse {
        val profile = userProfileRepository.findByUserId(userId) ?: throw RuntimeException("Profile not found")
        return profile.toResponse()
    }

    fun updateProfile(userId: Long, request: ProfileUpdateRequest): ProfileResponse {
        val profile = userProfileRepository.findByUserId(userId) ?: throw RuntimeException("Profile not found")

        request.goalEvent?.let { profile.goalEvent = it }
        request.goalTimeSeconds?.let { profile.goalTimeSeconds = it }
        request.targetDate?.let { profile.targetDate = it }
        request.trainingDays?.let { profile.trainingDays = it.joinToString(",") }
        request.longRunDay?.let { profile.longRunDay = it }
        request.bodyWeight?.let { profile.bodyWeight = it }
        profile.targetWeight = request.targetWeight

        userProfileRepository.save(profile)
        return profile.toResponse()
    }

    @Transactional
    fun deleteUserByProviderUserId(provider: AuthProvider, providerUserId: String) {
        val user = userRepository.findByProviderAndProviderUserId(provider, providerUserId)
        if (user == null) {
            log.info("[UserService] User not found for provider={}, providerUserId={} (already deleted?)", provider, providerUserId)
            return
        }
        userProfileRepository.deleteByUserId(user.id)
        userRepository.delete(user)
        log.info("[UserService] Deleted user id={}, provider={}, providerUserId={}", user.id, provider, providerUserId)
    }

    @Transactional
    fun deleteUser(userId: Long) {
        val user = userRepository.findById(userId).orElseThrow { RuntimeException("User not found") }
        userProfileRepository.deleteByUserId(user.id)
        userRepository.delete(user)
        log.info("[UserService] Deleted user id={}", user.id)
    }

    private fun UserProfile.toResponse() = ProfileResponse(
        goalEvent = goalEvent,
        goalTimeSeconds = goalTimeSeconds,
        targetDate = targetDate,
        trainingDays = trainingDays.split(","),
        longRunDay = longRunDay,
        bodyWeight = bodyWeight,
        targetWeight = targetWeight,
    )
}
