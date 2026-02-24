package com.kd4.runningcoach.service

import com.kd4.runningcoach.entity.AuthProvider
import org.slf4j.LoggerFactory
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.http.HttpEntity
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpMethod
import org.springframework.http.MediaType
import org.springframework.stereotype.Component
import org.springframework.web.client.RestTemplate

@Component
@ConditionalOnProperty("oauth.toss.enabled", havingValue = "true", matchIfMissing = false)
class TossOAuthClient : OAuthClient {

    private val log = LoggerFactory.getLogger(TossOAuthClient::class.java)

    override val provider = AuthProvider.TOSS
    private val restTemplate = RestTemplate()

    companion object {
        private const val TOKEN_URL = "https://apps-in-toss-api.toss.im/api-partner/v1/apps-in-toss/user/oauth2/generate-token"
        private const val USER_INFO_URL = "https://apps-in-toss-api.toss.im/api-partner/v1/apps-in-toss/user/oauth2/login-me"
    }

    override fun exchangeCode(code: String, referrer: String?): String {
        val headers = HttpHeaders().apply {
            contentType = MediaType.APPLICATION_JSON
        }
        val body = mapOf(
            "authorizationCode" to code,
            "referrer" to (referrer ?: "DEFAULT"),
        )

        log.info("[TossOAuth] Exchanging code, referrer={}", referrer ?: "DEFAULT")

        val response = restTemplate.postForObject(
            TOKEN_URL,
            HttpEntity(body, headers),
            Map::class.java,
        ) ?: throw RuntimeException("Toss token exchange failed: empty response")

        log.info("[TossOAuth] Token response resultType={}, keys={}", response["resultType"], response.keys)

        val result = response["success"] as? Map<*, *>
            ?: throw RuntimeException("Toss token exchange failed: resultType=${response["resultType"]}, error=${response["error"]}")
        return result["accessToken"] as? String
            ?: throw RuntimeException("Toss token exchange failed: no accessToken in success")
    }

    override fun getUserId(accessToken: String): String {
        val headers = HttpHeaders().apply {
            set("Authorization", "Bearer $accessToken")
            contentType = MediaType.APPLICATION_JSON
        }
        val response = restTemplate.exchange(
            USER_INFO_URL,
            HttpMethod.GET,
            HttpEntity<Void>(headers),
            Map::class.java,
        )

        val body = response.body ?: throw RuntimeException("Empty response from Toss user info")
        log.info("[TossOAuth] User info response resultType={}, keys={}", body["resultType"], body.keys)

        val result = body["success"] as? Map<*, *>
            ?: throw RuntimeException("Failed to get Toss user info: resultType=${body["resultType"]}, error=${body["error"]}")
        return (result["userKey"] as? Any)?.toString()
            ?: throw RuntimeException("Failed to get Toss userKey from success")
    }
}
