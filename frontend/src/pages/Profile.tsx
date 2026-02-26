import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProfile, updateProfile, getNotificationSetting, updateNotificationSetting } from '../api/user';
import type { ProfileResponse } from '../api/user';
import { useAuth } from '../contexts/AuthContext';
import type { GuestProfile } from '../contexts/AuthContext';
import { useDataCache } from '../contexts/DataCacheContext';
import { List, ListRow, Paragraph, Spacing, Loader, Top, Border } from '@toss/tds-mobile';
import { adaptive } from '@toss/tds-colors';
import { css } from '@emotion/react';
import { DAYS, EVENTS, formatTime } from '../constants/workout';
import { color, layout } from '../styles/tokens';
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
  const { invalidateAll } = useDataCache();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [notifHour, setNotifHour] = useState(7);

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

    // 알림 설정 조회 (로그인 유저만)
    getNotificationSetting()
      .then((s) => {
        setNotifEnabled(s.enabled);
        setNotifHour(s.hour);
      })
      .catch(() => {});
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
      invalidateAll();
      setEditing(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
      return;
    }

    const updated = await updateProfile(profileData);
    setProfile(updated);
    invalidateAll();
    setEditing(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2000);
  };

  const handleCancel = () => {
    setEditing(false);
  };

  const handleNotifToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const newEnabled = !notifEnabled;
    setNotifEnabled(newEnabled);
    try {
      await updateNotificationSetting(newEnabled, notifHour);
    } catch {
      setNotifEnabled(!newEnabled);
    }
  };

  const handleNotifHourChange = async (newHour: number) => {
    const prevHour = notifHour;
    setNotifHour(newHour);
    try {
      await updateNotificationSetting(notifEnabled, newHour);
    } catch {
      setNotifHour(prevHour);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  if (loading) {
    return (
      <div css={loadingStyle}>
        <Loader />
        <Spacing size={12} />
        <Paragraph typography="st6" color="secondary">로딩 중...</Paragraph>
      </div>
    );
  }

  if (!profile) {
    return (
      <div css={css`padding: 40px 20px;`}>
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
      <div css={pageContainerStyle}>
        <Spacing size={12} />
        <div css={headerStyle}>
          <Top
            title={
              <Top.TitleParagraph size={22} color={adaptive.grey900}>
                내 프로필
              </Top.TitleParagraph>
            }
          />
          <button css={editBtnStyle} onClick={() => setEditing(true)}>수정</button>
        </div>

        {success && (
          <div css={css`padding: 0 20px 8px;`}>
            <Paragraph typography="st7" css={css`color: ${color.success};`}>저장 완료!</Paragraph>
          </div>
        )}

        {/* 프로필 정보 */}
        <List>
          <ListRow
            contents={<ListRow.Texts type="1RowTypeA" top="목표 대회" topProps={{ color: adaptive.grey800 }} />}
            right={<ListRow.Texts type="Right1RowTypeA" top={eventLabel} topProps={{ color: adaptive.grey700 }} />}
            verticalPadding="large"
          />
          <ListRow
            contents={<ListRow.Texts type="1RowTypeA" top="목표 기록" topProps={{ color: adaptive.grey800 }} />}
            right={<ListRow.Texts type="Right1RowTypeA" top={`${time.h}시간 ${time.m}분 ${time.s}초`} topProps={{ color: adaptive.grey700 }} />}
            verticalPadding="large"
          />
          <ListRow
            contents={<ListRow.Texts type="1RowTypeA" top="대회 날짜" topProps={{ color: adaptive.grey800 }} />}
            right={<ListRow.Texts type="Right1RowTypeA" top={profile.targetDate} topProps={{ color: adaptive.grey700 }} />}
            verticalPadding="large"
          />
          <ListRow
            contents={<ListRow.Texts type="1RowTypeA" top="훈련 요일" topProps={{ color: adaptive.grey800 }} />}
            right={<ListRow.Texts type="Right1RowTypeA" top={trainingDaysLabel} topProps={{ color: adaptive.grey700 }} />}
            verticalPadding="large"
          />
          <ListRow
            contents={<ListRow.Texts type="1RowTypeA" top="롱런 요일" topProps={{ color: adaptive.grey800 }} />}
            right={<ListRow.Texts type="Right1RowTypeA" top={longRunDayLabel} topProps={{ color: adaptive.grey700 }} />}
            verticalPadding="large"
          />
          <ListRow
            contents={<ListRow.Texts type="1RowTypeA" top="체중" topProps={{ color: adaptive.grey800 }} />}
            right={<ListRow.Texts type="Right1RowTypeA" top={`${profile.bodyWeight} kg`} topProps={{ color: adaptive.grey700 }} />}
            verticalPadding="large"
          />
          {profile.targetWeight != null && (
            <ListRow
              contents={<ListRow.Texts type="1RowTypeA" top="목표 체중" topProps={{ color: adaptive.grey800 }} />}
              right={<ListRow.Texts type="Right1RowTypeA" top={`${profile.targetWeight} kg`} topProps={{ color: adaptive.grey700 }} />}
              verticalPadding="large"
            />
          )}
        </List>

        {/* 알림 설정 (토스 로그인 유저만) */}
        {!isGuest && (
          <>
            <Border variant="height16" />
            <div css={notifSectionStyle}>
              <span css={notifTitleStyle}>알림 설정</span>
              <List>
                <ListRow
                  contents={<ListRow.Texts type="1RowTypeA" top="데일리 알림" topProps={{ color: adaptive.grey800 }} />}
                  right={
                    <button css={toggleBtnStyle(notifEnabled)} onClick={handleNotifToggle}>
                      <span css={toggleKnobStyle(notifEnabled)} />
                    </button>
                  }
                  verticalPadding="large"
                />
                {notifEnabled && (
                  <ListRow
                    contents={<ListRow.Texts type="1RowTypeA" top="알림 시간" topProps={{ color: adaptive.grey800 }} />}
                    right={
                      <div css={timeSelectWrapStyle}>
                        <select
                          css={timeSelectStyle}
                          value={notifHour}
                          onChange={(e) => handleNotifHourChange(Number(e.target.value))}
                        >
                          {Array.from({ length: 17 }, (_, i) => i + 6).map((h) => (
                            <option key={h} value={h}>
                              {h < 12 ? `오전 ${h}시` : h === 12 ? '오후 12시' : `오후 ${h - 12}시`}
                            </option>
                          ))}
                        </select>
                      </div>
                    }
                    verticalPadding="large"
                  />
                )}
              </List>
            </div>
          </>
        )}

        <Border variant="height16" />

        {/* 자주 묻는 질문 */}
        <div css={faqSectionStyle}>
        <span css={faqTitleStyle}>자주 묻는 질문</span>
        <List>
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
        </List>
        </div>

        {/* 로그아웃 */}
        <Spacing size={24} />
        <List>
          <ListRow
            contents={<ListRow.Texts type="1RowTypeA" top={isGuest ? '로그인하기' : '로그아웃'} topProps={{ color: adaptive.grey600 }} />}
            onClick={handleLogout}
            verticalPadding="large"
          />
        </List>
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
    <>
      <ListRow
        contents={<ListRow.Texts type="1RowTypeA" top={q} topProps={{ color: adaptive.grey700 }} />}
        arrowType="right"
        onClick={() => setOpen(!open)}
        verticalPadding="large"
      />
      {open && (
        <div css={answerStyle}>
          <span css={answerTextStyle}>{a}</span>
        </div>
      )}
    </>
  );
}

const headerStyle = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-right: 20px;
`;

const editBtnStyle = css`
  background: none;
  border: none;
  color: #3182f6;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  flex-shrink: 0;
`;

const faqSectionStyle = css`
  background: ${adaptive.grey100};
  padding-top: 16px;
  padding-bottom: 8px;
`;

const faqTitleStyle = css`
  display: block;
  padding: 0 20px 8px;
  font-size: 15px;
  font-weight: 700;
  color: ${adaptive.grey600};
`;

const answerTextStyle = css`
  font-size: 15px;
  line-height: 1.6;
  color: ${adaptive.grey500};
`;

const pageContainerStyle = css`
  padding-bottom: ${layout.navHeight + 20}px;
`;

const loadingStyle = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
`;

const answerStyle = css`
  padding: 0 20px 16px;
  background: ${adaptive.grey100};
`;

const notifSectionStyle = css`
  padding-top: 16px;
`;

const notifTitleStyle = css`
  display: block;
  padding: 0 20px 8px;
  font-size: 15px;
  font-weight: 700;
  color: ${adaptive.grey600};
`;

const toggleBtnStyle = (on: boolean) => css`
  position: relative;
  width: 48px;
  height: 28px;
  border-radius: 14px;
  border: none;
  cursor: pointer;
  background: ${on ? '#3182f6' : adaptive.grey300};
  transition: background 0.2s;
  padding: 0;
  flex-shrink: 0;
`;

const toggleKnobStyle = (on: boolean) => css`
  position: absolute;
  top: 3px;
  left: ${on ? '23px' : '3px'};
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: white;
  transition: left 0.2s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
  pointer-events: none;
`;

const timeSelectWrapStyle = css`
  display: flex;
  align-items: center;
`;

const timeSelectStyle = css`
  appearance: none;
  background: none;
  border: none;
  font-size: 15px;
  color: ${adaptive.grey700};
  cursor: pointer;
  padding: 4px 20px 4px 0;
  background-image: url("data:image/svg+xml,%3Csvg width='8' height='5' viewBox='0 0 8 5' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l3 3 3-3' stroke='%23999' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 4px center;
  text-align: right;
`;

const wizardOverlayStyle = css`
  position: fixed;
  inset: 0;
  z-index: 200;
  background: ${adaptive.grey50};
`;
