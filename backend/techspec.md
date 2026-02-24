# 훈련 스케줄 고도화 테크스펙 v2
## 다니엘스 러닝 포뮬러(Jack Daniels' Running Formula) 기반

---

## 1. 핵심 개념: VDOT 시스템

### VDOT란
VDOT는 최근 레이스 기록을 기반으로 현재 러닝 피트니스를 수치화한 지표.
목표 완주 시간을 입력하면 → VDOT 계산 → 훈련 페이스 5종 자동 산출.

### 훈련 페이스 5종 (VDOT 기반)
| 타입 | 강도 | 설명 | 오프셋 (목표 MP 기준) |
|---|---|---|---|
| E (Easy) | 59-74% VO2max | 조깅, 회복런, 롱런 대부분 | MP + 60~90초/km |
| M (Marathon) | 75-84% VO2max | 마라톤 페이스 | MP 그대로 |
| T (Threshold) | 85-88% VO2max | 템포런, 젖산역치 | MP - 12초/km |
| I (Interval) | 95-100% VO2max | 인터벌, VO2max 향상 | MP - 27초/km |
| R (Repetition) | 105-120% VO2max | 스피드, 400m 이하 | MP - 43초/km |

---

## 2. 플랜 선택 로직 (남은 기간 기반)

대회까지 남은 주차(weeksToRace)에 따라 3가지 플랜 중 자동 배정.
**기간이 아무리 짧아도 기간 부족 안내 없이 적절한 플랜 적용.**

```kotlin
fun selectPlan(weeksToRace: Int): PlanType {
    return when {
        weeksToRace <= 12 -> PlanType.TWELVE_WEEK      // 12주 이하
        weeksToRace <= 18 -> PlanType.EIGHTEEN_WEEK    // 13~18주
        else -> PlanType.FIVE_WEEK_CYCLE               // 19주 이상
    }
}
```

### 현재 주차 계산
```kotlin
fun getCurrentWeekNumber(weeksToRace: Int, planType: PlanType): Int {
    return when (planType) {
        PlanType.TWELVE_WEEK ->
            // 12주 플랜 역산: 3주 남으면 10주차부터 시작
            maxOf(1, 12 - weeksToRace + 1)

        PlanType.EIGHTEEN_WEEK ->
            // 18주 플랜 역산: 15주 남으면 4주차부터 시작
            maxOf(1, 18 - weeksToRace + 1)

        PlanType.FIVE_WEEK_CYCLE ->
            // 5주 순환: 현재 사이클 내 위치 계산
            val cyclePosition = weeksToRace % 5
            if (cyclePosition == 0) 5 else cyclePosition
    }
}
```

---

## 3. 플랜별 상세 구조

### 3-1. 12주 플랜 (weeksToRace ≤ 12)

대회까지 12주 이하 남은 경우. 기간이 짧을수록 후반 주차부터 시작.

**레벨별 주간 패턴**

입문 (MP ≥ 9분/km):
```
[E, REST, E, REST, E+스트라이드, LONG(E페이스), REST]
```

중급 (MP 6:30~9분/km):
```
[E, Q2(T), E, REST, E+스트라이드, Q1(LONG+M), REST]
```

고급 (MP < 6:30/km):
```
[Q2(I), E, Q3(T), E, E+스트라이드, Q1(LONG+T), REST]
```

**주차별 롱런 거리 (중급 기준)**
| 주차 | 롱런 | 특이사항 |
|---|---|---|
| 1~3주 | 16~20km | 기초 빌드업 |
| 4~6주 | 22~26km | 발전 |
| 7~9주 | 28~32km | 피크 |
| 10주 | 24km | 회복주 |
| 11주 | 16km | 테이퍼 시작 |
| 12주 | 8km | 대회 직전 |

