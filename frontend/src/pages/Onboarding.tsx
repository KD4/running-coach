import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { appLogin } from '@apps-in-toss/web-bridge';
import { oauthLogin } from '../api/auth';
import { submitOnboarding } from '../api/user';
import { useAuth } from '../contexts/AuthContext';
import { Asset, Top, StepperRow, Spacing, Paragraph, FixedBottomCTA } from '@toss/tds-mobile';
import { adaptive } from '@toss/tds-colors';
import { css } from '@emotion/react';
import ProfileWizard from '../components/wizard/ProfileWizard';
import type { WizardFormData } from '../components/wizard/types';

export default function Onboarding() {
  const navigate = useNavigate();
  const { token, isGuest, login, setOnboarded, setGuestProfile } = useAuth();
  const isAuthenticated = !!token || isGuest;
  const [showIntro, setShowIntro] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  /* ─── 인트로: 로그인 ─── */

  const handleTossLogin = async () => {
    setLoginLoading(true);
    setLoginError(null);
    try {
      const { authorizationCode, referrer } = await appLogin();
      const res = await oauthLogin('toss', authorizationCode, referrer);
      login(res.token, res.isNewUser);
      if (res.isNewUser) {
        setShowIntro(false);
      } else {
        navigate('/today', { replace: true });
      }
    } catch {
      setLoginError('로그인에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoginLoading(false);
    }
  };

  /* ─── 위자드: 프로필 설정 ─── */

  const handleComplete = async (data: WizardFormData) => {
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
      setOnboarded();
      navigate('/today', { replace: true });
      return;
    }

    await submitOnboarding(profileData);
    setOnboarded();
    navigate('/today', { replace: true });
  };

  const handleCancel = () => {
    setShowIntro(true);
  };

  /* ─── 인트로 화면 ─── */
  if (showIntro) {
    return (
      <>
        <Spacing size={12} />
        <Top
          title={
            <Top.TitleParagraph size={22} color={adaptive.grey900}>
              레이스 목표를 설정하고<br />
              체계화된 훈련을<br />
              매일 받아보세요
            </Top.TitleParagraph>
          }
        />
        <Spacing size={40} />
        <StepperRow
          left={
            <StepperRow.AssetFrame
              shape={Asset.frameShape.CleanW32}
              content={<Asset.ContentIcon name="icon-credit-grade-up" aria-hidden />}
            />
          }
          center={
            <StepperRow.Texts
              type="A"
              title="목표를 설정하세요"
              description="대회 종류, 목표 기록, 대회 날짜를 입력해요"
            />
          }
        />
        <StepperRow
          left={
            <StepperRow.AssetFrame
              shape={Asset.frameShape.CleanW32}
              content={<Asset.ContentIcon name="icon-credit-grade-up" aria-hidden />}
            />
          }
          center={
            <StepperRow.Texts
              type="A"
              title="맞춤 훈련 계획"
              description="과학적 근거 기반의 체계적인 훈련 플랜을 받아요"
            />
          }
        />
        <StepperRow
          left={
            <StepperRow.AssetFrame
              shape={Asset.frameShape.CleanW32}
              content={<Asset.ContentIcon name="icon-credit-grade-up" aria-hidden />}
            />
          }
          center={
            <StepperRow.Texts
              type="A"
              title="매일 코칭 받기"
              description="오늘의 훈련과 적정 페이스를 확인하세요"
            />
          }
          hideLine={true}
        />
        {loginError && (
          <div css={css`padding: 0 20px;`}>
            <Spacing size={12} />
            <Paragraph typography="st6" color="danger">{loginError}</Paragraph>
          </div>
        )}
        {isAuthenticated ? (
          <FixedBottomCTA onClick={() => setShowIntro(false)}>
            시작하기
          </FixedBottomCTA>
        ) : (
          <FixedBottomCTA loading={loginLoading} onClick={handleTossLogin}>
            토스로 시작하기
          </FixedBottomCTA>
        )}
      </>
    );
  }

  /* ─── 위자드 화면 ─── */
  return (
    <ProfileWizard mode="create" onComplete={handleComplete} onCancel={handleCancel} />
  );
}
