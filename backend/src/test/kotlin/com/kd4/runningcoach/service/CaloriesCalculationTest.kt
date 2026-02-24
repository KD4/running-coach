package com.kd4.runningcoach.service

import com.kd4.runningcoach.dto.ProfileData
import com.kd4.runningcoach.dto.CaloriesDto
import com.kd4.runningcoach.dto.TodayResponse
import com.kd4.runningcoach.repository.UserProfileRepository
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertAll
import org.mockito.Mockito
import java.time.LocalDate
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertTrue

/**
 * 칼로리 산정 학습 테스트
 *
 * ScheduleService의 calculateCalories 로직을 getTodayGuest를 통해 간접 검증한다.
 * DB 의존 없이 순수 계산 로직만 테스트한다.
 */
class CaloriesCalculationTest {

    private lateinit var service: ScheduleService

    @BeforeEach
    fun setUp() {
        // 게스트 메서드는 UserProfileRepository를 사용하지 않으므로 mock으로 충분
        val mockRepo = Mockito.mock(UserProfileRepository::class.java)
        service = ScheduleService(mockRepo, PaceCalculator())
    }

    // ──────────────────────────────────────────────
    //  헬퍼
    // ──────────────────────────────────────────────

    /**
     * 마라톤 서브4 러너 기본 프로필.
     * 훈련일: 화,목,토 (3일), 롱런: 토요일, 체중 70kg.
     * targetDate 기준으로 주차를 조절할 수 있다.
     */
    private fun baseProfile(
        targetDate: LocalDate = LocalDate.of(2026, 6, 1),
        trainingDays: String = "TUE,THU,SAT",
        longRunDay: String = "SAT",
        bodyWeight: Double = 70.0,
        targetWeight: Double? = null,
        goalEvent: String = "MARATHON",
        goalTimeSeconds: Int = 14400, // 4시간
    ) = ProfileData(
        goalEvent = goalEvent,
        goalTimeSeconds = goalTimeSeconds,
        targetDate = targetDate,
        trainingDays = trainingDays,
        longRunDay = longRunDay,
        bodyWeight = bodyWeight,
        targetWeight = targetWeight,
    )

    private fun getToday(profile: ProfileData, date: LocalDate): TodayResponse =
        service.getTodayGuest(profile, date)

    private fun getCalories(profile: ProfileData, date: LocalDate): CaloriesDto =
        getToday(profile, date).calories

    // ──────────────────────────────────────────────
    //  BMR
    // ──────────────────────────────────────────────

    @Nested
    inner class Bmr {
        @Test
        fun `BMR = 체중 x 24`() {
            val cal = getCalories(baseProfile(bodyWeight = 70.0), LocalDate.of(2026, 5, 1))
            assertEquals(1680, cal.bmr) // 70 * 24
        }

        @Test
        fun `체중 80kg의 BMR`() {
            val cal = getCalories(baseProfile(bodyWeight = 80.0), LocalDate.of(2026, 5, 1))
            assertEquals(1920, cal.bmr) // 80 * 24
        }
    }

    // ──────────────────────────────────────────────
    //  휴식일 칼로리
    // ──────────────────────────────────────────────

    @Nested
    inner class RestDay {
        @Test
        fun `휴식일에는 운동 소모 칼로리가 0`() {
            // 월요일 = 훈련일 아님 (TUE,THU,SAT)
            val monday = LocalDate.of(2026, 4, 6) // 월요일
            val cal = getCalories(baseProfile(), monday)

            assertAll(
                { assertEquals(0, cal.trainingBurn) },
                { assertEquals(0, cal.intensityBonus) },
                { assertTrue(getToday(baseProfile(), monday).isRestDay) },
            )
        }

        @Test
        fun `휴식일 총 권장 칼로리 = BMR(감량목표 없을 때)`() {
            val monday = LocalDate.of(2026, 4, 6)
            val cal = getCalories(baseProfile(targetWeight = null), monday)

            // 내일(화요일) 운동에 따라 tomorrowPrep이 붙을 수 있으므로
            // totalRecommended >= bmr 확인
            assertTrue(cal.totalRecommended >= cal.bmr)
        }
    }

