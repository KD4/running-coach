import { useEffect, useState } from 'react';
import type { TodayResponse } from '../types';
import { Paragraph, Spacing, Badge, Loader } from '@toss/tds-mobile';
import { css } from '@emotion/react';
import { WORKOUT_LABELS, WORKOUT_COLORS } from '../constants/workout';
import { color, spacing, radius } from '../styles/tokens';
import { pageStyle, centerStyle } from '../styles/common';
import { useTossBanner } from '../hooks/useTossBanner';
import { useDataCache } from '../contexts/DataCacheContext';

export default function Today() {
  const [data, setData] = useState<TodayResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDiet, setShowDiet] = useState(false);
  const [showDietTip, setShowDietTip] = useState(false);
  const bannerRef = useTossBanner('ait-ad-test-banner-id');
  const { fetchToday } = useDataCache();

  useEffect(() => {
    fetchToday()
      .then(setData)
      .catch((err) => {
        if (err?.response?.status === 404) {
          setError('프로필 설정이 필요합니다. 프로필 페이지에서 설정해주세요.');
        } else {
          setError('오늘의 훈련을 불러오지 못했습니다.');
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div css={[pageStyle, centerStyle]}>
        <Loader />
        <Spacing size={12} />
        <Paragraph typography="st6" color="secondary">로딩 중...</Paragraph>
      </div>
    );
  }

  if (error) {
    return (
      <div css={pageStyle}>
        <Spacing size={spacing.xxl} />
        <Paragraph typography="st6" color="danger">{error}</Paragraph>
      </div>
    );
  }

  if (!data) return null;

  const workout = data.workout;
  const type = workout?.workoutType ?? 'REST';
  const workoutColor = WORKOUT_COLORS[type] ?? '#9E9E9E';

  return (
    <div css={pageStyle}>
      {/* 헤더: Week 뱃지 + 날짜 */}
      <Spacing size={spacing.sm} />
      <Badge size="small" variant="weak" color="blue" css={weekBadgeStyle}>Week {data.weekNumber}/{data.totalWeeks}</Badge>
      <Spacing size={spacing.xs} />
      <Paragraph typography="st5" css={dateTitleStyle}>
        {new Date(data.date).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}
      </Paragraph>
      <Spacing size={spacing.lg} />

      {/* 워크아웃 카드 */}
      <div css={workoutCardStyle(workoutColor)}>
        {data.isRestDay ? (
          <div css={restDayStyle}>
            <Paragraph typography="st7" color="secondary">휴식</Paragraph>
            <Spacing size={spacing.sm} />
            <Paragraph typography="st8" color="secondary">
              오늘은 쉬는 날입니다. 충분한 회복을 취하세요!
            </Paragraph>
          </div>
        ) : workout ? (
          <>
            <div css={workoutTypeLabelStyle(workoutColor)}>
              <Paragraph typography="st8" css={css`color: #FFFFFF;`}>
                {WORKOUT_LABELS[type] ?? type}
              </Paragraph>
            </div>
            <Spacing size={spacing.md} />
            <Paragraph typography="t5" css={workoutDetailsStyle}>
              {`${workout.distanceKm}km`}
              {workout.paceTarget && ` | ${workout.paceTarget}/km`}
            </Paragraph>
            {workout.description && (
              <>
                <Spacing size={spacing.sm} />
                <Paragraph typography="st8" color="secondary">{workout.description}</Paragraph>
              </>
            )}
          </>
        ) : (
          <div css={restDayStyle}>
            <Paragraph typography="st7" color="secondary">휴식</Paragraph>
            <Spacing size={spacing.sm} />
            <Paragraph typography="st8" color="secondary">오늘은 훈련이 없습니다.</Paragraph>
          </div>
        )}
      </div>
      <Spacing size={spacing.md} />

      {/* 칼로리 카드 */}
      <div css={caloriesCardStyle}>
        <Paragraph typography="st8" color="secondary">오늘의 칼로리</Paragraph>
        <Spacing size={spacing.xs} />
        <Paragraph typography="t5" css={css`color: ${color.primary}; font-weight: 1000;`}>
          {data.calories.totalRecommended.toLocaleString()} kcal
        </Paragraph>
        <Spacing size={spacing.md} />

        <div css={calRowStyle}>
          <Paragraph typography="st8" color="secondary">기초대사량 (BMR)</Paragraph>
          <Paragraph typography="st8">{`${data.calories.bmr} kcal`}</Paragraph>
        </div>
        <div css={calRowStyle}>
          <Paragraph typography="st8" color="secondary">운동 강도 보너스</Paragraph>
          <Paragraph typography="st8">{`+${data.calories.intensityBonus} kcal`}</Paragraph>
        </div>
        {data.calories.tomorrowPrep > 0 && (
          <div css={calRowStyle}>
            <Paragraph typography="st8" color="secondary">내일 훈련 대비</Paragraph>
            <Paragraph typography="st8">+{data.calories.tomorrowPrep} kcal</Paragraph>
          </div>
        )}
        {data.calories.dailyDeficit > 0 && (
          <div css={calRowStyle}>
            <Paragraph typography="st8" color="secondary">감량 적자</Paragraph>
            <Paragraph typography="st8" css={css`color: ${color.danger};`}>{`-${data.calories.dailyDeficit} kcal`}</Paragraph>
          </div>
        )}

        {/* 탄수화물 로딩 배너 */}
        {data.calories.carbLoadingRecommended && (
          <>
            <Spacing size={spacing.md} />
            <div css={carbLoadingStyle}>
              <Paragraph typography="st8" css={css`color: ${color.warningText};`}>
                내일 {data.calories.tomorrowWorkoutType === 'INTERVAL' ? '인터벌' : '롱런'} 훈련이 예정되어 있습니다. 탄수화물을 충분히 섭취하세요!
              </Paragraph>
            </div>
          </>
        )}

        {/* 감량 목표 섹션 */}
        {data.calories.targetWeight != null && data.calories.weightToLose > 0 && (
          <>
            <Spacing size={spacing.md} />
            <div css={dietDividerStyle} />
            <div css={dietHeaderStyle}>
              <button onClick={() => setShowDiet((v) => !v)} css={dietToggleStyle}>
                <Paragraph typography="st8" color="secondary">
                  {showDiet ? '감량 목표 접기' : '감량 목표 보기'}
                </Paragraph>
                <span css={css`display: inline-block; transition: transform 0.2s; ${showDiet ? 'transform: rotate(180deg);' : ''}`}>
                  &#9662;
                </span>
              </button>
              <span css={dietTipTriggerStyle} onClick={() => setShowDietTip((v) => !v)}>?</span>
              {showDietTip && (
                <div css={dietTipBubbleStyle}>
                  <span css={dietTipTextStyle}>
                    {`훈련 중 급격한 감량은 부상 위험을 높여요.\n하루 500kcal 적자로 안전하게 감량하는 걸 권장해요.`}
                  </span>
                </div>
              )}
            </div>
            {showDiet && (
              <div css={css`padding-top: ${spacing.sm}px;`}>
                <div css={calRowStyle}>
                  <Paragraph typography="st8" color="secondary">목표 체중</Paragraph>
                  <Paragraph typography="st8">{`${data.calories.targetWeight} kg`}</Paragraph>
                </div>
                <div css={calRowStyle}>
                  <Paragraph typography="st8" color="secondary">감량 필요</Paragraph>
                  <Paragraph typography="st8">{`${data.calories.weightToLose.toFixed(1)} kg`}</Paragraph>
                </div>
                <div css={calRowStyle}>
                  <Paragraph typography="st8" color="secondary">일일 적자</Paragraph>
                  <Paragraph typography="st8" css={css`color: ${color.danger};`}>{`-${data.calories.dailyDeficit} kcal`}</Paragraph>
                </div>
                <div css={calRowStyle}>
                  <Paragraph typography="st8" color="secondary">남은 기간</Paragraph>
                  <Paragraph typography="st8">{`D-${data.calories.dietDaysRemaining}`}</Paragraph>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <Spacing size={spacing.md} />
      <div ref={bannerRef} css={bannerContainerStyle} />
    </div>
  );
}

const bannerContainerStyle = css`
  width: 100%;
  min-height: 96px;
  margin-bottom: ${spacing.lg}px;
`;

const weekBadgeStyle = css``;

const dateTitleStyle = css``;

const workoutCardStyle = (borderColor: string) => css`
  background: ${color.bgPage};
  border-radius: ${radius.card}px;
  padding: ${spacing.lg}px ${spacing.xl}px;
  border-left: 4px solid ${borderColor};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04);
`;

const workoutTypeLabelStyle = (bgColor: string) => css`
  display: inline-block;
  padding: 2px 10px;
  border-radius: ${radius.pill}px;
  background: ${bgColor};
`;

const restDayStyle = css`
  text-align: center;
  padding: ${spacing.sm}px 0;
`;

const workoutDetailsStyle = css`
  line-height: 1.4;
`;

const caloriesCardStyle = css`
  background: ${color.bgCard};
  border-radius: ${radius.card}px;
  padding: ${spacing.lg}px ${spacing.xl}px;
  border: 1px solid ${color.border};
`;

const calRowStyle = css`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: ${spacing.xs}px 0;
`;

const carbLoadingStyle = css`
  background: ${color.warningBg};
  border: 1px solid ${color.warningBorder};
  border-radius: ${radius.medium}px;
  padding: ${spacing.sm}px ${spacing.md}px;
`;

const dietDividerStyle = css`
  border-top: 1px dashed ${color.border};
`;

const dietHeaderStyle = css`
  position: relative;
  display: flex;
  align-items: center;
  gap: ${spacing.sm}px;
  padding-top: ${spacing.md}px;
`;

const dietToggleStyle = css`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: ${spacing.sm}px 0;
  background: none;
  border: 1px solid ${color.border};
  border-radius: ${radius.large}px;
  cursor: pointer;
`;

const dietTipTriggerStyle = css`
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: ${color.textSecondary};
  color: white;
  font-size: 0.75rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
`;

const dietTipBubbleStyle = css`
  position: absolute;
  right: 0;
  top: calc(100% + 6px);
  width: 260px;
  background: #333333;
  border-radius: ${radius.medium}px;
  padding: ${spacing.md}px 14px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 10;
`;

const dietTipTextStyle = css`
  color: #FFFFFF;
  font-size: 0.72rem;
  line-height: 1.5;
`;
