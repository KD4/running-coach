package com.kd4.runningcoach.config

import com.github.benmanes.caffeine.cache.Caffeine
import com.kd4.runningcoach.repository.UserRepository
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.stereotype.Component
import org.springframework.web.servlet.HandlerInterceptor
import java.util.concurrent.TimeUnit

@Component
class AuthInterceptor(
    private val userRepository: UserRepository,
) : HandlerInterceptor {

    // sessionToken → userId 캐시 (TTL 30분, 최대 1000건)
    private val tokenCache = Caffeine.newBuilder()
        .expireAfterWrite(30, TimeUnit.MINUTES)
        .maximumSize(1_000)
        .build<String, Long>()

    override fun preHandle(request: HttpServletRequest, response: HttpServletResponse, handler: Any): Boolean {
        if (request.method == "OPTIONS") return true

        val path = request.requestURI
        if (path.startsWith("/api/auth") || path.startsWith("/api/guest")) return true

        val header = request.getHeader("Authorization")
        if (header == null || !header.startsWith("Bearer ")) {
            response.status = 401
            response.contentType = "application/json"
            response.writer.write("""{"error":"Unauthorized"}""")
            return false
        }

        val token = header.substring(7)

        // 캐시 우선 조회, 미스 시 DB 조회
        val userId = tokenCache.get(token) { t ->
            userRepository.findBySessionToken(t)?.id
        }

        if (userId == null) {
            response.status = 401
            response.contentType = "application/json"
            response.writer.write("""{"error":"Invalid token"}""")
            return false
        }

        request.setAttribute("userId", userId)
        return true
    }

    fun evictToken(sessionToken: String) {
        tokenCache.invalidate(sessionToken)
    }

    fun evictAllTokens() {
        tokenCache.invalidateAll()
    }
}
