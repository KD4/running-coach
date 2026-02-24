package com.kd4.runningcoach.service

import com.kd4.runningcoach.service.PaceCalculator.Level
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertAll
import kotlin.test.assertEquals
import kotlin.test.assertNotNull
import kotlin.test.assertNull
import kotlin.test.assertTrue

/**
 * PaceCalculator 학습 테스트
 *
 * 페이스 산정, 레벨 판별, 인터벌 스펙, 주간 플랜 생성 로직을 검증한다.
 */
class PaceCalculatorTest {

    private val calc = PaceCalculator()

    // ──────────────────────────────────────────────
    //  레이스 거리 매핑
    // ──────────────────────────────────────────────

    @Nested
    inner class RaceDistanceKm {
        @Test
        fun `10K는 10km`() = assertEquals(10.0, calc.raceDistanceKm("10K"))

        @Test
        fun `HALF는 21_0975km`() = assertEquals(21.0975, calc.raceDistanceKm("HALF"))

        @Test
        fun `MARATHON은 42_195km`() = assertEquals(42.195, calc.raceDistanceKm("MARATHON"))

        @Test
        fun `알 수 없는 종목은 마라톤 거리`() = assertEquals(42.195, calc.raceDistanceKm("UNKNOWN"))
    }

    // ──────────────────────────────────────────────
    //  레벨 판별
    // ──────────────────────────────────────────────

    @Nested
    inner class DetermineLevel {
        @Test
        fun `9분 페이스 이상은 BEGINNER`() {
            // 540초/km = 9:00/km
            assertEquals(Level.BEGINNER, calc.determineLevel(540))
            assertEquals(Level.BEGINNER, calc.determineLevel(600))
        }

        @Test
        fun `6분30초 미만은 ADVANCED`() {
            // 390초/km = 6:30/km
            assertEquals(Level.ADVANCED, calc.determineLevel(389))
            assertEquals(Level.ADVANCED, calc.determineLevel(300))
        }

        @Test
        fun `그 사이는 INTERMEDIATE`() {
            assertEquals(Level.INTERMEDIATE, calc.determineLevel(390))
            assertEquals(Level.INTERMEDIATE, calc.determineLevel(450))
            assertEquals(Level.INTERMEDIATE, calc.determineLevel(539))
        }
    }

    // ──────────────────────────────────────────────
    //  페이스 계산 — 마라톤 서브4 시나리오
    // ──────────────────────────────────────────────

    @Nested
    inner class CalculatePaces {

        /** 마라톤 서브4 = 4시간(14400초) / 42.195km ≈ 341.3초/km */
        private val sub4Paces = calc.calculatePaces(
            goalTimeSeconds = 14400,   // 4시간
            goalEvent = "MARATHON",
        )

        @Test
        fun `레이스 페이스는 목표시간 나누기 거리`() {
            // 14400 / 42.195 ≈ 341.3 → 반올림 341
            assertEquals(341, sub4Paces.racePaceSec)
        }

        @Test
        fun `조깅 페이스 = 레이스 + 75초`() {
            // 341.3 + 75 = 416.3 → 416
            assertEquals(416, sub4Paces.jogPaceSec)
        }

        @Test
        fun `롱런 페이스 = 레이스 + 52초`() {
            // 341.3 + 52 = 393.3 → 393
            assertEquals(393, sub4Paces.longRunPaceSec)
        }

        @Test
        fun `템포 페이스 = 레이스 - 12초`() {
            // 341.3 - 12 = 329.3 → 329
            assertEquals(329, sub4Paces.tempoPaceSec)
        }

        @Test
        fun `인터벌 페이스 = 레이스 - 25초`() {
            // 341.3 - 25 = 316.3 → 316
            assertEquals(316, sub4Paces.intervalPaceSec)
        }

        @Test
        fun `페이스런 페이스 = 레이스 + 15초`() {
            // 341.3 + 15 = 356.3 → 356
            assertEquals(356, sub4Paces.paceRunPaceSec)
        }

        @Test
        fun `에어로빅런 페이스 = 레이스 + 62초`() {
            // 341.3 + 62 = 403.3 → 403
            assertEquals(403, sub4Paces.arPaceSec)
        }

        @Test
        fun `10K 50분 페이스 계산`() {
            // 3000초 / 10km = 300초/km (5:00/km)
            val paces = calc.calculatePaces(3000, "10K")
            assertEquals(300, paces.racePaceSec)
            assertEquals(375, paces.jogPaceSec)       // 300 + 75
            assertEquals(352, paces.longRunPaceSec)    // 300 + 52
        }

        @Test
        fun `하프 2시간 페이스 계산`() {
            // 7200초 / 21.0975km ≈ 341.3초/km — 마라톤 서브4와 비슷한 페이스
            val paces = calc.calculatePaces(7200, "HALF")
            assertEquals(341, paces.racePaceSec)
        }
    }

