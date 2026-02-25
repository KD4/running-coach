package com.kd4.runningcoach.service

import com.kd4.runningcoach.entity.AuthProvider
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.http.HttpEntity
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpMethod
import org.springframework.http.MediaType
import org.springframework.http.client.SimpleClientHttpRequestFactory
import org.springframework.stereotype.Component
import org.springframework.web.client.RestTemplate
import java.io.ByteArrayInputStream
import java.net.HttpURLConnection
import java.security.KeyFactory
import java.security.KeyStore
import java.security.cert.CertificateFactory
import java.security.cert.X509Certificate
import java.security.spec.PKCS8EncodedKeySpec
import java.util.Base64
import javax.net.ssl.HttpsURLConnection
import javax.net.ssl.KeyManagerFactory
import javax.net.ssl.SSLContext

@Component
@ConditionalOnProperty("oauth.toss.enabled", havingValue = "true", matchIfMissing = false)
class TossOAuthClient(
    @Value("\${toss.mtls.cert:}") private val mtlsCert: String,
    @Value("\${toss.mtls.key:}") private val mtlsKey: String,
) : OAuthClient {

    private val log = LoggerFactory.getLogger(TossOAuthClient::class.java)

    override val provider = AuthProvider.TOSS
    private val restTemplate: RestTemplate = createMtlsRestTemplate()

    companion object {
        private const val TOKEN_URL = "https://apps-in-toss-api.toss.im/api-partner/v1/apps-in-toss/user/oauth2/generate-token"
        private const val USER_INFO_URL = "https://apps-in-toss-api.toss.im/api-partner/v1/apps-in-toss/user/oauth2/login-me"
    }

    private fun createMtlsRestTemplate(): RestTemplate {
        val certPem = if (mtlsCert.isNotBlank()) mtlsCert else loadClasspathResource("running-coach-1_public.crt")
        val keyPem = if (mtlsKey.isNotBlank()) mtlsKey else loadClasspathResource("running-coach-1_private.key")

        val cert = parseCertificate(certPem)
        val key = parsePrivateKey(keyPem)

        val keyStore = KeyStore.getInstance(KeyStore.getDefaultType()).apply {
            load(null, null)
            setCertificateEntry("client-cert", cert)
            setKeyEntry("client-key", key, charArrayOf(), arrayOf(cert))
        }

        val kmf = KeyManagerFactory.getInstance(KeyManagerFactory.getDefaultAlgorithm()).apply {
            init(keyStore, charArrayOf())
        }

        val sslContext = SSLContext.getInstance("TLS").apply {
            init(kmf.keyManagers, null, null)
        }

        val factory = object : SimpleClientHttpRequestFactory() {
            override fun prepareConnection(connection: HttpURLConnection, httpMethod: String) {
                if (connection is HttpsURLConnection) {
                    connection.sslSocketFactory = sslContext.socketFactory
                }
                super.prepareConnection(connection, httpMethod)
            }
        }

        log.info("[TossOAuth] mTLS RestTemplate configured successfully")
        return RestTemplate(factory)
    }

    private fun loadClasspathResource(name: String): String {
        return javaClass.classLoader.getResourceAsStream(name)?.bufferedReader()?.readText()
            ?: throw RuntimeException("mTLS classpath resource not found: $name")
    }

    private fun parseCertificate(pem: String): X509Certificate {
        val content = pem.replace("\\n", "\n")
            .replace("-----BEGIN CERTIFICATE-----", "")
            .replace("-----END CERTIFICATE-----", "")
            .replace("\\s".toRegex(), "")
        val bytes = Base64.getDecoder().decode(content)
        return CertificateFactory.getInstance("X.509")
            .generateCertificate(ByteArrayInputStream(bytes)) as X509Certificate
    }

    private fun parsePrivateKey(pem: String): java.security.PrivateKey {
        val content = pem.replace("\\n", "\n")
            .replace("-----BEGIN PRIVATE KEY-----", "")
            .replace("-----END PRIVATE KEY-----", "")
            .replace("\\s".toRegex(), "")
        val bytes = Base64.getDecoder().decode(content)
        return KeyFactory.getInstance("RSA").generatePrivate(PKCS8EncodedKeySpec(bytes))
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

        val response = try {
            restTemplate.exchange(
                TOKEN_URL,
                HttpMethod.POST,
                HttpEntity(body, headers),
                Map::class.java,
            )
        } catch (e: Exception) {
            log.error("[TossOAuth] Token exchange failed: {}", e.message, e)
            throw RuntimeException("Toss token exchange failed: ${e.message}", e)
        }

        val responseBody = response.body ?: throw RuntimeException("Toss token exchange failed: empty response")
        log.info("[TossOAuth] Token response resultType={}, keys={}", responseBody["resultType"], responseBody.keys)

        val result = responseBody["success"] as? Map<*, *>
            ?: throw RuntimeException("Toss token exchange failed: resultType=${responseBody["resultType"]}, error=${responseBody["error"]}")
        return result["accessToken"] as? String
            ?: throw RuntimeException("Toss token exchange failed: no accessToken in success")
    }

    override fun getUserId(accessToken: String): String {
        val headers = HttpHeaders().apply {
            set("Authorization", "Bearer $accessToken")
            contentType = MediaType.APPLICATION_JSON
        }
        val response = try {
            restTemplate.exchange(
                USER_INFO_URL,
                HttpMethod.GET,
                HttpEntity<Void>(headers),
                Map::class.java,
            )
        } catch (e: Exception) {
            log.error("[TossOAuth] User info failed: {}", e.message, e)
            throw RuntimeException("Toss user info failed: ${e.message}", e)
        }

        val body = response.body ?: throw RuntimeException("Empty response from Toss user info")
        log.info("[TossOAuth] User info response resultType={}, keys={}", body["resultType"], body.keys)

        val result = body["success"] as? Map<*, *>
            ?: throw RuntimeException("Failed to get Toss user info: resultType=${body["resultType"]}, error=${body["error"]}")
        return (result["userKey"] as? Any)?.toString()
            ?: throw RuntimeException("Failed to get Toss userKey from success")
    }
}
