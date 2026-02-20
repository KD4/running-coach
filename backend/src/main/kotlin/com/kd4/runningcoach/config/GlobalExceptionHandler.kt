package com.kd4.runningcoach.config

import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice

data class ErrorResponse(
    val error: String,
    val message: String?,
)

@RestControllerAdvice
class GlobalExceptionHandler {

    @ExceptionHandler(RuntimeException::class)
    fun handleRuntime(e: RuntimeException): ResponseEntity<ErrorResponse> {
        val status = when {
            e.message?.contains("not found", ignoreCase = true) == true -> HttpStatus.NOT_FOUND
            e.message?.contains("already exists", ignoreCase = true) == true -> HttpStatus.CONFLICT
            else -> HttpStatus.BAD_REQUEST
        }
        return ResponseEntity.status(status).body(
            ErrorResponse(error = status.reasonPhrase, message = e.message)
        )
    }

    @ExceptionHandler(Exception::class)
    fun handleGeneral(e: Exception): ResponseEntity<ErrorResponse> {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
            ErrorResponse(error = "Internal Server Error", message = "서버 오류가 발생했습니다.")
        )
    }
}
