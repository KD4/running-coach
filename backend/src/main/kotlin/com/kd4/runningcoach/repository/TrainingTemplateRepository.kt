package com.kd4.runningcoach.repository

import com.kd4.runningcoach.entity.TrainingTemplate
import org.springframework.data.jpa.repository.JpaRepository

interface TrainingTemplateRepository : JpaRepository<TrainingTemplate, Long> {
    fun findByGoalEventAndWeekNumber(goalEvent: String, weekNumber: Int): List<TrainingTemplate>
    fun findByGoalEvent(goalEvent: String): List<TrainingTemplate>
    fun findFirstByGoalEventOrderByWeekNumberDesc(goalEvent: String): TrainingTemplate?
}
