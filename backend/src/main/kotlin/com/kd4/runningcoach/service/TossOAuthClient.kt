package com.kd4.runningcoach.service

import com.kd4.runningcoach.entity.AuthProvider
import org.springframework.beans.factory.annotation.Value
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.http.HttpEntity
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpMethod
import org.springframework.http.MediaType
import org.springframework.stereotype.Component
import org.springframework.util.LinkedMultiValueMap
import org.springframework.web.client.RestTemplate

@Component
@ConditionalOnProperty("oauth.toss.client-id", matchIfMissing = false)
class TossOAuthClient(
    @Value("\${oauth.toss.client-id}") private val clientId: String,
    @Value("\${oauth.toss.client-secret}") private val clientSecret: String,
    @Value("\${oauth.toss.redirect-uri}") private val redirectUri: String,
    @Value("\${oauth.toss.token-uri}") private val tokenUri: String,
    @Value("\${oauth.toss.user-info-uri}") private val userInfoUri: String,
) : OAuthClient {

    override val provider = AuthProvider.TOSS
    private val restTemplate = RestTemplate()

    override fun exchangeCode(code: String): String {
        val headers = HttpHeaders().apply { contentType = MediaType.APPLICATION_FORM_URLENCODED }
        val body = LinkedMultiValueMap<String, String>().apply {
            add("grant_type", "authorization_code")
            add("client_id", clientId)
            add("client_secret", clientSecret)
            add("redirect_uri", redirectUri)
            add("code", code)
        }
        val response = restTemplate.postForObject(
            tokenUri,
            HttpEntity(body, headers),
            Map::class.java,
        ) ?: throw RuntimeException("Toss token exchange failed")

        return response["access_token"] as String
    }

    override fun getUserId(accessToken: String): String {
        val headers = HttpHeaders().apply { set("Authorization", "Bearer $accessToken") }
        val response = restTemplate.exchange(
            userInfoUri,
            HttpMethod.GET,
            HttpEntity<Void>(headers),
            Map::class.java,
        )
        return (response.body?.get("id") as? Any)?.toString()
            ?: throw RuntimeException("Failed to get Toss user ID")
    }
}
