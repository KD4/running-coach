package com.kd4.runningcoach.service

import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.http.HttpEntity
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpMethod
import org.springframework.http.MediaType
import org.springframework.http.client.SimpleClientHttpRequestFactory
import org.springframework.stereotype.Service
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

@Service
@ConditionalOnProperty("oauth.toss.enabled", havingValue = "true", matchIfMissing = false)
class TossMessageService(
    @Value("\${toss.mtls.cert:}") private val mtlsCert: String,
    @Value("\${toss.mtls.key:}") private val mtlsKey: String,
    @Value("\${toss.message.template-code:daily_schedule_reminder}") private val templateSetCode: String,
) {

    private val log = LoggerFactory.getLogger(TossMessageService::class.java)
    private val restTemplate: RestTemplate = createMtlsRestTemplate()

    companion object {
        private const val SEND_MESSAGE_URL =
            "https://apps-in-toss-api.toss.im/api-partner/v1/apps-in-toss/messenger/send-message"
    }

    fun sendMessage(userKey: String) {
        val headers = HttpHeaders().apply {
            contentType = MediaType.APPLICATION_JSON
            set("X-Toss-User-Key", userKey)
        }
        val body = mapOf(
            "templateSetCode" to templateSetCode,
            "context" to emptyMap<String, Any>(),
        )

        try {
            restTemplate.exchange(
                SEND_MESSAGE_URL,
                HttpMethod.POST,
                HttpEntity(body, headers),
                Map::class.java,
            )
            log.info("[TossMessage] Message sent to userKey={}", userKey)
        } catch (e: Exception) {
            log.error("[TossMessage] Failed to send message to userKey={}: {}", userKey, e.message)
        }
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

        log.info("[TossMessage] mTLS RestTemplate configured successfully")
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
}
