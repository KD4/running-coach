package com.kd4.runningcoach.entity

import jakarta.persistence.*
import java.time.LocalDateTime

enum class AuthProvider {
    KAKAO, TOSS, LOCAL
}

@Entity
@Table(
    name = "users",
    uniqueConstraints = [UniqueConstraint(columnNames = ["provider", "provider_user_id"])],
    indexes = [
        Index(name = "idx_user_session_token", columnList = "sessionToken"),
        Index(name = "idx_user_email", columnList = "email"),
    ]
)
class User(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    val provider: AuthProvider,

    @Column(name = "provider_user_id")
    val providerUserId: String? = null,

    @Column(unique = true)
    var email: String? = null,

    var password: String? = null,

    @Column(nullable = false, updatable = false)
    val createdAt: LocalDateTime = LocalDateTime.now(),

    var sessionToken: String? = null,
)
