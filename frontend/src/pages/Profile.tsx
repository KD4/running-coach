import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProfile, updateProfile } from '../api/user';
import type { ProfileResponse } from '../api/user';
import { useAuth } from '../contexts/AuthContext';
import type { GuestProfile } from '../contexts/AuthContext';
import { Button, List, ListRow, Paragraph, Spacing, TextButton, Loader, Top } from '@toss/tds-mobile';
import { adaptive } from '@toss/tds-colors';
import { css } from '@emotion/react';
import { DAYS, EVENTS, formatTime } from '../constants/workout';
import { color, spacing } from '../styles/tokens';
import { pageStyle, centerStyle } from '../styles/common';
import ProfileWizard from '../components/wizard/ProfileWizard';
import type { WizardFormData } from '../components/wizard/types';

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

function profileToWizardData(p: ProfileResponse): WizardFormData {
  const t = formatTime(p.goalTimeSeconds);
  return {
    goalEvent: p.goalEvent,
    goalHours: String(t.h),
    goalMinutes: String(t.m),
    goalSeconds: String(t.s),
    targetDate: p.targetDate,
    trainingDays: p.trainingDays,
    longRunDay: p.longRunDay,
    bodyWeight: String(p.bodyWeight),
    targetWeight: p.targetWeight != null ? String(p.targetWeight) : '',
  };
}

export default function Profile() {
  const navigate = useNavigate();
  const { logout, isGuest, guestProfile, setGuestProfile } = useAuth();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isGuest && guestProfile) {
      const p = guestToProfileResponse(guestProfile);
      setProfile(p);
      setLoading(false);
      return;
    }
    getProfile()
      .then((p) => {
        setProfile(p);
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

  const handleWizardComplete = async (data: WizardFormData) => {
    const profileData = {
      goalEvent: data.goalEvent,
      goalTimeSeconds:
        Number(data.goalHours) * 3600 + Number(data.goalMinutes) * 60 + Number(data.goalSeconds),
      targetDate: data.targetDate,
      trainingDays: data.trainingDays,
      longRunDay: data.longRunDay,
      bodyWeight: Number(data.bodyWeight),
      targetWeight: data.targetWeight ? Number(data.targetWeight) : null,
    };

    if (isGuest) {
      setGuestProfile(profileData);
      setProfile(guestToProfileResponse(profileData));
      setEditing(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
      return;
    }

    const updated = await updateProfile(profileData);
    setProfile(updated);
    setEditing(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2000);
  };

  const handleCancel = () => {
    setEditing(false);
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
  const trainingDaysLabel = profile.trainingDays
    .map((d) => DAYS.find((dd) => dd.value === d)?.label)
    .join(', ');
  const longRunDayLabel = DAYS.find((d) => d.value === profile.longRunDay)?.label ?? '';

  return (
    <>
      <div css={pageStyle}>
        <Top
          upperGap={8}
          lowerGap={spacing.md}
          title={<Top.TitleParagraph>내 프로필</Top.TitleParagraph>}
        />

        <List>
          <ListRow
            contents={
              <ListRow.Texts
                type="1RowTypeA"
                top="목표 대회"
                topProps={{ color: adaptive.grey800 }}
              />
            }
            right={
              <ListRow.Texts
                type="Right1RowTypeA"
                top={eventLabel}
                topProps={{ color: adaptive.grey700 }}
              />
            }
            verticalPadding="large"
          />
          <ListRow
            contents={
              <ListRow.Texts
                type="1RowTypeA"
                top="목표 기록"
                topProps={{ color: adaptive.grey800 }}
              />
            }
            right={
              <ListRow.Texts
                type="Right1RowTypeA"
                top={`${time.h}시간 ${time.m}분 ${time.s}초`}
                topProps={{ color: adaptive.grey700 }}
              />
            }
            verticalPadding="large"
          />
          <ListRow
            contents={
              <ListRow.Texts
                type="1RowTypeA"
                top="대회 날짜"
                topProps={{ color: adaptive.grey800 }}
              />
            }
            right={
              <ListRow.Texts
                type="Right1RowTypeA"
                top={profile.targetDate}
                topProps={{ color: adaptive.grey700 }}
              />
            }
            verticalPadding="large"
          />
          <ListRow
            contents={
              <ListRow.Texts
                type="1RowTypeA"
                top="훈련 요일"
                topProps={{ color: adaptive.grey800 }}
              />
            }
            right={
              <ListRow.Texts
                type="Right1RowTypeA"
                top={trainingDaysLabel}
                topProps={{ color: adaptive.grey700 }}
              />
            }
            verticalPadding="large"
          />
          <ListRow
            contents={
              <ListRow.Texts
                type="1RowTypeA"
                top="롱런 요일"
                topProps={{ color: adaptive.grey800 }}
              />
            }
            right={
              <ListRow.Texts
                type="Right1RowTypeA"
                top={longRunDayLabel}
                topProps={{ color: adaptive.grey700 }}
              />
            }
            verticalPadding="large"
          />
          <ListRow
            contents={
              <ListRow.Texts
                type="1RowTypeA"
                top="체중"
                topProps={{ color: adaptive.grey800 }}
              />
            }
            right={
              <ListRow.Texts
                type="Right1RowTypeA"
                top={`${profile.bodyWeight} kg`}
                topProps={{ color: adaptive.grey700 }}
              />
            }
            verticalPadding="large"
          />
          {profile.targetWeight != null && (
            <ListRow
              contents={
                <ListRow.Texts
                  type="1RowTypeA"
                  top="목표 체중"
                  topProps={{ color: adaptive.grey800 }}
                />
              }
              right={
                <ListRow.Texts
                  type="Right1RowTypeA"
                  top={`${profile.targetWeight} kg`}
                  topProps={{ color: adaptive.grey700 }}
                />
              }
              verticalPadding="large"
            />
          )}
        </List>

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
      </div>

      {/* 편집 모드 - 위자드 오버레이 */}
      {editing && (
        <div css={wizardOverlayStyle}>
          <ProfileWizard
            mode="edit"
            initialData={profileToWizardData(profile)}
            onComplete={handleWizardComplete}
            onCancel={handleCancel}
          />
        </div>
      )}
    </>
  );
}

const logoutRowStyle = css`
  display: flex;
  justify-content: center;
  padding: ${spacing.sm}px 0;
`;

const wizardOverlayStyle = css`
  position: fixed;
  inset: 0;
  z-index: 200;
  background: ${color.bgPage};
`;
