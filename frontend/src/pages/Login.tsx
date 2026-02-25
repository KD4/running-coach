import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { appLogin } from '@apps-in-toss/web-bridge';
import { oauthLogin } from '../api/auth';
import { useAuth } from '../contexts/AuthContext';
import { Asset, Top, StepperRow, Spacing, Paragraph, FixedBottomCTA } from '@toss/tds-mobile';
import { adaptive } from '@toss/tds-colors';
import { css } from '@emotion/react';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
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
      {error && (
        <div css={css`padding: 0 20px;`}>
          <Spacing size={12} />
          <Paragraph typography="st6" color="danger">{error}</Paragraph>
        </div>
      )}
      <FixedBottomCTA loading={loading} onClick={handleTossLogin}>
        토스로 시작하기
      </FixedBottomCTA>
    </>
  );
}
