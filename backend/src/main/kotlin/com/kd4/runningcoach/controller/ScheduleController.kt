package com.kd4.runningcoach.controller

import com.kd4.runningcoach.dto.MonthlyScheduleResponse
import com.kd4.runningcoach.dto.TodayResponse
import com.kd4.runningcoach.service.ScheduleService
import jakarta.servlet.http.HttpServletRequest
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/schedule")
class ScheduleController(
    private val scheduleService: ScheduleService,
) {

    @GetMapping("/today")
    fun getToday(request: HttpServletRequest): ResponseEntity<TodayResponse> {
        val userId = request.getAttribute("userId") as Long
        return ResponseEntity.ok(scheduleService.getToday(userId))
    }

    @GetMapping("/monthly")
    fun getMonthlySchedule(
        request: HttpServletRequest,
        @RequestParam year: Int,
        @RequestParam month: Int,
    ): ResponseEntity<MonthlyScheduleResponse> {
        val userId = request.getAttribute("userId") as Long
        return ResponseEntity.ok(scheduleService.getMonthlySchedule(userId, year, month))
    }
}
