import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { oauthLogin } from '../api/auth';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  provider: string;
}

export default function OAuthCallback({ provider }: Props) {
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

    oauthLogin(provider, code)
      .then((res) => {
        login(res.token, res.isNewUser);
        navigate(res.isNewUser ? '/onboarding' : '/today', { replace: true });
      })
      .catch(() => {
        setError('로그인에 실패했습니다. 다시 시도해주세요.');
      });
  }, [searchParams, navigate, login, provider]);

  if (error) {
    return (
      <div className="callback-page">
        <p className="error-text">{error}</p>
        <button onClick={() => navigate('/login', { replace: true })}>
          다시 로그인
        </button>
      </div>
    );
  }

  return (
    <div className="callback-page">
      <p>로그인 중...</p>
    </div>
  );
}
