package com.kd4.runningcoach.service

import com.kd4.runningcoach.dto.OnboardingRequest
import com.kd4.runningcoach.dto.ProfileResponse
import com.kd4.runningcoach.dto.ProfileUpdateRequest
import com.kd4.runningcoach.entity.UserProfile
import com.kd4.runningcoach.repository.UserProfileRepository
import com.kd4.runningcoach.repository.UserRepository
import org.springframework.stereotype.Service

@Service
class UserService(
    private val userRepository: UserRepository,
    private val userProfileRepository: UserProfileRepository,
) {

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
