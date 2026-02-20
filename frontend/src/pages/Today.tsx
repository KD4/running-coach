import { useEffect, useState } from 'react';
import { getTodaySchedule } from '../api/schedule';
import type { TodayResponse } from '../types';

const WORKOUT_LABELS: Record<string, string> = {
  EASY: '이지런',
  TEMPO: '템포런',
  INTERVAL: '인터벌',
  LONG: '롱런',
  REST: '휴식',
  RACE: '레이스',
  PACE_RUN: '페이스런',
};

const WORKOUT_COLORS: Record<string, string> = {
  EASY: '#4CAF50',
  TEMPO: '#FF9800',
  INTERVAL: '#F44336',
  LONG: '#2196F3',
  REST: '#9E9E9E',
  RACE: '#9C27B0',
  PACE_RUN: '#00BCD4',
};

export default function Today() {
  const [data, setData] = useState<TodayResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDiet, setShowDiet] = useState(false);

  useEffect(() => {
    getTodaySchedule()
      .then(setData)
      .catch(() => setError('오늘의 훈련을 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page"><p>로딩 중...</p></div>;
  if (error) return <div className="page"><p className="error-text">{error}</p></div>;
  if (!data) return null;

  const workout = data.workout;
  const type = workout?.workoutType ?? 'REST';
  const color = WORKOUT_COLORS[type] ?? '#9E9E9E';

  return (
    <div className="page today-page">
      <div className="today-header">
        <span className="week-badge">Week {data.weekNumber} / {data.totalWeeks}</span>
        <h1>{new Date(data.date).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}</h1>
      </div>

      <div className="workout-card" style={{ borderLeftColor: color }}>
        {data.isRestDay ? (
          <div className="rest-day">
            <div className="workout-type-badge" style={{ backgroundColor: '#9E9E9E' }}>휴식</div>
            <p className="rest-message">오늘은 쉬는 날입니다. 충분한 회복을 취하세요!</p>
          </div>
        ) : workout ? (
          <>
            <div className="workout-type-badge" style={{ backgroundColor: color }}>
              {WORKOUT_LABELS[type] ?? type}
            </div>
            <div className="workout-details">
              <div className="workout-stat">
                <span className="stat-value">{workout.distanceKm}</span>
                <span className="stat-label">km</span>
              </div>
              {workout.paceTarget && (
                <div className="workout-stat">
                  <span className="stat-value">{workout.paceTarget}</span>
                  <span className="stat-label">/km</span>
                </div>
              )}
            </div>
            {workout.description && <p className="workout-desc">{workout.description}</p>}
          </>
        ) : (
          <div className="rest-day">
            <div className="workout-type-badge" style={{ backgroundColor: '#9E9E9E' }}>휴식</div>
            <p className="rest-message">오늘은 훈련이 없습니다.</p>
          </div>
        )}
      </div>

      <div className="calories-card">
        <h2>오늘의 칼로리</h2>
        <div className="calories-total">{data.calories.totalRecommended.toLocaleString()} kcal</div>
        <div className="calories-breakdown">
          <div className="cal-row">
            <span>기초대사량 (BMR)</span>
            <span>{data.calories.bmr} kcal</span>
          </div>
          <div className="cal-row">
            <span>훈련 소모</span>
            <span>{data.calories.trainingBurn} kcal</span>
          </div>
          <div className="cal-row">
            <span>내일 훈련 대비</span>
            <span>{data.calories.tomorrowPrep} kcal</span>
          </div>
          {data.calories.dailyDeficit > 0 && (
            <div className="cal-row">
              <span>감량 적자</span>
              <span style={{ color: '#F44336' }}>-{data.calories.dailyDeficit} kcal</span>
            </div>
          )}
        </div>
        {data.calories.targetWeight != null && data.calories.weightToLose > 0 && (
          <>
            <button
              className="diet-toggle-btn"
              onClick={() => setShowDiet((v) => !v)}
            >
              {showDiet ? '감량 목표 접기' : '감량 목표 보기'}
              <span className={`diet-toggle-arrow ${showDiet ? 'open' : ''}`}>&#9662;</span>
            </button>
            {showDiet && (
              <div className="calories-diet-section">
                <div className="calories-breakdown">
                  <div className="cal-row">
                    <span>목표 체중</span>
                    <span>{data.calories.targetWeight} kg</span>
                  </div>
                  <div className="cal-row">
                    <span>감량 필요</span>
                    <span>{data.calories.weightToLose.toFixed(1)} kg</span>
                  </div>
                  <div className="cal-row">
                    <span>일일 적자</span>
                    <span style={{ color: '#F44336' }}>-{data.calories.dailyDeficit} kcal</span>
                  </div>
                  <div className="cal-row">
                    <span>남은 기간</span>
                    <span>D-{data.calories.dietDaysRemaining}</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
