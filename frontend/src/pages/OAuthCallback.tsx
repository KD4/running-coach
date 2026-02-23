import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { oauthLogin } from '../api/auth';
import { useAuth } from '../contexts/AuthContext';
import { Loader, Paragraph, Button, Spacing } from '@toss/tds-mobile';
import { css } from '@emotion/react';

export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    const code = searchParams.get('code');
    if (!code) {
      setError('인증 코드가 없습니다.');
      return;
    }

    oauthLogin('toss', code)
      .then((res) => {
        login(res.token, res.isNewUser);
        navigate(res.isNewUser ? '/onboarding' : '/today', { replace: true });
      })
      .catch(() => {
        setError('로그인에 실패했습니다. 다시 시도해주세요.');
      });
  }, [searchParams, navigate, login]);

  if (error) {
    return (
      <div css={callbackPageStyle}>
        <Paragraph typography="st5" color="danger">{error}</Paragraph>
        <Spacing size={16} />
        <Button
          size="large"
          variant="weak"
          onClick={() => navigate('/login', { replace: true })}
        >
          다시 로그인
        </Button>
      </div>
    );
  }

  return (
    <div css={callbackPageStyle}>
      <Loader />
      <Spacing size={16} />
      <Paragraph typography="st6" color="secondary">로그인 중...</Paragraph>
    </div>
  );
}

const callbackPageStyle = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100dvh;
  gap: 16px;
`;