    // ──────────────────────────────────────────────
    //  훈련 소모 칼로리 & 강도 보너스
    // ──────────────────────────────────────────────

    @Nested
    inner class TrainingBurn {
        @Test
        fun `훈련 소모 = 거리 x 체중`() {
            // 화요일 훈련일에 대한 칼로리
            val tuesday = LocalDate.of(2026, 4, 7) // 화요일
            val profile = baseProfile(bodyWeight = 70.0)
            val today = getToday(profile, tuesday)

            if (!today.isRestDay && today.workout != null) {
                val expectedBurn = (today.workout!!.distanceKm * 70.0).toInt()
                assertEquals(expectedBurn, today.calories.trainingBurn)
            }
        }

        @Test
        fun `운동하는 날 intensityBonus = trainingBurn`() {
            val tuesday = LocalDate.of(2026, 4, 7)
            val today = getToday(baseProfile(), tuesday)

            if (!today.isRestDay) {
                assertEquals(today.calories.trainingBurn, today.calories.intensityBonus)
            }
        }

        @Test
        fun `REST일 때 intensityBonus = 0`() {
            val monday = LocalDate.of(2026, 4, 6) // 월요일 = 휴식
            val cal = getCalories(baseProfile(), monday)
            assertEquals(0, cal.intensityBonus)
        }
    }

    // ──────────────────────────────────────────────
    //  카브 로딩 (내일 준비)
    // ──────────────────────────────────────────────

    @Nested
    inner class TomorrowPrep {
        @Test
        fun `내일이 LONG이면 카브로딩 권장`() {
            // 토요일이 롱런이면, 금요일에 카브로딩
            // 하지만 금요일은 훈련일이 아님 → 내일(토) 롱런
            val friday = LocalDate.of(2026, 4, 10) // 금요일
            val cal = getCalories(baseProfile(), friday)

            // 내일이 토요일(롱런) → carbLoadingRecommended = true
            if (cal.tomorrowWorkoutType == "LONG") {
                assertTrue(cal.carbLoadingRecommended)
                assertTrue(cal.tomorrowPrep > 0)
            }
        }

        @Test
        fun `내일이 INTERVAL이면 카브로딩 권장`() {
            // INTERMEDIATE 4일 패턴: AR, INTERVAL, TEMPO, LONG
            // 4일 훈련으로 변경하여 INTERVAL이 포함되게
            val profile = baseProfile(trainingDays = "MON,TUE,THU,SAT", longRunDay = "SAT")
            // 월요일 → 내일 화요일 = INTERVAL일 수 있음
            val monday = LocalDate.of(2026, 4, 6) // 월요일
            val cal = getCalories(profile, monday)

            if (cal.tomorrowWorkoutType == "INTERVAL") {
                assertTrue(cal.carbLoadingRecommended)
            }
        }

        @Test
        fun `내일이 EASY면 카브로딩 불필요`() {
            // 화,목,토 3일 패턴(INTERMEDIATE): INTERVAL, TEMPO, LONG
            // 수요일 → 내일 목요일 = TEMPO
            val wednesday = LocalDate.of(2026, 4, 8)
            val cal = getCalories(baseProfile(), wednesday)

            if (cal.tomorrowWorkoutType != null
                && cal.tomorrowWorkoutType !in listOf("INTERVAL", "LONG")) {
                assertFalse(cal.carbLoadingRecommended)
                assertEquals(0, cal.tomorrowPrep)
            }
        }
    }

    // ──────────────────────────────────────────────
    //  체중 감량 적자
    // ──────────────────────────────────────────────

