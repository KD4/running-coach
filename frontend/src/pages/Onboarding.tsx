import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { appLogin } from '@apps-in-toss/web-bridge';
import { oauthLogin } from '../api/auth';
import { submitOnboarding } from '../api/user';
import { useAuth, GUEST_MODE_ENABLED } from '../contexts/AuthContext';
import { Button, Paragraph, Spacing } from '@toss/tds-mobile';
import { css } from '@emotion/react';
import { spacing } from '../styles/tokens';
import ProfileWizard from '../components/wizard/ProfileWizard';
import type { WizardFormData } from '../components/wizard/types';

export default function Onboarding() {
  const navigate = useNavigate();
  const { token, isGuest, login, loginAsGuest, setOnboarded, setGuestProfile } = useAuth();
  const isAuthenticated = !!token || isGuest;
  const [showIntro, setShowIntro] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  /* ─── 인트로: 로그인/게스트 선택 ─── */

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

  const handleGuestStart = () => {
    loginAsGuest();
    setShowIntro(false);
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
      <div css={introPageStyle}>
        <div css={introContainerStyle}>
          <div css={logoStyle}>🏃</div>
          <Spacing size={8} />
          <Paragraph typography="t4">러닝 코치</Paragraph>
          <Spacing size={8} />
          <Paragraph typography="st6" color="secondary">
            당신만의 맞춤 러닝 훈련 플랜
          </Paragraph>
          <Spacing size={32} />
          {isAuthenticated ? (
            <Button
              display="block"
              size="xlarge"
              onClick={() => setShowIntro(false)}
            >
              시작하기
            </Button>
          ) : (
            <>
              {loginError && (
                <>
                  <Paragraph typography="st6" color="danger">{loginError}</Paragraph>
                  <Spacing size={12} />
                </>
              )}
              <Button
                display="block"
                size="xlarge"
                onClick={handleTossLogin}
                loading={loginLoading}
              >
                토스로 시작하기
              </Button>
              {GUEST_MODE_ENABLED && (
                <>
                  <Spacing size={spacing.md} />
                  <Button
                    display="block"
                    size="xlarge"
                    variant="weak"
                    onClick={handleGuestStart}
                  >
                    로그인 없이 시작하기
                  </Button>
                </>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  /* ─── 위자드 화면 ─── */
  return (
    <ProfileWizard mode="create" onComplete={handleComplete} onCancel={handleCancel} />
  );
}

const introPageStyle = css`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100dvh;
  padding: 20px;
`;

const introContainerStyle = css`
  text-align: center;
  max-width: 320px;
  width: 100%;
`;

const logoStyle = css`
  font-size: 4rem;
  margin-bottom: 8px;
`;
