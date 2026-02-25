import { useEffect, useState } from 'react';
import { getMonthlySchedule } from '../api/schedule';
import type { MonthlyScheduleResponse, ScheduleDayDto } from '../types';
import { Paragraph, Spacing, Badge, Loader } from '@toss/tds-mobile';
import { css } from '@emotion/react';
import { WORKOUT_COLORS, WORKOUT_SHORT, WORKOUT_LABELS } from '../constants/workout';
import { color, spacing, radius } from '../styles/tokens';
import { pageStyle } from '../styles/common';

const DAY_HEADERS = ['일', '월', '화', '수', '목', '금', '토'];

/** 범례에서 제외할 workout 타입 */
const LEGEND_EXCLUDE = new Set(['REST', 'PACE_RUN']);

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
      .catch((err) => {
        if (err?.response?.status === 404) {
          setError('프로필 설정이 필요합니다. 프로필 페이지에서 설정해주세요.');
        } else {
          setError('스케줄을 불러오지 못했습니다.');
        }
      })
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

  const buildGrid = () => {
    if (!data) return [];
    const firstDay = new Date(year, month - 1, 1).getDay();
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
    <div css={pageStyle}>
      {/* 월 네비게이션 */}
      <div css={monthNavStyle}>
        <button css={navBtnStyle} onClick={prevMonth} aria-label="이전 달">&#8249;</button>
        <Paragraph typography="st5">{`${year}년 ${month}월`}</Paragraph>
        <button css={navBtnStyle} onClick={nextMonth} aria-label="다음 달">&#8250;</button>
      </div>

      {loading && (
        <div css={loadingCenterStyle}>
          <Loader />
          <Spacing size={spacing.md} />
          <Paragraph typography="st6" color="secondary">로딩 중...</Paragraph>
        </div>
      )}
      {error && <Paragraph typography="st6" color="danger">{error}</Paragraph>}

      {!loading && !error && (
        <>
          {/* 캘린더 그리드 */}
          <div css={calendarStyle}>
            <div css={calendarHeaderStyle}>
              {DAY_HEADERS.map((d) => (
                <div key={d} css={calHeaderCellStyle}>{d}</div>
              ))}
            </div>
            <div css={calendarBodyStyle}>
              {cells.map((cell, i) => {
                if (!cell) return <div key={i} css={calCellEmptyStyle} />;
                const day = new Date(cell.date).getDate();
                const type = cell.workout?.workoutType;
                const dotColor = type ? WORKOUT_COLORS[type] ?? '#9E9E9E' : undefined;
                const isToday = cell.date === new Date().toISOString().split('T')[0];
                const isSelected = selected?.date === cell.date;

                return (
                  <div
                    key={i}
                    css={calCellStyle(isSelected)}
                    onClick={() => setSelected(cell)}
                  >
                    <span css={calDayStyle(isToday)}>{day}</span>
                    <span css={calDotStyle(type && type !== 'REST' ? dotColor! : 'transparent')} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* 범례 */}
          <div css={legendStyle}>
            {Object.entries(WORKOUT_COLORS)
              .filter(([k]) => !LEGEND_EXCLUDE.has(k))
              .map(([key, c]) => (
                <div key={key} css={legendItemStyle}>
                  <span css={legendDotStyle(c)} />
                  <Paragraph typography="st7" color="secondary">{WORKOUT_SHORT[key]}</Paragraph>
                </div>
              ))}
          </div>

          {/* 날짜 상세 */}
          {selected && (
            <div css={dayDetailStyle}>
              <Paragraph typography="st5">
                {new Date(selected.date).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}
              </Paragraph>
              <Spacing size={spacing.xs} />
              <Badge size="small" variant="weak" color="blue">Week {selected.weekNumber}</Badge>
              {selected.workout && selected.workout.workoutType !== 'REST' ? (
                <>
                  <Spacing size={spacing.md} />
                  <div css={workoutTypeLabelStyle(WORKOUT_COLORS[selected.workout.workoutType] ?? '#9E9E9E')}>
                    <Paragraph typography="st8" css={css`color: #FFFFFF;`}>
                      {WORKOUT_LABELS[selected.workout.workoutType] ?? selected.workout.workoutType}
                    </Paragraph>
                  </div>
                  <Spacing size={spacing.sm} />
                  <Paragraph typography="st6">
                    {`${selected.workout.distanceKm} km`}
                    {selected.workout.paceTarget && ` | ${selected.workout.paceTarget}/km`}
                  </Paragraph>
                  {selected.workout.description && (
                    <>
                      <Spacing size={spacing.xs} />
                      <Paragraph typography="st7" color="secondary">{selected.workout.description}</Paragraph>
                    </>
                  )}
                </>
              ) : (
                <>
                  <Spacing size={spacing.sm} />
                  <Paragraph typography="st7" color="secondary">
                    {selected.isTrainingDay ? '휴식' : '훈련 없는 날'}
                  </Paragraph>
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

const monthNavStyle = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${spacing.lg}px 0;
`;

const navBtnStyle = css`
  width: 40px;
  height: 40px;
  border: 1px solid ${color.border};
  border-radius: 50%;
  background: ${color.bgCard};
  font-size: 1.4rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${color.text};
  &:active {
    background: ${color.primaryLight};
  }
`;

const loadingCenterStyle = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 0;
`;

const calendarStyle = css`
  background: ${color.bgCard};
  border-radius: ${radius.card}px;
  padding: ${spacing.lg}px;
  margin-bottom: ${spacing.md}px;
  border: 1.5px solid ${color.border};
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06), 0 2px 4px rgba(0, 0, 0, 0.04);
`;

const calendarHeaderStyle = css`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  margin-bottom: ${spacing.xs}px;
`;

const calHeaderCellStyle = css`
  font-size: 0.92rem;
  font-weight: 600;
  color: ${color.textSecondary};
  padding: ${spacing.sm}px 0;
`;

const calendarBodyStyle = css`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
`;

const calCellEmptyStyle = css`
  aspect-ratio: 1;
`;

const calCellStyle = (isSelected: boolean) => css`
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: ${radius.medium}px;
  cursor: pointer;
  gap: 2px;
  position: relative;
  background: ${isSelected ? color.primaryLight : 'transparent'};
  &:hover {
    background: ${color.primaryLight};
  }
`;

const calDayStyle = (isToday: boolean) => css`
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 1rem;
  font-weight: 500;
  ${isToday ? `
    background: ${color.primary};
    color: white;
  ` : ''}
`;

const calDotStyle = (dotColor: string) => css`
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background-color: ${dotColor};
`;

const legendStyle = css`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: ${spacing.sm}px ${spacing.md}px;
  margin-bottom: ${spacing.lg}px;
`;

const legendItemStyle = css`
  display: flex;
  align-items: center;
  gap: ${spacing.xs}px;
`;

const legendDotStyle = (dotColor: string) => css`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${dotColor};
`;

const dayDetailStyle = css`
  background: ${color.bgCard};
  border-radius: ${radius.card}px;
  padding: ${spacing.lg}px ${spacing.xl}px;
  border: 1.5px solid ${color.border};
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06), 0 2px 4px rgba(0, 0, 0, 0.04);
`;

const workoutTypeLabelStyle = (bgColor: string) => css`
  display: inline-block;
  padding: 2px 10px;
  border-radius: ${radius.pill}px;
  background: ${bgColor};
`;