**인터벌 구성 (주차별)**
| 주차 | 구성 |
|---|---|
| 1~4주 | 400m × 8개, 200m 회복 조깅 |
| 5~8주 | 800m × 6개, 400m 회복 조깅 |
| 9~10주 | 1km × 5개, 400m 회복 조깅 |
| 11~12주 | 400m × 4개 (테이퍼, 볼륨 감소) |

---

### 3-2. 18주 플랜 (13주 ≤ weeksToRace ≤ 18)

다니엘스 2Q 프로그램 기반. 주당 2회 Quality 워크아웃.

**핵심 원칙**
- Q1: 롱런 (+ M 또는 T 페이스 혼합)
- Q2: 미들런 (+ T 또는 I 페이스)
- 나머지: E 페이스 자유

**주간 패턴 (주 5일 기준)**
```
[Q1(LONG+M), E, E+스트라이드, Q2(T+I), E]
```

**18주 구조**
| 구간 | 주차 | 내용 |
|---|---|---|
| 베이스 | 1~6주 | E 위주, 롱런 빌드업, R 페이스 도입 |
| 발전 | 7~12주 | T/I 강도 증가, 롱런 피크 |
| 강화 | 13~16주 | M 페이스 롱런, 고강도 Q2 |
| 테이퍼 | 17~18주 | 볼륨 50% 감소, 강도 유지 |

**Q1 예시 (주차별)**
```
8주차:  16km E + 8km M pace
12주차: 12km E + 3×3km T (2분 휴식) + 4km E
16주차: 10km E + 16km M pace
```

**Q2 예시 (주차별)**
```
8주차:  3km E + 4×1km I (400m 회복) + 3km E
12주차: 3km E + 6km T + 3km E
16주차: 3km E + 3×2km T (1분 휴식) + 3km E
```

---

### 3-3. 5주 순환 프로그램 (weeksToRace > 18)

대회까지 19주 이상 남은 경우. 끊임없이 반복 가능한 베이스 빌딩 사이클.
대회 18주 전이 되는 시점에 자동으로 18주 플랜으로 전환.

**5주 사이클 구조**
| 사이클 주차 | 훈련 포커스 | 설명 |
|---|---|---|
| 1주 | E + R | 스피드, 달리기 경제성 향상 |
| 2주 | E + T | 젖산역치 향상 |
| 3주 | E + I | VO2max 향상 |
| 4주 | E + M | 레이스 페이스 감각 |
| 5주 | E only | 완전 회복주 |

**주간 패턴 (1~4주)**
```
[E, 고강도워크아웃, E, REST, E+스트라이드, LONG(E), REST]
```

**주간 패턴 (5주 - 회복)**
```
[E, E, REST, E, REST, LONG(E, 짧게), REST]
```

**18주 전환 시점 계산**
```kotlin
fun shouldSwitchToEighteenWeek(weeksToRace: Int): Boolean {
    return weeksToRace <= 18
}
```
→ 유저가 앱을 열 때마다 자동 체크, 18주 이하 진입 시 플랜 전환 안내.

---

## 4. 레벨 판정 로직

목표 레이스 페이스(MP = 목표시간 / 거리)로 자동 판정:

```kotlin
fun determineLevel(goalTimeSeconds: Int, distanceKm: Double): RunnerLevel {
    val mpSecPerKm = goalTimeSeconds / distanceKm
    return when {
        mpSecPerKm >= 540 -> RunnerLevel.NOVICE         // 9분/km 이상
        mpSecPerKm >= 390 -> RunnerLevel.INTERMEDIATE   // 6:30~9분/km
        else -> RunnerLevel.ADVANCED                    // 6:30 미만
    }
}
```

---

## 5. 페이스 계산 로직

