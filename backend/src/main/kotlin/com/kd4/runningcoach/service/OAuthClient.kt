package com.kd4.runningcoach.service

import com.kd4.runningcoach.entity.AuthProvider

interface OAuthClient {
    val provider: AuthProvider
    fun exchangeCode(code: String): String      // code → access token
    fun getUserId(accessToken: String): String   // access token → provider user ID
}
