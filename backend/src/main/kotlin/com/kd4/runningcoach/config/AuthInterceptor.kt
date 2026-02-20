package com.kd4.runningcoach.config

import com.kd4.runningcoach.repository.UserRepository
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.stereotype.Component
import org.springframework.web.servlet.HandlerInterceptor

@Component
class AuthInterceptor(
    private val userRepository: UserRepository,
) : HandlerInterceptor {

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
        val user = userRepository.findBySessionToken(token)
        if (user == null) {
            response.status = 401
            response.contentType = "application/json"
            response.writer.write("""{"error":"Invalid token"}""")
            return false
        }

        request.setAttribute("userId", user.id)
        return true
    }
}
