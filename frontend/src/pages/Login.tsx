import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const KAKAO_CLIENT_ID = import.meta.env.VITE_KAKAO_CLIENT_ID || '598ecd287837c2a65ec66f56cf8863f8';
const KAKAO_REDIRECT_URI = import.meta.env.VITE_KAKAO_REDIRECT_URI || 'http://localhost:5173/auth/kakao/callback';

export default function Login() {
  const navigate = useNavigate();
  const { loginAsGuest } = useAuth();

  const handleKakaoLogin = () => {
    const url = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_CLIENT_ID}&redirect_uri=${encodeURIComponent(KAKAO_REDIRECT_URI)}&response_type=code`;
    window.location.href = url;
  };

  const handleGuestStart = () => {
    loginAsGuest();
    navigate('/onboarding', { replace: true });
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-logo">🏃</div>
        <h1>러닝 코치</h1>
        <p className="login-subtitle">당신만의 맞춤 러닝 훈련 플랜</p>

        <div className="social-buttons">
          <button className="kakao-login-btn" onClick={handleKakaoLogin}>
            카카오로 시작하기
          </button>
        </div>

        <div className="login-divider">
          <span>또는</span>
        </div>

        <button className="btn-secondary" onClick={handleGuestStart}>
          로그인 없이 시작하기
        </button>
      </div>
    </div>
  );
}
