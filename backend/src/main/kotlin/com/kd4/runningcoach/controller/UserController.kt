package com.kd4.runningcoach.controller

import com.kd4.runningcoach.dto.NotificationSettingRequest
import com.kd4.runningcoach.dto.NotificationSettingResponse
import com.kd4.runningcoach.dto.OnboardingRequest
import com.kd4.runningcoach.dto.ProfileResponse
import com.kd4.runningcoach.dto.ProfileUpdateRequest
import com.kd4.runningcoach.service.UserService
import jakarta.servlet.http.HttpServletRequest
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/users")
class UserController(
    private val userService: UserService,
) {

    @PostMapping("/onboarding")
    fun onboarding(
        request: HttpServletRequest,
        @RequestBody body: OnboardingRequest,
    ): ResponseEntity<ProfileResponse> {
        val userId = request.getAttribute("userId") as Long
        return ResponseEntity.ok(userService.onboarding(userId, body))
    }

    @GetMapping("/profile")
    fun getProfile(request: HttpServletRequest): ResponseEntity<ProfileResponse> {
        val userId = request.getAttribute("userId") as Long
        return ResponseEntity.ok(userService.getProfile(userId))
    }

    @PutMapping("/profile")
    fun updateProfile(
        request: HttpServletRequest,
        @RequestBody body: ProfileUpdateRequest,
    ): ResponseEntity<ProfileResponse> {
        val userId = request.getAttribute("userId") as Long
        return ResponseEntity.ok(userService.updateProfile(userId, body))
    }

    @GetMapping("/notification")
    fun getNotificationSetting(request: HttpServletRequest): ResponseEntity<NotificationSettingResponse> {
        val userId = request.getAttribute("userId") as Long
        return ResponseEntity.ok(userService.getNotificationSetting(userId))
    }

    @PutMapping("/notification")
    fun updateNotificationSetting(
        request: HttpServletRequest,
        @RequestBody body: NotificationSettingRequest,
    ): ResponseEntity<NotificationSettingResponse> {
        val userId = request.getAttribute("userId") as Long
        return ResponseEntity.ok(userService.updateNotificationSetting(userId, body))
    }

    @DeleteMapping("/account")
    fun deleteAccount(request: HttpServletRequest): ResponseEntity<Void> {
        val userId = request.getAttribute("userId") as Long
        userService.deleteUser(userId)
        return ResponseEntity.ok().build()
    }
}
