import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { appLogin } from '@apps-in-toss/web-bridge';
import { oauthLogin } from '../api/auth';
import { useAuth, GUEST_MODE_ENABLED } from '../contexts/AuthContext';
import { Button, Paragraph, Spacing } from '@toss/tds-mobile';
import { css } from '@emotion/react';
import { spacing } from '../styles/tokens';

export default function Login() {
  const navigate = useNavigate();
  const { login, loginAsGuest } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTossLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const { authorizationCode, referrer } = await appLogin();
      const res = await oauthLogin('toss', authorizationCode, referrer);
      login(res.token, res.isNewUser);
      navigate(res.isNewUser ? '/onboarding' : '/today', { replace: true });
    } catch {
      setError('로그인에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestStart = () => {
    loginAsGuest();
    navigate('/onboarding', { replace: true });
  };

  return (
    <div css={loginPageStyle}>
      <div css={loginContainerStyle}>
        <img src="/running_icon_small.png" alt="러닝 코치" css={logoImgStyle} />
        <Spacing size={8} />
        <Paragraph typography="t4">러닝 코치</Paragraph>
        <Spacing size={8} />
        <Paragraph typography="st6" color="secondary">
          당신만의 맞춤 러닝 훈련 플랜
        </Paragraph>
        <Spacing size={32} />
        {error && (
          <>
            <Paragraph typography="st6" color="danger">{error}</Paragraph>
            <Spacing size={12} />
          </>
        )}
        <Button
          display="block"
          size="xlarge"
          onClick={handleTossLogin}
          loading={loading}
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
      </div>
    </div>
  );
}

const loginPageStyle = css`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100dvh;
  padding: 20px;
`;

const loginContainerStyle = css`
  text-align: center;
  max-width: 320px;
  width: 100%;
`;

const logoImgStyle = css`
  width: 120px;
  height: 120px;
  margin-bottom: 8px;
  border-radius: 24px;
  object-fit: contain;
`;
