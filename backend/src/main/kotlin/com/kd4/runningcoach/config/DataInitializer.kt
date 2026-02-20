package com.kd4.runningcoach.config

import org.springframework.boot.ApplicationArguments
import org.springframework.boot.ApplicationRunner
import org.springframework.stereotype.Component

@Component
class DataInitializer : ApplicationRunner {
    override fun run(args: ApplicationArguments?) {
        // 모든 훈련 계획은 PaceCalculator에서 동적으로 계산됩니다.
        // 시드 데이터가 필요하지 않습니다.
    }
}
