import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProfile, updateProfile } from '../api/user';
import type { ProfileResponse } from '../api/user';
import { useAuth } from '../contexts/AuthContext';
import type { GuestProfile } from '../contexts/AuthContext';
import { Button, Paragraph, Spacing, TextField, TextButton, Loader } from '@toss/tds-mobile';
import { css } from '@emotion/react';
import { DAYS, EVENTS, formatTime } from '../constants/workout';
import { color, spacing, radius } from '../styles/tokens';
import { pageStyle, centerStyle, formSectionStyle, dateInputStyle, timeInputsRowStyle, timeFieldStyle, timeInputWidthStyle } from '../styles/common';
import Chip from '../components/Chip';
import ChipGroup from '../components/ChipGroup';

function guestToProfileResponse(g: GuestProfile): ProfileResponse {
  return {
    goalEvent: g.goalEvent,
    goalTimeSeconds: g.goalTimeSeconds,
    targetDate: g.targetDate,
    trainingDays: g.trainingDays,
    longRunDay: g.longRunDay,
    bodyWeight: g.bodyWeight,
    targetWeight: g.targetWeight ?? null,
  };
}

export default function Profile() {
  const navigate = useNavigate();
  const { logout, isGuest, guestProfile, setGuestProfile } = useAuth();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [goalEvent, setGoalEvent] = useState('');
  const [goalH, setGoalH] = useState('0');
  const [goalM, setGoalM] = useState('0');
  const [goalS, setGoalS] = useState('0');
  const [targetDate, setTargetDate] = useState('');
  const [trainingDays, setTrainingDays] = useState<string[]>([]);
  const [longRunDay, setLongRunDay] = useState('');
  const [bodyWeight, setBodyWeight] = useState('70');
  const [targetWeight, setTargetWeight] = useState('');

  useEffect(() => {
    if (isGuest && guestProfile) {
      const p = guestToProfileResponse(guestProfile);
      setProfile(p);
      fillForm(p);
      setLoading(false);
      return;
    }
    getProfile()
      .then((p) => {
        setProfile(p);
        fillForm(p);
      })
      .catch((err) => {
        if (err?.response?.status === 404) {
          setError('프로필이 아직 설정되지 않았습니다. 온보딩을 완료해주세요.');
        } else {
          setError('프로필을 불러오지 못했습니다.');
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const fillForm = (p: ProfileResponse) => {
    setGoalEvent(p.goalEvent);
    const t = formatTime(p.goalTimeSeconds);
    setGoalH(String(t.h));
    setGoalM(String(t.m));
    setGoalS(String(t.s));
    setTargetDate(p.targetDate);
    setTrainingDays(p.trainingDays);
    setLongRunDay(p.longRunDay);
    setBodyWeight(String(p.bodyWeight));
    setTargetWeight(p.targetWeight != null ? String(p.targetWeight) : '');
  };

  const toggleDay = (day: string) => {
    setTrainingDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSave = async () => {
    setError(null);
    setSuccess(false);
    if (trainingDays.length < 3) {
      setError('최소 3일 이상의 훈련일을 선택해주세요.');
      return;
    }
    if (!trainingDays.includes(longRunDay)) {
      setError('롱런 요일은 훈련일에 포함되어야 합니다.');
      return;
    }

    const profileData = {
      goalEvent,
      goalTimeSeconds: Number(goalH) * 3600 + Number(goalM) * 60 + Number(goalS),
      targetDate,
      trainingDays,
      longRunDay,
      bodyWeight: Number(bodyWeight),
      targetWeight: targetWeight ? Number(targetWeight) : null,
    };

    if (isGuest) {
      setGuestProfile(profileData);
      setProfile(guestToProfileResponse(profileData));
      setEditing(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
      return;
    }

    setSaving(true);
    try {
      const updated = await updateProfile(profileData);
      setProfile(updated);
      setEditing(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch {
      setError('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) fillForm(profile);
    setEditing(false);
    setError(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  if (loading) {
    return (
      <div css={[pageStyle, centerStyle]}>
        <Loader />
        <Spacing size={12} />
        <Paragraph typography="st6" color="secondary">로딩 중...</Paragraph>
      </div>
    );
  }

  if (!profile) {
    return (
      <div css={pageStyle}>
        <Spacing size={spacing.xxl} />
        <Paragraph typography="st6" color="danger">{error || '프로필이 없습니다.'}</Paragraph>
      </div>
    );
  }

  const eventLabel = EVENTS.find((e) => e.value === profile.goalEvent)?.label ?? profile.goalEvent;
  const time = formatTime(profile.goalTimeSeconds);

  return (
    <div css={pageStyle}>
      <Spacing size={spacing.lg} />
      <Paragraph typography="st5">내 프로필</Paragraph>
      <Spacing size={spacing.lg} />

      {!editing ? (
        <>
          <div css={profileCardStyle}>
            <div css={profileRowStyle}>
              <Paragraph typography="st7" color="secondary">목표 대회</Paragraph>
              <Paragraph typography="st7">{eventLabel}</Paragraph>
            </div>
            <div css={profileRowStyle}>
              <Paragraph typography="st7" color="secondary">목표 기록</Paragraph>
              <Paragraph typography="st7">{time.h}시간 {time.m}분 {time.s}초</Paragraph>
            </div>
            <div css={profileRowStyle}>
              <Paragraph typography="st7" color="secondary">대회 날짜</Paragraph>
              <Paragraph typography="st7">{profile.targetDate}</Paragraph>
            </div>
            <div css={profileRowStyle}>
              <Paragraph typography="st7" color="secondary">훈련 요일</Paragraph>
              <Paragraph typography="st7">
                {profile.trainingDays.map((d) => DAYS.find((dd) => dd.value === d)?.label).join(', ')}
              </Paragraph>
            </div>
            <div css={profileRowStyle}>
              <Paragraph typography="st7" color="secondary">롱런 요일</Paragraph>
              <Paragraph typography="st7">{DAYS.find((d) => d.value === profile.longRunDay)?.label}</Paragraph>
            </div>
            <div css={profile.targetWeight != null ? profileRowStyle : profileRowLastStyle}>
              <Paragraph typography="st7" color="secondary">체중</Paragraph>
              <Paragraph typography="st7">{profile.bodyWeight} kg</Paragraph>
            </div>
            {profile.targetWeight != null && (
              <div css={profileRowLastStyle}>
                <Paragraph typography="st7" color="secondary">목표 체중</Paragraph>
                <Paragraph typography="st7">{profile.targetWeight} kg</Paragraph>
              </div>
            )}
          </div>

          {success && (
            <>
              <Spacing size={spacing.sm} />
              <Paragraph typography="st7" css={css`color: ${color.success};`}>저장 완료!</Paragraph>
            </>
          )}

          {isGuest && (
            <>
              <Spacing size={spacing.sm} />
              <Paragraph typography="st8" color="secondary">
                게스트 모드로 사용 중입니다. 로그인하면 데이터가 저장됩니다.
              </Paragraph>
            </>
          )}

          <Spacing size={spacing.xxl} />
          <Button display="block" size="large" onClick={() => setEditing(true)}>
            수정하기
          </Button>
          <Spacing size={spacing.md} />
          <div css={logoutRowStyle}>
            {isGuest ? (
              <TextButton size="medium" variant="underline" onClick={handleLogout}>
                로그인하기
              </TextButton>
            ) : (
              <TextButton size="medium" variant="underline" onClick={handleLogout}>
                로그아웃
              </TextButton>
            )}
          </div>
        </>
      ) : (
        <>
          {/* 목표 대회 */}
          <div css={formSectionStyle}>
            <Paragraph typography="st7" color="secondary">목표 대회</Paragraph>
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
            <Paragraph typography="st7" color="secondary">목표 기록</Paragraph>
            <Spacing size={spacing.sm} />
            <div css={timeInputsRowStyle}>
              <div css={timeFieldStyle}>
                <TextField variant="box" type="number" value={goalH} onChange={(e) => setGoalH(e.target.value)} css={timeInputWidthStyle} />
                <Paragraph typography="st7" color="secondary">시간</Paragraph>
              </div>
              <div css={timeFieldStyle}>
                <TextField variant="box" type="number" value={goalM} onChange={(e) => setGoalM(e.target.value)} css={timeInputWidthStyle} />
                <Paragraph typography="st7" color="secondary">분</Paragraph>
              </div>
              <div css={timeFieldStyle}>
                <TextField variant="box" type="number" value={goalS} onChange={(e) => setGoalS(e.target.value)} css={timeInputWidthStyle} />
                <Paragraph typography="st7" color="secondary">초</Paragraph>
              </div>
            </div>
          </div>

          {/* 대회 날짜 */}
          <div css={formSectionStyle}>
            <Paragraph typography="st7" color="secondary">대회 날짜</Paragraph>
            <Spacing size={spacing.sm} />
            <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} css={dateInputStyle} />
          </div>

          {/* 훈련 요일 */}
          <div css={formSectionStyle}>
            <Paragraph typography="st7" color="secondary">훈련 요일 (3일 이상)</Paragraph>
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
            <Paragraph typography="st7" color="secondary">롱런 요일</Paragraph>
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

          {/* 목표 체중 */}
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
              <Paragraph typography="st7" color="danger">{error}</Paragraph>
              <Spacing size={spacing.md} />
            </>
          )}

          <Button display="block" size="large" onClick={handleSave} loading={saving}>
            저장
          </Button>
          <Spacing size={spacing.md} />
          <Button display="block" size="large" variant="weak" onClick={handleCancel}>
            취소
          </Button>
          <Spacing size={spacing.xxl} />
        </>
      )}
    </div>
  );
}

const profileCardStyle = css`
  background: ${color.bgCard};
  border-radius: ${radius.card}px;
  padding: ${spacing.xs}px ${spacing.xl}px;
`;

const profileRowStyle = css`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${spacing.md}px 0;
  border-bottom: 1px solid ${color.border};
`;

const profileRowLastStyle = css`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${spacing.md}px 0;
`;

const logoutRowStyle = css`
  display: flex;
  justify-content: center;
  padding: ${spacing.sm}px 0;
`;