    // ──────────────────────────────────────────────
    //  formatPace
    // ──────────────────────────────────────────────

    @Nested
    inner class FormatPace {
        @Test
        fun `341초 = 5분41초`() = assertEquals("5:41", PaceCalculator.formatPace(341))

        @Test
        fun `300초 = 5분00초`() = assertEquals("5:00", PaceCalculator.formatPace(300))

        @Test
        fun `600초 = 10분00초`() = assertEquals("10:00", PaceCalculator.formatPace(600))

        @Test
        fun `65초 = 1분05초`() = assertEquals("1:05", PaceCalculator.formatPace(65))
    }

    // ──────────────────────────────────────────────
    //  IntervalSpec
    // ──────────────────────────────────────────────

    @Nested
    inner class IntervalSpecTest {

        @Test
        fun `totalKm = 워밍업2km + 인터벌구간 + 쿨다운1km`() {
            // 400m × 8회 + 200m × 7회 = 3200 + 1400 = 4600m = 4.6km
            // total = 2.0 + 4.6 + 1.0 = 7.6km
            val spec = PaceCalculator.IntervalSpec(400, 8, 200)
            assertEquals(7.6, spec.totalKm())
        }

        @Test
        fun `1000m x 5회 400m 회복`() {
            // 1000×5 + 400×4 = 5000 + 1600 = 6600m = 6.6km
            // total = 2.0 + 6.6 + 1.0 = 9.6km
            val spec = PaceCalculator.IntervalSpec(1000, 5, 400)
            assertEquals(9.6, spec.totalKm())
        }

        @Test
        fun `description 포맷`() {
            val spec = PaceCalculator.IntervalSpec(800, 6, 400)
            assertEquals("800m × 6개, 세트 간 400m 회복 조깅", spec.description())
        }
    }

    // ──────────────────────────────────────────────
    //  인터벌 스펙 — 주차별 / 레벨별 진행
    // ──────────────────────────────────────────────

    @Nested
    inner class GetIntervalSpec {

        @Test
        fun `INTERMEDIATE 초반(1~4주) = 400m x 8`() {
            val spec = calc.getIntervalSpec(week = 2, totalWeeks = 12, level = Level.INTERMEDIATE)
            assertAll(
                { assertEquals(400, spec.intervalDistanceM) },
                { assertEquals(8, spec.reps) },
                { assertEquals(200, spec.recoveryDistanceM) },
            )
        }

        @Test
        fun `INTERMEDIATE 중반(5~8주) = 800m x 6`() {
            val spec = calc.getIntervalSpec(week = 6, totalWeeks = 12, level = Level.INTERMEDIATE)
            assertAll(
                { assertEquals(800, spec.intervalDistanceM) },
                { assertEquals(6, spec.reps) },
            )
        }

        @Test
        fun `INTERMEDIATE 후반(9~12주) = 1000m x 5`() {
            val spec = calc.getIntervalSpec(week = 10, totalWeeks = 16, level = Level.INTERMEDIATE)
            assertAll(
                { assertEquals(1000, spec.intervalDistanceM) },
                { assertEquals(5, spec.reps) },
            )
        }

        @Test
        fun `ADVANCED 초반 = 800m x 10`() {
            // 8 * 1.2 = 9.6 → roundToInt = 10
            val spec = calc.getIntervalSpec(week = 1, totalWeeks = 12, level = Level.ADVANCED)
            assertAll(
                { assertEquals(800, spec.intervalDistanceM) },
                { assertEquals(10, spec.reps) },
                { assertEquals(300, spec.recoveryDistanceM) },
            )
        }

        @Test
        fun `테이퍼 주간 - ADVANCED = 400m x 5`() {
            // totalWeeks=12, week=11 → 11 > 12-2=10 → taper
            val spec = calc.getIntervalSpec(week = 11, totalWeeks = 12, level = Level.ADVANCED)
            assertAll(
                { assertEquals(400, spec.intervalDistanceM) },
                { assertEquals(5, spec.reps) },
                { assertEquals(130, spec.recoveryDistanceM) },
            )
        }

        @Test
        fun `테이퍼 주간 - INTERMEDIATE = 400m x 4`() {
            val spec = calc.getIntervalSpec(week = 11, totalWeeks = 12, level = Level.INTERMEDIATE)
            assertAll(
                { assertEquals(400, spec.intervalDistanceM) },
                { assertEquals(4, spec.reps) },
                { assertEquals(200, spec.recoveryDistanceM) },
            )
        }
    }

    // ──────────────────────────────────────────────
    //  주간 플랜 생성
    // ──────────────────────────────────────────────

