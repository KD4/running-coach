package com.kd4.runningcoach

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.scheduling.annotation.EnableScheduling

@SpringBootApplication
@EnableScheduling
class RunningCoachApplication

fun main(args: Array<String>) {
    runApplication<RunningCoachApplication>(*args)
}
