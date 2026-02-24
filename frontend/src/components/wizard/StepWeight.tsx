import { Spacing, TextField } from '@toss/tds-mobile';
import { css } from '@emotion/react';
import { spacing } from '../../styles/tokens';
import type { StepProps } from './types';

function filterNumeric(value: string): string {
  // 숫자와 소수점만 허용, 소수점은 최대 1개
  const cleaned = value.replace(/[^0-9.]/g, '');
  const parts = cleaned.split('.');
  if (parts.length <= 2) return cleaned;
  return parts[0] + '.' + parts.slice(1).join('');
}

export default function StepWeight({ formData, updateFormData }: StepProps) {
  return (
    <div css={containerStyle}>
      <TextField
        variant="box"
        label="현재 체중 (kg)"
        labelOption="sustain"
        inputMode="decimal"
        value={formData.bodyWeight}
        onChange={(e) => updateFormData({ bodyWeight: filterNumeric(e.target.value) })}
      />
      <Spacing size={spacing.lg} />
      <TextField
        variant="box"
        label="목표 체중 (kg, 선택)"
        labelOption="sustain"
        inputMode="decimal"
        value={formData.targetWeight}
        onChange={(e) => updateFormData({ targetWeight: filterNumeric(e.target.value) })}
        placeholder="선택"
      />
    </div>
  );
}

const containerStyle = css`
  padding-top: ${spacing.sm}px;
`;
