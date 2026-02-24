package com.kd4.runningcoach.controller

import com.kd4.runningcoach.entity.AuthProvider
import com.kd4.runningcoach.service.AuthService
import com.kd4.runningcoach.service.UserService
import jakarta.servlet.http.HttpServletRequest
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import java.util.Base64

data class OAuthLoginRequest(val provider: String, val code: String, val referrer: String? = null)
data class LocalLoginRequest(val email: String, val password: String)
data class RegisterRequest(val email: String, val password: String)
data class LoginResponse(val token: String, val isNewUser: Boolean)
data class TossDisconnectRequest(val userKey: Any, val referrer: String)

@RestController
@RequestMapping("/api/auth")
class AuthController(
    private val authService: AuthService,
    private val userService: UserService,
    @Value("\${toss.disconnect.basic-auth:}") private val tossDisconnectBasicAuth: String,
) {

    private val log = LoggerFactory.getLogger(AuthController::class.java)

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

    @PostMapping("/toss/disconnect")
    fun tossDisconnectCallback(
        request: HttpServletRequest,
        @RequestBody body: TossDisconnectRequest,
    ): ResponseEntity<Void> {
        val authHeader = request.getHeader("Authorization")
        if (authHeader == null || !authHeader.startsWith("Basic ")) {
            log.warn("[TossDisconnect] Missing or invalid Authorization header")
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build()
        }

        val credentials = String(Base64.getDecoder().decode(authHeader.substring(6)))
        if (tossDisconnectBasicAuth.isBlank() || credentials != tossDisconnectBasicAuth) {
            log.warn("[TossDisconnect] Basic auth mismatch")
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build()
        }

        val userKey = body.userKey.toString()
        log.info("[TossDisconnect] Received callback: userKey={}, referrer={}", userKey, body.referrer)

        userService.deleteUserByProviderUserId(AuthProvider.TOSS, userKey)
        return ResponseEntity.ok().build()
    }
}
