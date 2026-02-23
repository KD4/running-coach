package com.kd4.runningcoach.controller

import com.kd4.runningcoach.service.AuthService
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

data class OAuthLoginRequest(val provider: String, val code: String, val referrer: String? = null)
data class LocalLoginRequest(val email: String, val password: String)
data class RegisterRequest(val email: String, val password: String)
data class LoginResponse(val token: String, val isNewUser: Boolean)

@RestController
@RequestMapping("/api/auth")
class AuthController(
    private val authService: AuthService,
) {

    @PostMapping("/oauth")
    fun oauthLogin(@RequestBody request: OAuthLoginRequest): ResponseEntity<LoginResponse> {
        val result = authService.oauthLogin(request.provider, request.code, request.referrer)
        return ResponseEntity.ok(LoginResponse(token = result.token, isNewUser = result.isNewUser))
    }

    @PostMapping("/login")
    fun login(@RequestBody request: LocalLoginRequest): ResponseEntity<LoginResponse> {
        val result = authService.login(request.email, request.password)
        return ResponseEntity.ok(LoginResponse(token = result.token, isNewUser = result.isNewUser))
    }

    @PostMapping("/register")
    fun register(@RequestBody request: RegisterRequest): ResponseEntity<LoginResponse> {
        val result = authService.register(request.email, request.password)
        return ResponseEntity.ok(LoginResponse(token = result.token, isNewUser = result.isNewUser))
    }
}
