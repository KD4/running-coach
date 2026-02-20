package com.kd4.runningcoach.service

import com.kd4.runningcoach.entity.AuthProvider
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpEntity
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpMethod
import org.springframework.http.MediaType
import org.springframework.stereotype.Component
import org.springframework.util.LinkedMultiValueMap
import org.springframework.web.client.RestTemplate

@Component
class KakaoOAuthClient(
    @Value("\${oauth.kakao.client-id}") private val clientId: String,
    @Value("\${oauth.kakao.redirect-uri}") private val redirectUri: String,
) : OAuthClient {

    override val provider = AuthProvider.KAKAO
    private val restTemplate = RestTemplate()

    override fun exchangeCode(code: String): String {
        val headers = HttpHeaders().apply { contentType = MediaType.APPLICATION_FORM_URLENCODED }
        val body = LinkedMultiValueMap<String, String>().apply {
            add("grant_type", "authorization_code")
            add("client_id", clientId)
            add("redirect_uri", redirectUri)
            add("code", code)
        }
        val response = restTemplate.postForObject(
            "https://kauth.kakao.com/oauth/token",
            HttpEntity(body, headers),
            Map::class.java,
        ) ?: throw RuntimeException("Kakao token exchange failed")

        return response["access_token"] as String
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
