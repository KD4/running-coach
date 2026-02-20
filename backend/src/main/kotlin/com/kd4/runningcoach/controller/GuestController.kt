package com.kd4.runningcoach.controller

import com.kd4.runningcoach.dto.GuestMonthlyRequest
import com.kd4.runningcoach.dto.GuestTodayRequest
import com.kd4.runningcoach.dto.MonthlyScheduleResponse
import com.kd4.runningcoach.dto.TodayResponse
import com.kd4.runningcoach.service.ScheduleService
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/guest/schedule")
class GuestController(
    private val scheduleService: ScheduleService,
) {

    @PostMapping("/today")
    fun getToday(@RequestBody request: GuestTodayRequest): ResponseEntity<TodayResponse> {
        return ResponseEntity.ok(scheduleService.getTodayGuest(request.toProfileData()))
    }

    @PostMapping("/monthly")
    fun getMonthly(@RequestBody request: GuestMonthlyRequest): ResponseEntity<MonthlyScheduleResponse> {
        return ResponseEntity.ok(scheduleService.getMonthlyGuest(request.toProfileData(), request.year, request.month))
    }
}
