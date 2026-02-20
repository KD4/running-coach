package com.kd4.runningcoach.entity

import jakarta.persistence.*

@Entity
@Table(name = "training_templates")
class TrainingTemplate(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @Column(nullable = false)
    val goalEvent: String,

    @Column(nullable = false)
    val weekNumber: Int,

    @Column(nullable = false)
    val dayOfWeek: Int,

    @Column(nullable = false)
    val workoutType: String,

    @Column(nullable = false)
    val distanceKm: Double,

    val paceTarget: String? = null,

    val description: String? = null,
)
