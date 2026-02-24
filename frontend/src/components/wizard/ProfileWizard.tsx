import { useState } from 'react';
import { Button, Paragraph, Spacing } from '@toss/tds-mobile';
import { css } from '@emotion/react';
import { spacing, color, layout } from '../../styles/tokens';
import WizardHeader from './WizardHeader';
import StepGoalEvent from './StepGoalEvent';
import StepDateAndTime from './StepDateAndTime';
import StepTrainingDays from './StepTrainingDays';
import StepWeight from './StepWeight';
import type { WizardFormData, WizardProps } from './types';
import { getDefaultFormData } from './types';

const TOTAL_STEPS = 4;

const STEP_CONFIG = [
  { title: '목표 레이스 종류를 선택해주세요', subtitle: '가장 가까운 레이스를 선택하시면 됩니다.' },
  { title: '대회 날짜와 목표 기록을 입력해주세요' },
  { title: '훈련 요일을 선택해주세요', subtitle: '최소 3일 이상 선택해주세요.' },
  { title: '체중을 입력해주세요', subtitle: '맞춤 칼로리 계산에 사용됩니다.' },
];

function validateStep(step: number, formData: WizardFormData): string | null {
  switch (step) {
    case 0:
      return null; // goalEvent 항상 기본값 있음
    case 1:
      if (!formData.targetDate) return '대회 날짜를 선택해주세요.';
      return null;
    case 2:
      if (formData.trainingDays.length < 3) return '최소 3일 이상의 훈련일을 선택해주세요.';
      if (!formData.longRunDay || !formData.trainingDays.includes(formData.longRunDay))
        return '롱런 요일을 선택해주세요.';
      return null;
    case 3:
      if (!formData.bodyWeight || Number(formData.bodyWeight) <= 0)
        return '현재 체중을 입력해주세요.';
      return null;
    default:
      return null;
  }
}

export default function ProfileWizard({ mode, initialData, onComplete, onCancel }: WizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<WizardFormData>(() => initialData ?? getDefaultFormData());
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const updateFormData = (partial: Partial<WizardFormData>) => {
    setFormData((prev) => ({ ...prev, ...partial }));
    setError(null);
  };

  const handleBack = () => {
    if (currentStep === 0) {
      onCancel?.();
    } else {
      setCurrentStep((s) => s - 1);
      setError(null);
    }
  };

  const handleNext = async () => {
    const validationError = validateStep(currentStep, formData);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep((s) => s + 1);
      setError(null);
    } else {
      // 마지막 스텝 - 제출
      setLoading(true);
      try {
        await onComplete(formData);
      } catch {
        setError('저장에 실패했습니다. 다시 시도해주세요.');
      } finally {
        setLoading(false);
      }
    }
  };

  const isLastStep = currentStep === TOTAL_STEPS - 1;
  const ctaLabel = isLastStep ? (mode === 'create' ? '시작하기' : '저장') : '다음';

  const stepProps = { formData, updateFormData };
  const config = STEP_CONFIG[currentStep];

  return (
    <div css={wizardContainerStyle}>
      <div css={wizardPageStyle}>
        <WizardHeader
          step={currentStep}
          totalSteps={TOTAL_STEPS}
          title={config.title}
          subtitle={config.subtitle}
          onBack={handleBack}
        />

        <div css={stepContentStyle}>
          {currentStep === 0 && <StepGoalEvent {...stepProps} />}
          {currentStep === 1 && <StepDateAndTime {...stepProps} />}
          {currentStep === 2 && <StepTrainingDays {...stepProps} />}
          {currentStep === 3 && <StepWeight {...stepProps} />}
        </div>
      </div>

      <div css={bottomCtaStyle}>
        {error && (
          <>
            <Paragraph typography="st7" color="danger" css={css`text-align: center;`}>
              {error}
            </Paragraph>
            <Spacing size={spacing.sm} />
          </>
        )}
        <Button display="block" size="xlarge" onClick={handleNext} loading={loading}>
          {ctaLabel}
        </Button>
      </div>
    </div>
  );
}

const wizardContainerStyle = css`
  display: flex;
  flex-direction: column;
  max-width: 480px;
  width: 100%;
  height: 100dvh;
  margin: 0 auto;
  background: ${color.bgPage};
  overflow: hidden;
`;

const wizardPageStyle = css`
  flex: 1;
  overflow-y: scroll;
  padding: 0 ${layout.pagePaddingH}px ${spacing.xxl}px;
`;

const stepContentStyle = css`
  width: 100%;
  overflow: hidden;
`;

const bottomCtaStyle = css`
  flex-shrink: 0;
  padding: ${spacing.lg}px ${layout.pagePaddingH}px;
  padding-bottom: calc(${spacing.lg}px + env(safe-area-inset-bottom));
  background: ${color.bgPage};
`;
