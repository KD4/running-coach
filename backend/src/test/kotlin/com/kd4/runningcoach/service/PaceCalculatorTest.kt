package com.kd4.runningcoach.service

import com.kd4.runningcoach.service.PaceCalculator.Level
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertAll
import java.time.LocalDate
import kotlin.test.assertEquals
import kotlin.test.assertNotNull
import kotlin.test.assertNull
import kotlin.test.assertTrue

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
            assertEquals(Level.BEGINNER, calc.determineLevel(540))
            assertEquals(Level.BEGINNER, calc.determineLevel(600))
        }

        @Test
        fun `6분30초 미만은 ADVANCED`() {
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
    //  VDOT 페이스 계산
    // ──────────────────────────────────────────────

    @Nested
    inner class CalculateVdotPaces {

        /** 마라톤 서브4 = 14400초 / 42.195km ≈ 341.3초/km */
        private val sub4Vdot = calc.calculateVdotPaces(
            goalTimeSeconds = 14400,
            goalEvent = "MARATHON",
        )

        @Test
        fun `M 페이스 = 목표시간 나누기 거리`() {
            assertEquals(341, sub4Vdot.mPaceSec)
        }

        @Test
        fun `E 페이스 = M + 75초`() {
            assertEquals(416, sub4Vdot.ePaceSec)
        }

        @Test
        fun `T 페이스 = M - 12초`() {
            assertEquals(329, sub4Vdot.tPaceSec)
        }

        @Test
        fun `I 페이스 = M - 27초`() {
            assertEquals(314, sub4Vdot.iPaceSec)
        }

        @Test
        fun `R 페이스 = M - 43초`() {
            assertEquals(298, sub4Vdot.rPaceSec)
        }

        @Test
        fun `10K 50분 페이스 계산`() {
            val vdot = calc.calculateVdotPaces(3000, "10K")
            assertEquals(300, vdot.mPaceSec)
            assertEquals(375, vdot.ePaceSec)
            assertEquals(288, vdot.tPaceSec)
        }

        @Test
        fun `하프 2시간 페이스 계산`() {
            val vdot = calc.calculateVdotPaces(7200, "HALF")
            assertEquals(341, vdot.mPaceSec)
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
            val spec = PaceCalculator.IntervalSpec(400, 8, 200)
            assertEquals(7.6, spec.totalKm())
        }

        @Test
        fun `1000m x 5회 400m 회복`() {
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
    //  determinePlanType — 통합 플랜 선택
    // ──────────────────────────────────────────────

    @Nested
    inner class DeterminePlanTypeTest {

        private val raceDay = LocalDate.of(2026, 6, 1)

        @Test
        fun `대회 3주 전 = 18주 플랜의 Week 16`() {
            val sel = calc.determinePlanType(raceDay, raceDay.minusWeeks(3))
            assertAll(
                { assertEquals(18, sel.totalWeeks) },
                { assertEquals(16, sel.currentWeek) },
            )
        }

        @Test
        fun `대회 10주 전 = 18주 플랜의 Week 9`() {
            val sel = calc.determinePlanType(raceDay, raceDay.minusWeeks(10))
            assertAll(
                { assertEquals(18, sel.totalWeeks) },
                { assertEquals(9, sel.currentWeek) },
            )
        }

        @Test
        fun `대회 18주 전 = 18주 플랜의 Week 1`() {
            val sel = calc.determinePlanType(raceDay, raceDay.minusWeeks(18))
            assertAll(
                { assertEquals(18, sel.totalWeeks) },
                { assertEquals(1, sel.currentWeek) },
            )
        }

        @Test
        fun `대회 1주 전 = 18주 플랜의 Week 18`() {
            val sel = calc.determinePlanType(raceDay, raceDay.minusWeeks(1))
            assertAll(
                { assertEquals(18, sel.totalWeeks) },
                { assertEquals(18, sel.currentWeek) },
            )
        }

        @Test
        fun `12주 → 13주 사이 전환 없이 주차 연속`() {
            val at13 = calc.determinePlanType(raceDay, raceDay.minusWeeks(13))
            val at12 = calc.determinePlanType(raceDay, raceDay.minusWeeks(12))
            assertEquals(at13.currentWeek + 1, at12.currentWeek)
            assertEquals(at13.totalWeeks, at12.totalWeeks)
        }

        // --- 통합 플랜: 19주+ = 5주 사이클 + 18주 메인 ---

        @Test
        fun `대회 19주 전 = 통합 23주 플랜, Week 5 (사이클 마지막)`() {
            val sel = calc.determinePlanType(raceDay, raceDay.minusWeeks(19))
            assertAll(
                { assertEquals(23, sel.totalWeeks) },  // 5주 사이클 + 18주 메인
                { assertEquals(5, sel.currentWeek) },
            )
        }

        @Test
        fun `대회 23주 전 = 통합 23주 플랜, Week 1`() {
            val sel = calc.determinePlanType(raceDay, raceDay.minusWeeks(23))
            assertAll(
                { assertEquals(23, sel.totalWeeks) },
                { assertEquals(1, sel.currentWeek) },
            )
        }

        @Test
        fun `대회 25주 전 = 통합 28주 플랜 (10주 사이클 + 18주 메인)`() {
            val sel = calc.determinePlanType(raceDay, raceDay.minusWeeks(25))
            assertAll(
                { assertEquals(28, sel.totalWeeks) },  // ceil(7/5)*5 = 10 + 18
                { assertEquals(4, sel.currentWeek) },   // 28-25+1 = 4
            )
        }

        @Test
        fun `대회 28주 전 = 통합 28주 플랜, Week 1`() {
            val sel = calc.determinePlanType(raceDay, raceDay.minusWeeks(28))
            assertAll(
                { assertEquals(28, sel.totalWeeks) },
                { assertEquals(1, sel.currentWeek) },
            )
        }

        @Test
        fun `5주 윈도우 내 totalWeeks 안정적`() {
            // 19~23주 전: 모두 totalWeeks = 23
            for (w in 19..23) {
                val sel = calc.determinePlanType(raceDay, raceDay.minusWeeks(w.toLong()))
                assertEquals(23, sel.totalWeeks, "대회 ${w}주 전 totalWeeks")
            }
            // 24~28주 전: 모두 totalWeeks = 28
            for (w in 24..28) {
                val sel = calc.determinePlanType(raceDay, raceDay.minusWeeks(w.toLong()))
                assertEquals(28, sel.totalWeeks, "대회 ${w}주 전 totalWeeks")
            }
        }

        @Test
        fun `사이클 구간 내 currentWeek 연속 증가`() {
            // 23주→22주→...→19주 = Week 1→2→...→5
            for (w in 23 downTo 19) {
                val sel = calc.determinePlanType(raceDay, raceDay.minusWeeks(w.toLong()))
                assertEquals(23 - w + 1, sel.currentWeek, "대회 ${w}주 전 currentWeek")
            }
        }
    }

    // ──────────────────────────────────────────────
    //  determinePhase — 통합 플랜 페이즈 결정
    // ──────────────────────────────────────────────

    @Nested
    inner class DeterminePhaseTest {

        @Test
        fun `18주 플랜 - 페이즈 분배`() {
            assertEquals("BASE", calc.determinePhase(1, 18))
            assertEquals("BASE", calc.determinePhase(6, 18))
            assertEquals("DEVELOP", calc.determinePhase(7, 18))
            assertEquals("DEVELOP", calc.determinePhase(12, 18))
            assertEquals("PEAK", calc.determinePhase(13, 18))
            assertEquals("PEAK", calc.determinePhase(16, 18))
            assertEquals("TAPER", calc.determinePhase(17, 18))
            assertEquals("TAPER", calc.determinePhase(18, 18))
        }

        @Test
        fun `23주 플랜 - 사이클 5주 + 메인 18주`() {
            // Week 1-5: 사이클
            assertEquals("CYCLE_SPEED", calc.determinePhase(1, 23))
            assertEquals("CYCLE_THRESHOLD", calc.determinePhase(2, 23))
            assertEquals("CYCLE_VO2MAX", calc.determinePhase(3, 23))
            assertEquals("CYCLE_RACE_PACE", calc.determinePhase(4, 23))
            assertEquals("CYCLE_RECOVERY", calc.determinePhase(5, 23))
            // Week 6-23: 메인 (mainWeek 1-18)
            assertEquals("BASE", calc.determinePhase(6, 23))       // mainWeek 1
            assertEquals("BASE", calc.determinePhase(11, 23))      // mainWeek 6
            assertEquals("DEVELOP", calc.determinePhase(12, 23))   // mainWeek 7
            assertEquals("DEVELOP", calc.determinePhase(17, 23))   // mainWeek 12
            assertEquals("PEAK", calc.determinePhase(18, 23))      // mainWeek 13
            assertEquals("PEAK", calc.determinePhase(21, 23))      // mainWeek 16
            assertEquals("TAPER", calc.determinePhase(22, 23))     // mainWeek 17
            assertEquals("TAPER", calc.determinePhase(23, 23))     // mainWeek 18
        }

        @Test
        fun `28주 플랜 - 사이클 10주 반복 + 메인 18주`() {
            // Week 1-5: 첫 번째 사이클
            assertEquals("CYCLE_SPEED", calc.determinePhase(1, 28))
            assertEquals("CYCLE_RECOVERY", calc.determinePhase(5, 28))
            // Week 6-10: 두 번째 사이클 (반복)
            assertEquals("CYCLE_SPEED", calc.determinePhase(6, 28))
            assertEquals("CYCLE_RECOVERY", calc.determinePhase(10, 28))
            // Week 11-28: 메인 18주
            assertEquals("BASE", calc.determinePhase(11, 28))      // mainWeek 1
            assertEquals("TAPER", calc.determinePhase(28, 28))     // mainWeek 18
        }
    }

    // ──────────────────────────────────────────────
    //  18주 메인 플랜 — 다니엘스 주기화
    // ──────────────────────────────────────────────

    @Nested
    inner class MainPlan {

        private val plans = calc.generatePlan(
            goalTimeSeconds = 14400,   // 서브4 마라톤
            goalEvent = "MARATHON",
            totalWeeks = 18,
        )

        @Test
        fun `총 18주 플랜 생성`() {
            assertEquals(18, plans.size)
        }

        @Test
        fun `서브4 마라톤은 ADVANCED`() {
            plans.forEach { assertEquals(Level.ADVANCED, it.level) }
        }

        @Test
        fun `페이즈 순서 — Base, Develop, Peak, Taper`() {
            val phases = plans.map { it.phase }
            assertEquals("BASE", phases.first())
            assertEquals("TAPER", phases.last())
            assertTrue(phases.contains("DEVELOP"), "DEVELOP 포함")
            assertTrue(phases.contains("PEAK"), "PEAK 포함")
        }

        @Test
        fun `Base 1~6, Develop 7~12, Peak 13~16, Taper 17~18`() {
            (1..6).forEach { assertEquals("BASE", plans[it - 1].phase, "week $it") }
            (7..12).forEach { assertEquals("DEVELOP", plans[it - 1].phase, "week $it") }
            (13..16).forEach { assertEquals("PEAK", plans[it - 1].phase, "week $it") }
            (17..18).forEach { assertEquals("TAPER", plans[it - 1].phase, "week $it") }
        }

        @Test
        fun `테이퍼 주간은 볼륨 0_5`() {
            val taperWeeks = plans.filter { it.phase == "TAPER" }
            assertTrue(taperWeeks.isNotEmpty())
            taperWeeks.forEach { assertEquals(0.5, it.volumeMultiplier) }
        }

        @Test
        fun `VDOT 페이스가 모든 주에 동일`() {
            val first = plans.first().vdotPaces
            plans.forEach { assertEquals(first, it.vdotPaces) }
        }

        @Test
        fun `BEGINNER는 인터벌 스펙이 null`() {
            val beginnerPlans = calc.generatePlan(6000, "10K", 18)
            beginnerPlans.forEach { assertNull(it.intervalSpec) }
        }

        @Test
        fun `INTERMEDIATE는 인터벌 스펙이 존재`() {
            val intermediatePlans = calc.generatePlan(18000, "MARATHON", 18)
            intermediatePlans.forEach { plan ->
                assertEquals(Level.INTERMEDIATE, plan.level)
                assertNotNull(plan.intervalSpec, "week ${plan.weekNumber}")
            }
        }

        @Test
        fun `ADVANCED는 인터벌 스펙이 존재`() {
            plans.forEach { plan ->
                assertNotNull(plan.intervalSpec, "week ${plan.weekNumber}")
            }
        }
    }

    // ──────────────────────────────────────────────
    //  통합 플랜 — 사이클 + 메인
    // ──────────────────────────────────────────────

    @Nested
    inner class UnifiedPlan {

        // 23주 통합 플랜 (5주 사이클 + 18주 메인)
        private val plans = calc.generatePlan(
            goalTimeSeconds = 14400,
            goalEvent = "MARATHON",
            totalWeeks = 23,
        )

        @Test
        fun `총 23주 플랜 생성`() {
            assertEquals(23, plans.size)
        }

        @Test
        fun `사이클 5주 페이즈`() {
            assertEquals("CYCLE_SPEED", plans[0].phase)
            assertEquals("CYCLE_THRESHOLD", plans[1].phase)
            assertEquals("CYCLE_VO2MAX", plans[2].phase)
            assertEquals("CYCLE_RACE_PACE", plans[3].phase)
            assertEquals("CYCLE_RECOVERY", plans[4].phase)
        }

        @Test
        fun `사이클 후 메인 플랜 시작`() {
            assertEquals("BASE", plans[5].phase)      // week 6 = mainWeek 1
            assertEquals("DEVELOP", plans[11].phase)   // week 12 = mainWeek 7
            assertEquals("PEAK", plans[17].phase)      // week 18 = mainWeek 13
            assertEquals("TAPER", plans[22].phase)     // week 23 = mainWeek 18
        }

        @Test
        fun `회복 사이클 주 볼륨 감소`() {
            assertEquals(0.7, plans[4].volumeMultiplier)
        }

        @Test
        fun `사이클 주차 거리는 초반 BASE 수준으로 일정`() {
            val cycleDistances = plans.take(5).map { it.easyRunKm }
            // 모든 사이클 주차가 동일한 base 거리 (distanceWeek=3 기준)
            assertTrue(cycleDistances.distinct().size <= 2, "사이클 주차 거리가 크게 다르지 않아야 함")
        }

        @Test
        fun `메인 플랜 구간 롱런 점진 증가`() {
            val mainLongRuns = plans.drop(5).take(12).map { it.longRunKm }  // BASE + DEVELOP
            // 초반보다 후반 롱런이 길어야 함
            assertTrue(mainLongRuns.last() >= mainLongRuns.first(), "롱런 점진 증가")
        }
    }

    // ──────────────────────────────────────────────
    //  인터벌 스펙 — 주차별 / 레벨별
    // ──────────────────────────────────────────────

    @Nested
    inner class GetIntervalSpec {

        @Test
        fun `INTERMEDIATE 초반(1~4주) = 400m x 8`() {
            val spec = calc.getIntervalSpec(week = 2, totalWeeks = 18, level = Level.INTERMEDIATE)
            assertAll(
                { assertEquals(400, spec.intervalDistanceM) },
                { assertEquals(8, spec.reps) },
                { assertEquals(200, spec.recoveryDistanceM) },
            )
        }

        @Test
        fun `INTERMEDIATE 중반(5~8주) = 800m x 6`() {
            val spec = calc.getIntervalSpec(week = 6, totalWeeks = 18, level = Level.INTERMEDIATE)
            assertAll(
                { assertEquals(800, spec.intervalDistanceM) },
                { assertEquals(6, spec.reps) },
            )
        }

        @Test
        fun `ADVANCED 초반 = 800m x 10`() {
            val spec = calc.getIntervalSpec(week = 1, totalWeeks = 18, level = Level.ADVANCED)
            assertAll(
                { assertEquals(800, spec.intervalDistanceM) },
                { assertEquals(10, spec.reps) },
                { assertEquals(300, spec.recoveryDistanceM) },
            )
        }

        @Test
        fun `테이퍼 주간 - ADVANCED = 400m x 5`() {
            val spec = calc.getIntervalSpec(week = 17, totalWeeks = 18, level = Level.ADVANCED)
            assertAll(
                { assertEquals(400, spec.intervalDistanceM) },
                { assertEquals(5, spec.reps) },
                { assertEquals(130, spec.recoveryDistanceM) },
            )
        }
    }

    // ──────────────────────────────────────────────
    //  대회 직전 등록 시나리오
    // ──────────────────────────────────────────────

    @Nested
    inner class LateRegistration {

        @Test
        fun `대회 3주 전 등록 — 18주 플랜의 Week 16, PEAK 페이즈`() {
            val raceDay = LocalDate.of(2026, 6, 1)
            val today = raceDay.minusWeeks(3)
            val sel = calc.determinePlanType(raceDay, today)
            val plan = calc.generatePlan(14400, "MARATHON", sel.totalWeeks)
            val weekPlan = plan.find { it.weekNumber == sel.currentWeek }!!
            assertEquals("PEAK", weekPlan.phase)
        }

        @Test
        fun `대회 1주 전 — 18주 플랜의 Week 18, TAPER 페이즈`() {
            val raceDay = LocalDate.of(2026, 6, 1)
            val today = raceDay.minusWeeks(1)
            val sel = calc.determinePlanType(raceDay, today)
            val plan = calc.generatePlan(14400, "MARATHON", sel.totalWeeks)
            val weekPlan = plan.find { it.weekNumber == sel.currentWeek }!!
            assertEquals("TAPER", weekPlan.phase)
            assertEquals(0.5, weekPlan.volumeMultiplier)
        }

        @Test
        fun `대회 25주 전 등록 — 사이클 구간의 워크아웃`() {
            val raceDay = LocalDate.of(2026, 6, 1)
            val today = raceDay.minusWeeks(25)
            val sel = calc.determinePlanType(raceDay, today)
            val plan = calc.generatePlan(14400, "MARATHON", sel.totalWeeks)
            val weekPlan = plan.find { it.weekNumber == sel.currentWeek }!!
            // Week 4 = 사이클 4번째 (CYCLE_RACE_PACE)
            assertTrue(weekPlan.phase.startsWith("CYCLE_"), "사이클 페이즈여야 함")
        }
    }
}