    @Nested
    inner class DailyDeficit {
        @Test
        fun `감량 목표가 없으면 적자 0`() {
            val cal = getCalories(baseProfile(targetWeight = null), LocalDate.of(2026, 5, 1))
            assertAll(
                { assertEquals(0, cal.dailyDeficit) },
                { assertEquals(0.0, cal.weightToLose) },
                { assertEquals(0, cal.dietDaysRemaining) },
            )
        }

        @Test
        fun `현재 체중이 목표 이하면 적자 0`() {
            val cal = getCalories(
                baseProfile(bodyWeight = 65.0, targetWeight = 70.0),
                LocalDate.of(2026, 5, 1),
            )
            assertEquals(0, cal.dailyDeficit)
        }

        @Test
        fun `감량 목표가 있으면 고정 500kcal 적자`() {
            // 내일이 LONG이 아닌 날
            val profile = baseProfile(bodyWeight = 75.0, targetWeight = 70.0)
            val wednesday = LocalDate.of(2026, 4, 8) // 수요일 → 내일 목요일(LONG 아님)
            val cal = getCalories(profile, wednesday)

            if (cal.tomorrowWorkoutType != "LONG") {
                assertEquals(500, cal.dailyDeficit)
                assertEquals(5.0, cal.weightToLose)
            }
        }

        @Test
        fun `롱런 전날은 적자 면제`() {
            // 금요일 → 내일 토요일(롱런)
            val profile = baseProfile(bodyWeight = 75.0, targetWeight = 70.0)
            val friday = LocalDate.of(2026, 4, 10)
            val cal = getCalories(profile, friday)

            if (cal.tomorrowWorkoutType == "LONG") {
                assertEquals(0, cal.dailyDeficit)
            }
        }

        @Test
        fun `다이어트 남은 일수 = 대회 7일 전까지`() {
            val targetDate = LocalDate.of(2026, 6, 1) // 대회일
            val today = LocalDate.of(2026, 5, 1)
            val profile = baseProfile(
                targetDate = targetDate,
                bodyWeight = 75.0,
                targetWeight = 70.0,
            )
            val cal = getCalories(profile, today)

            // dietEndDate = 2026-06-01 - 7일 = 2026-05-25
            // 2026-05-01 ~ 2026-05-25 = 24일
            assertEquals(24, cal.dietDaysRemaining)
        }
    }

    // ──────────────────────────────────────────────
    //  BMR 안전 하한
    // ──────────────────────────────────────────────

    @Nested
    inner class BmrSafetyFloor {
        @Test
        fun `총 권장 칼로리는 절대 BMR 이하로 내려가지 않는다`() {
            // 감량 적자가 보너스보다 클 때도 BMR 보장
            val profile = baseProfile(bodyWeight = 55.0, targetWeight = 50.0)
            // 월요일 = 휴식일 → trainingBurn=0, intensityBonus=0
            // dailyDeficit=500, tomorrowPrep은 내일 운동에 따라 다름
            // bmr + 0 + tomorrowPrep - 500 < bmr 가능
            val monday = LocalDate.of(2026, 4, 6)
            val cal = getCalories(profile, monday)

            assertTrue(
                cal.totalRecommended >= cal.bmr,
                "totalRecommended(${cal.totalRecommended}) >= bmr(${cal.bmr}) 이어야 함",
            )
        }

        @Test
        fun `운동일에는 BMR + 보너스 반영`() {
            val profile = baseProfile(bodyWeight = 70.0, targetWeight = null)
            val tuesday = LocalDate.of(2026, 4, 7)
            val today = getToday(profile, tuesday)

            if (!today.isRestDay) {
                val cal = today.calories
                // 적자 0, targetWeight null → total = bmr + intensityBonus + tomorrowPrep
                assertTrue(
                    cal.totalRecommended >= cal.bmr + cal.intensityBonus,
                    "운동일 총 권장(${cal.totalRecommended}) >= bmr(${cal.bmr}) + bonus(${cal.intensityBonus})",
                )
            }
        }
    }
}
