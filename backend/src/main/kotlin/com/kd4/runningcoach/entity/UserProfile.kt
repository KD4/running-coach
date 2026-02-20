package com.kd4.runningcoach.entity

import jakarta.persistence.*
import java.time.LocalDate

@Entity
@Table(name = "user_profiles")
class UserProfile(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    val user: User,

    @Column(nullable = false)
    var goalEvent: String,

    @Column(nullable = false)
    var goalTimeSeconds: Int,

    @Column(nullable = false)
    var targetDate: LocalDate,

    @Column(nullable = false)
    var trainingDays: String,

    @Column(nullable = false)
    var longRunDay: String,

    @Column(nullable = false)
    var bodyWeight: Double,

    var targetWeight: Double? = null,
)
