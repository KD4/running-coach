package com.kd4.runningcoach.service

import com.kd4.runningcoach.entity.AuthProvider
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpEntity
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpMethod
import org.springframework.http.MediaType
import org.springframework.stereotype.Component
import org.springframework.util.LinkedMultiValueMap
import org.springframework.web.client.HttpClientErrorException
import org.springframework.web.client.RestTemplate

@Component
class KakaoOAuthClient(
    @Value("\${oauth.kakao.client-id}") private val clientId: String,
    @Value("\${oauth.kakao.client-secret}") private val clientSecret: String,
    @Value("\${oauth.kakao.redirect-uri}") private val redirectUri: String,
) : OAuthClient {

    private val log = LoggerFactory.getLogger(javaClass)
    override val provider = AuthProvider.KAKAO
    private val restTemplate = RestTemplate()

    override fun exchangeCode(code: String): String {
        log.info("Kakao token exchange: redirect_uri={}, client_id={}...", redirectUri, clientId.take(8))
        val headers = HttpHeaders().apply { contentType = MediaType.APPLICATION_FORM_URLENCODED }
        val body = LinkedMultiValueMap<String, String>().apply {
            add("grant_type", "authorization_code")
            add("client_id", clientId)
            add("client_secret", clientSecret)
            add("redirect_uri", redirectUri)
            add("code", code)
        }
        try {
            val response = restTemplate.postForObject(
                "https://kauth.kakao.com/oauth/token",
                HttpEntity(body, headers),
                Map::class.java,
            ) ?: throw RuntimeException("Kakao token exchange failed: empty response")

            return response["access_token"] as String
        } catch (e: HttpClientErrorException) {
            log.error("Kakao token exchange failed: status={}, body={}", e.statusCode, e.responseBodyAsString)
            throw RuntimeException("Kakao login failed (${e.statusCode}): ${e.responseBodyAsString}")
        }
    }

    override fun getUserId(accessToken: String): String {
        val headers = HttpHeaders().apply { set("Authorization", "Bearer $accessToken") }
        val response = restTemplate.exchange(
            "https://kapi.kakao.com/v2/user/me",
            HttpMethod.GET,
            HttpEntity<Void>(headers),
            Map::class.java,
        )
        return (response.body?.get("id") as Number).toLong().toString()
    }
}
