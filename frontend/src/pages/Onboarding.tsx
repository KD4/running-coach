import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { submitOnboarding } from '../api/user';
import { useAuth } from '../contexts/AuthContext';
import { Button, Paragraph, Spacing, TextField, Top } from '@toss/tds-mobile';
import { css } from '@emotion/react';
import { DAYS, EVENTS } from '../constants/workout';
import { spacing } from '../styles/tokens';
import { pageStyle, formSectionStyle, dateInputStyle, timeInputsRowStyle, timeFieldStyle, timeInputWidthStyle } from '../styles/common';
import Chip from '../components/Chip';
import ChipGroup from '../components/ChipGroup';

export default function Onboarding() {
  const navigate = useNavigate();
  const { isGuest, setOnboarded, setGuestProfile } = useAuth();
  const [goalEvent, setGoalEvent] = useState('10K');
  const [goalHours, setGoalHours] = useState('0');
  const [goalMinutes, setGoalMinutes] = useState('50');
  const [goalSeconds, setGoalSeconds] = useState('0');
  const [targetDate, setTargetDate] = useState('');
  const [trainingDays, setTrainingDays] = useState<string[]>(['TUE', 'THU', 'SAT']);
  const [longRunDay, setLongRunDay] = useState('SAT');
  const [bodyWeight, setBodyWeight] = useState('70');
  const [targetWeight, setTargetWeight] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleDay = (day: string) => {
    setTrainingDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (trainingDays.length < 3) {
      setError('최소 3일 이상의 훈련일을 선택해주세요.');
      return;
    }
    if (!trainingDays.includes(longRunDay)) {
      setError('롱런 요일은 훈련일에 포함되어야 합니다.');
      return;
    }
    if (!targetDate) {
      setError('대회 날짜를 선택해주세요.');
      return;
    }

    const profileData = {
      goalEvent,
      goalTimeSeconds: Number(goalHours) * 3600 + Number(goalMinutes) * 60 + Number(goalSeconds),
      targetDate,
      trainingDays,
      longRunDay,
      bodyWeight: Number(bodyWeight),
      targetWeight: targetWeight ? Number(targetWeight) : null,
    };

    if (isGuest) {
      setGuestProfile(profileData);
      setOnboarded();
      navigate('/today', { replace: true });
      return;
    }

    setLoading(true);
    try {
      await submitOnboarding(profileData);
      setOnboarded();
      navigate('/today', { replace: true });
    } catch {
      setError('저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div css={onboardingPageStyle}>
      <Top
        upperGap={8}
        lowerGap={spacing.xxl}
        title={<Top.TitleParagraph>훈련 프로필 설정</Top.TitleParagraph>}
        subtitleBottom={
          <Top.SubtitleParagraph>
            맞춤 훈련 플랜을 위한 정보를 입력해주세요
          </Top.SubtitleParagraph>
        }
      />

      <form onSubmit={handleSubmit} css={onboardingFormStyle}>
        {/* 목표 대회 */}
        <div css={formSectionStyle}>
          <Paragraph typography="st6" color="secondary">목표 대회</Paragraph>
          <Spacing size={spacing.sm} />
          <ChipGroup>
            {EVENTS.map((ev) => (
              <Chip
                key={ev.value}
                selected={goalEvent === ev.value}
                onClick={() => setGoalEvent(ev.value)}
              >
                {ev.label}
              </Chip>
            ))}
          </ChipGroup>
        </div>

        {/* 목표 기록 */}
        <div css={formSectionStyle}>
          <Paragraph typography="st6" color="secondary">목표 기록</Paragraph>
          <Spacing size={spacing.sm} />
          <div css={timeInputsRowStyle}>
            <div css={timeFieldStyle}>
              <TextField
                variant="box"
                type="number"
                value={goalHours}
                onChange={(e) => setGoalHours(e.target.value)}
                css={timeInputWidthStyle}
              />
              <Paragraph typography="st6" color="secondary">시간</Paragraph>
            </div>
            <div css={timeFieldStyle}>
              <TextField
                variant="box"
                type="number"
                value={goalMinutes}
                onChange={(e) => setGoalMinutes(e.target.value)}
                css={timeInputWidthStyle}
              />
              <Paragraph typography="st6" color="secondary">분</Paragraph>
            </div>
            <div css={timeFieldStyle}>
              <TextField
                variant="box"
                type="number"
                value={goalSeconds}
                onChange={(e) => setGoalSeconds(e.target.value)}
                css={timeInputWidthStyle}
              />
              <Paragraph typography="st6" color="secondary">초</Paragraph>
            </div>
          </div>
        </div>

        {/* 대회 날짜 */}
        <div css={formSectionStyle}>
          <Paragraph typography="st6" color="secondary">대회 날짜</Paragraph>
          <Spacing size={spacing.sm} />
          <input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            css={dateInputStyle}
          />
        </div>

        {/* 훈련 요일 */}
        <div css={formSectionStyle}>
          <Paragraph typography="st6" color="secondary">훈련 요일 (3일 이상)</Paragraph>
          <Spacing size={spacing.sm} />
          <ChipGroup>
            {DAYS.map((day) => (
              <Chip
                key={day.value}
                selected={trainingDays.includes(day.value)}
                onClick={() => toggleDay(day.value)}
              >
                {day.label}
              </Chip>
            ))}
          </ChipGroup>
        </div>

        {/* 롱런 요일 */}
        <div css={formSectionStyle}>
          <Paragraph typography="st6" color="secondary">롱런 요일</Paragraph>
          <Spacing size={spacing.sm} />
          <ChipGroup>
            {DAYS.filter((d) => trainingDays.includes(d.value)).map((day) => (
              <Chip
                key={day.value}
                selected={longRunDay === day.value}
                onClick={() => setLongRunDay(day.value)}
              >
                {day.label}
              </Chip>
            ))}
          </ChipGroup>
        </div>

        {/* 체중 */}
        <div css={formSectionStyle}>
          <TextField
            variant="box"
            label="체중 (kg)"
            labelOption="sustain"
            type="number"
            value={bodyWeight}
            onChange={(e) => setBodyWeight(e.target.value)}
          />
        </div>

        {/* 레이스 목표 체중 */}
        <div css={formSectionStyle}>
          <TextField
            variant="box"
            label="레이스 목표 체중 (선택)"
            labelOption="sustain"
            type="number"
            value={targetWeight}
            onChange={(e) => setTargetWeight(e.target.value)}
            placeholder="예: 62.0"
          />
        </div>

        {error && (
          <>
            <Paragraph typography="st6" color="danger">{error}</Paragraph>
            <Spacing size={spacing.md} />
          </>
        )}

        <Spacing size={spacing.sm} />
        <Button
          type="submit"
          display="block"
          size="xlarge"
          loading={loading}
        >
          훈련 시작하기
        </Button>
        <Spacing size={spacing.xxl} />
      </form>
    </div>
  );
}

const onboardingPageStyle = css`
  ${pageStyle};
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
`;

const onboardingFormStyle = css`
  flex: 1;
`;
