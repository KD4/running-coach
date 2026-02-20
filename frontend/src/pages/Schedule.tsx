import { useEffect, useState } from 'react';
import { getMonthlySchedule } from '../api/schedule';
import type { MonthlyScheduleResponse, ScheduleDayDto } from '../types';

const WORKOUT_COLORS: Record<string, string> = {
  EASY: '#4CAF50',
  TEMPO: '#FF9800',
  INTERVAL: '#F44336',
  LONG: '#2196F3',
  REST: '#9E9E9E',
  RACE: '#9C27B0',
};

const WORKOUT_SHORT: Record<string, string> = {
  EASY: '이지',
  TEMPO: '템포',
  INTERVAL: '인터벌',
  LONG: '롱런',
  REST: '휴식',
  RACE: '레이스',
};

const DAY_HEADERS = ['일', '월', '화', '수', '목', '금', '토'];

export default function Schedule() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [data, setData] = useState<MonthlyScheduleResponse | null>(null);
  const [selected, setSelected] = useState<ScheduleDayDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getMonthlySchedule(year, month)
      .then((d) => {
        setData(d);
        setSelected(null);
      })
      .catch(() => setError('스케줄을 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, [year, month]);

  const prevMonth = () => {
    if (month === 1) { setYear(year - 1); setMonth(12); }
    else setMonth(month - 1);
  };

  const nextMonth = () => {
    if (month === 12) { setYear(year + 1); setMonth(1); }
    else setMonth(month + 1);
  };

  // Build calendar grid
  const buildGrid = () => {
    if (!data) return [];
    const firstDay = new Date(year, month - 1, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(year, month, 0).getDate();

    const dayMap: Record<string, ScheduleDayDto> = {};
    data.days.forEach((d) => { dayMap[d.date] = d; });

    const cells: (ScheduleDayDto | null)[] = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push(dayMap[dateStr] ?? null);
    }
    return cells;
  };

  const cells = buildGrid();

  return (
    <div className="page schedule-page">
      <div className="month-nav">
        <button className="nav-btn" onClick={prevMonth}>&lt;</button>
        <h2>{year}년 {month}월</h2>
        <button className="nav-btn" onClick={nextMonth}>&gt;</button>
      </div>

      {loading && <p>로딩 중...</p>}
      {error && <p className="error-text">{error}</p>}

      {!loading && !error && (
        <>
          <div className="calendar">
            <div className="calendar-header">
              {DAY_HEADERS.map((d) => <div key={d} className="cal-header-cell">{d}</div>)}
            </div>
            <div className="calendar-body">
              {cells.map((cell, i) => {
                if (!cell) return <div key={i} className="cal-cell empty" />;
                const day = new Date(cell.date).getDate();
                const type = cell.workout?.workoutType;
                const color = type ? WORKOUT_COLORS[type] ?? '#9E9E9E' : undefined;
                const isToday = cell.date === new Date().toISOString().split('T')[0];

                return (
                  <div
                    key={i}
                    className={`cal-cell ${isToday ? 'today' : ''} ${selected?.date === cell.date ? 'selected' : ''}`}
                    onClick={() => setSelected(cell)}
                  >
                    <span className="cal-day">{day}</span>
                    {type && type !== 'REST' && (
                      <span className="cal-dot" style={{ backgroundColor: color }} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="legend">
            {Object.entries(WORKOUT_COLORS).filter(([k]) => k !== 'REST').map(([key, color]) => (
              <div key={key} className="legend-item">
                <span className="legend-dot" style={{ backgroundColor: color }} />
                <span>{WORKOUT_SHORT[key]}</span>
              </div>
            ))}
          </div>

          {selected && (
            <div className="day-detail">
              <h3>{new Date(selected.date).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}</h3>
              <span className="week-badge">Week {selected.weekNumber}</span>
              {selected.workout && selected.workout.workoutType !== 'REST' ? (
                <div className="detail-workout">
                  <div className="workout-type-badge" style={{ backgroundColor: WORKOUT_COLORS[selected.workout.workoutType] ?? '#9E9E9E' }}>
                    {WORKOUT_SHORT[selected.workout.workoutType] ?? selected.workout.workoutType}
                  </div>
                  <p><strong>{selected.workout.distanceKm} km</strong> {selected.workout.paceTarget && `| ${selected.workout.paceTarget}/km`}</p>
                  {selected.workout.description && <p className="workout-desc">{selected.workout.description}</p>}
                </div>
              ) : (
                <p className="rest-message">{selected.isTrainingDay ? '휴식' : '훈련 없는 날'}</p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
