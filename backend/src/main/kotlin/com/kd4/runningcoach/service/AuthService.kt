package com.kd4.runningcoach.service

import com.kd4.runningcoach.entity.AuthProvider
import com.kd4.runningcoach.entity.User
import com.kd4.runningcoach.repository.UserProfileRepository
import com.kd4.runningcoach.repository.UserRepository
import org.mindrot.jbcrypt.BCrypt
import org.springframework.stereotype.Service
import java.util.*

@Service
class AuthService(
    private val userRepository: UserRepository,
    private val userProfileRepository: UserProfileRepository,
    oauthClients: List<OAuthClient>,
) {
    private val oauthClientMap: Map<AuthProvider, OAuthClient> =
        oauthClients.associateBy { it.provider }

    data class LoginResult(val token: String, val isNewUser: Boolean)

    // --- OAuth 로그인 (카카오, 토스) ---
    fun oauthLogin(providerName: String, code: String, referrer: String? = null): LoginResult {
        val provider = AuthProvider.valueOf(providerName.uppercase())
        val client = oauthClientMap[provider]
            ?: throw RuntimeException("지원하지 않는 로그인 방식입니다: $providerName")

        val accessToken = client.exchangeCode(code, referrer)
        val providerUserId = client.getUserId(accessToken)

        return loginOrCreateOAuthUser(provider, providerUserId)
    }

    // --- 일반 회원가입 ---
    fun register(email: String, password: String): LoginResult {
        if (userRepository.findByEmail(email) != null) {
            throw RuntimeException("이미 가입된 이메일입니다.")
        }
        val hashed = BCrypt.hashpw(password, BCrypt.gensalt())
        val user = userRepository.save(
            User(provider = AuthProvider.LOCAL, email = email, password = hashed)
        )
        return issueToken(user, isNewUser = true)
    }

    // --- 일반 로그인 ---
    fun login(email: String, password: String): LoginResult {
        val user = userRepository.findByEmail(email)
            ?: throw RuntimeException("이메일 또는 비밀번호가 올바르지 않습니다.")
        if (user.password == null || !BCrypt.checkpw(password, user.password)) {
            throw RuntimeException("이메일 또는 비밀번호가 올바르지 않습니다.")
        }
        val isNewUser = userProfileRepository.findByUserId(user.id) == null
        return issueToken(user, isNewUser)
    }

    private fun loginOrCreateOAuthUser(provider: AuthProvider, providerUserId: String): LoginResult {
        val existing = userRepository.findByProviderAndProviderUserId(provider, providerUserId)
        if (existing != null) {
            val isNewUser = userProfileRepository.findByUserId(existing.id) == null
            return issueToken(existing, isNewUser)
        }
        val user = userRepository.save(
            User(provider = provider, providerUserId = providerUserId)
        )
        return issueToken(user, isNewUser = true)
    }

    private fun issueToken(user: User, isNewUser: Boolean): LoginResult {
        val token = UUID.randomUUID().toString()
        user.sessionToken = token
        userRepository.save(user)
        return LoginResult(token = token, isNewUser = isNewUser)
    }
}
