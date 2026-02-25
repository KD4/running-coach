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
  const [showFaq, setShowFaq] = useState(false);

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

        <Spacing size={spacing.section} />
        <button css={faqToggleStyle} onClick={() => setShowFaq((v) => !v)}>
          <span css={faqLabelStyle}>자주 묻는 질문</span>
          <span css={faqArrowStyle(showFaq)}>&#8250;</span>
        </button>

        {showFaq && (
          <>
            <Spacing size={spacing.sm} />
            <QaItem
              q="훈련 스케줄은 어떤 근거로 만들어지나요?"
              a="목표 완주 시간에서 km당 목표 페이스를 계산하고, 스포츠 과학에서 검증된 훈련 강도 비율을 적용해요. Easy, Tempo, Interval 등 훈련 구간별 적정 페이스가 자동으로 산출돼요."
            />
            <QaItem
              q="18주 동안 훈련 강도가 어떻게 바뀌나요?"
              a="기초 → 발전 → 강화 → 테이퍼링 순서로 진행돼요. 매 4주마다 훈련 볼륨을 조정하고, 피크 주차 이후 테이퍼링 기간에는 강도를 유지하면서 볼륨을 줄여 대회 당일 최상의 컨디션을 만들어요."
            />
            <QaItem
              q="18주가 안 남았는데 괜찮나요?"
              a="남은 기간에 맞춰 훈련 단계를 자동으로 조정해드려요. 다만 부상 방지와 충분한 테이퍼링을 위해 12주 이상 여유를 두는 걸 권장해요."
            />
            <QaItem
              q="테이퍼링이 뭔가요?"
              a="대회 2~3주 전 훈련량을 줄여 몸을 회복시키는 과정이에요. 훈련 강도는 유지하면서 볼륨만 줄여서, 누적된 피로를 풀고 대회 당일 최고의 퍼포먼스를 낼 수 있도록 도와줘요."
            />
          </>
        )}
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

function QaItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div css={qaItemStyle} onClick={() => setOpen(!open)}>
      <div css={qaQuestionRow}>
        <Paragraph typography="st7" css={css`flex: 1;`}>Q. {q}</Paragraph>
        <span css={qaArrowStyle(open)}>&#8250;</span>
      </div>
      {open && (
        <div css={qaAnswerStyle}>
          <Paragraph typography="st8" color="secondary" css={css`line-height: 1.6;`}>{a}</Paragraph>
        </div>
      )}
    </div>
  );
}

const qaItemStyle = css`
  background: ${color.bgCard};
  border: 1.5px solid ${color.border};
  border-radius: 12px;
  padding: ${spacing.lg}px;
  margin-bottom: ${spacing.sm}px;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
`;

const qaQuestionRow = css`
  display: flex;
  align-items: center;
  gap: ${spacing.sm}px;
`;

const qaArrowStyle = (open: boolean) => css`
  font-size: 1.2rem;
  color: ${color.textSecondary};
  transition: transform 0.2s;
  transform: rotate(${open ? '90deg' : '0deg'});
`;

const qaAnswerStyle = css`
  margin-top: ${spacing.md}px;
  padding-top: ${spacing.md}px;
  border-top: 1px solid ${color.border};
`;

const faqToggleStyle = css`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  padding: ${spacing.md}px 0;
  background: none;
  border: none;
  cursor: pointer;
  color: #3182f6;
`;

const faqLabelStyle = css`
  font-size: 15px;
  font-weight: 600;
  color: #3182f6;
`;

const faqArrowStyle = (open: boolean) => css`
  font-size: 1.1rem;
  color: #3182f6;
  transition: transform 0.2s;
  transform: rotate(${open ? '90deg' : '0deg'});
`;

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