    @Nested
    inner class GeneratePlan {

        /** 마라톤 서브4 = 14400초 / 42.195km ≈ 341초/km → ADVANCED (< 390) */
        private val plans = calc.generatePlan(
            goalTimeSeconds = 14400,
            goalEvent = "MARATHON",
            totalWeeks = 12,
        )

        @Test
        fun `총 주차 수만큼 플랜 생성`() {
            assertEquals(12, plans.size)
        }

        @Test
        fun `서브4 마라톤은 ADVANCED`() {
            // 341초/km < 390 → ADVANCED
            plans.forEach { assertEquals(Level.ADVANCED, it.level) }
        }

        @Test
        fun `4주 블록 주기화 — 블록 포지션 순환`() {
            // 1,2,3,4, 1,2,3,4, 1,2,3,4
            val expectedPositions = (1..12).map { ((it - 1) % 4) + 1 }
            assertEquals(expectedPositions, plans.map { it.blockPosition })
        }

        @Test
        fun `블록 1 = 적응(0_8배), 3 = 강화(1_1배), 4 = 회복(0_7배)`() {
            val week1 = plans[0]  // blockPosition=1, blockNumber=0 → 0.8 * 1.0
            val week3 = plans[2]  // blockPosition=3, blockNumber=0 → 1.1 * 1.0
            val week4 = plans[3]  // blockPosition=4, blockNumber=0 → 0.7 * 1.0

            assertEquals(0.8, week1.volumeMultiplier)
            assertEquals(1.1, week3.volumeMultiplier)
            assertEquals(0.7, week4.volumeMultiplier)
        }

        @Test
        fun `블록 번호 증가에 따라 기반 배수 5퍼센트씩 증가`() {
            // week 5 = blockPosition=1, blockNumber=1 → 0.8 * 1.05 = 0.84 → round1 = 0.8
            val week5 = plans[4]
            assertEquals(0.8, week5.volumeMultiplier)

            // week 6 = blockPosition=2, blockNumber=1 → 1.0 * 1.05 = 1.05 → round1 = 1.1 (0.5 rounds up)
            val week6 = plans[5]
            assertEquals(1.1, week6.volumeMultiplier)
        }

        @Test
        fun `테이퍼 주간은 볼륨 0_5`() {
            // totalWeeks=12, taper = week > 10
            val week11 = plans[10]
            val week12 = plans[11]

            assertEquals(0.5, week11.volumeMultiplier)
            assertEquals(0.5, week12.volumeMultiplier)
        }

        @Test
        fun `BEGINNER는 인터벌 스펙이 null`() {
            // 10K 70분 → 4200/10 = 420초 (7:00/km) → 420 < 540 → INTERMEDIATE
            // 10K 100분 → 6000/10 = 600초 → BEGINNER
            val beginnerPlans = calc.generatePlan(6000, "10K", 8)
            beginnerPlans.forEach { assertNull(it.intervalSpec) }
        }

        @Test
        fun `INTERMEDIATE는 인터벌 스펙이 존재`() {
            // 마라톤 5시간 → 18000/42.195 ≈ 427초 → INTERMEDIATE
            val intermediatePlans = calc.generatePlan(18000, "MARATHON", 12)
            intermediatePlans.forEach { plan ->
                assertEquals(Level.INTERMEDIATE, plan.level)
                assertNotNull(plan.intervalSpec, "week ${plan.weekNumber}에 intervalSpec이 없음")
            }
        }

        @Test
        fun `ADVANCED는 인터벌 스펙이 존재`() {
            plans.forEach { plan ->
                assertEquals(Level.ADVANCED, plan.level)
                assertNotNull(plan.intervalSpec, "week ${plan.weekNumber}에 intervalSpec이 없음")
            }
        }

        @Test
        fun `롱런 거리는 주차가 진행될수록 증가하다가 볼륨 배수에 의해 조절됨`() {
            // 회복주(position 4) 전까지의 첫 3주를 비교
            val week1LongKm = plans[0].longRunKm // position 1, vol 0.8
            val week2LongKm = plans[1].longRunKm // position 2, vol 1.0
            val week3LongKm = plans[2].longRunKm // position 3, vol 1.1

            // 기본 롱런 거리가 증가하므로 vol 배수를 감안해도 week2 > week1
            assertTrue(
                week2LongKm > week1LongKm,
                "week2($week2LongKm) > week1($week1LongKm) 이어야 함",
            )
            assertTrue(
                week3LongKm > week2LongKm,
                "week3($week3LongKm) > week2($week2LongKm) 이어야 함",
            )
        }
    }

    // ──────────────────────────────────────────────
    //  defaultTotalWeeks
    // ──────────────────────────────────────────────

    @Nested
    inner class DefaultTotalWeeks {
        @Test
        fun `10K는 8주`() = assertEquals(8, calc.defaultTotalWeeks("10K"))

        @Test
        fun `HALF는 10주`() = assertEquals(10, calc.defaultTotalWeeks("HALF"))

        @Test
        fun `MARATHON은 12주`() = assertEquals(12, calc.defaultTotalWeeks("MARATHON"))
    }
}