```kotlin
data class TrainingPaces(
    val easyPaceMin: Int,       // 초/km
    val easyPaceMax: Int,
    val marathonPace: Int,
    val thresholdPace: Int,
    val intervalPace: Int,
    val repetitionPace: Int
)

fun calculatePaces(goalTimeSeconds: Int, distanceKm: Double): TrainingPaces {
    val mp = (goalTimeSeconds / distanceKm).toInt()  // 초/km
    return TrainingPaces(
        easyPaceMin = mp + 60,
        easyPaceMax = mp + 90,
        marathonPace = mp,
        thresholdPace = mp - 12,
        intervalPace = mp - 27,
        repetitionPace = mp - 43
    )
}

// 초/km → "5:30/km" 형식으로 변환
fun formatPace(secondsPerKm: Int): String {
    val min = secondsPerKm / 60
    val sec = secondsPerKm % 60
    return "${min}:${sec.toString().padStart(2, '0')}/km"
}
```

---

## 6. 테이퍼링 로직

```
12주 플랜: 11~12주차
18주 플랜: 17~18주차
5주 순환:  18주 플랜 전환 후 테이퍼링 적용

테이퍼 1주 전: 볼륨 50% 감소, 강도 유지
테이퍼 최종주: 볼륨 30%, E + 스트라이드 위주
대회 전날:     완전 휴식 or 15분 E 조깅
```

---

## 7. DB 스키마 변경

### training_plans (신규)
```sql
CREATE TABLE training_plans (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    plan_type VARCHAR(30) NOT NULL,     -- TWELVE_WEEK / EIGHTEEN_WEEK / FIVE_WEEK_CYCLE
    runner_level VARCHAR(20) NOT NULL,  -- NOVICE / INTERMEDIATE / ADVANCED
    total_weeks INT NOT NULL,
    description TEXT
);
```

### training_templates 변경
```sql
ALTER TABLE training_templates
ADD COLUMN plan_type VARCHAR(30) NOT NULL,   -- TWELVE_WEEK / EIGHTEEN_WEEK / FIVE_WEEK_CYCLE
ADD COLUMN workout_label VARCHAR(10),        -- Q1 / Q2 / Q3 / E / REST
ADD COLUMN pace_type VARCHAR(5),             -- E / M / T / I / R
ADD COLUMN duration_minutes INT,             -- 거리 대신 시간 기반 훈련용
ADD COLUMN notes TEXT;                       -- 워크아웃 상세 설명
```

---

## 8. API

```
GET /api/schedule/plan-info
  → 현재 플랜 타입, 현재 주차, 총 주차, 레벨 반환

GET /api/schedule/today
  → 오늘 워크아웃 + E/M/T/I/R 페이스 가이드 포함

GET /api/schedule/weekly?week={n}
  → 특정 주차 전체 스케줄

GET /api/schedule/monthly?year={y}&month={m}
  → 이번 달 캘린더
```

---

## 9. 응답 예시

```json
{
  "planInfo": {
    "planType": "EIGHTEEN_WEEK",
    "currentWeek": 8,
    "totalWeeks": 18,
    "runnerLevel": "INTERMEDIATE"
  },
  "today": {
    "workoutLabel": "Q2",
    "workoutType": "INTERVAL",
    "description": "3km E + 4×1km I (400m 회복 조깅) + 2km E",
    "targetPaces": {
      "easy": "6:45~7:15/km",
      "marathon": "6:00/km",
      "threshold": "5:48/km",
      "interval": "5:33/km",
      "repetition": "5:17/km"
    },
    "totalDistanceKm": 9.6,
    "estimatedDurationMinutes": 65
  }
}
```

---

## 10. 구현 우선순위

1. `calculatePaces()` — VDOT 기반 페이스 5종 계산
2. `selectPlan()` + `getCurrentWeekNumber()` — 플랜 자동 선택 및 주차 계산
3. `training_templates` 데이터 입력 (3개 플랜 × 레벨별 × 주차별)
4. `GET /api/schedule/plan-info` API 추가
5. `GET /api/schedule/today` 응답에 페이스 가이드 추가
6. 테이퍼링 로직
7. 5주 순환 → 18주 플랜 자동 전환 로직