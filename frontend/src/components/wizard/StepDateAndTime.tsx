import { Spacing, TextField, WheelDatePicker, Paragraph } from '@toss/tds-mobile';
import { css } from '@emotion/react';
import { spacing } from '../../styles/tokens';
import { timeInputsRowStyle, timeFieldStyle, timeInputWidthStyle, timeLabelStyle } from '../../styles/common';
import type { StepProps } from './types';

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function StepDateAndTime({ formData, updateFormData }: StepProps) {
  return (
    <div css={containerStyle}>
      {/* 대회 날짜 */}
      <div css={sectionStyle}>
        <Paragraph typography="st7" color="secondary">대회 날짜</Paragraph>
        <Spacing size={spacing.sm} />
        <WheelDatePicker
          title="대회 날짜 선택"
          triggerLabel="날짜 선택"
          value={formData.targetDate ? new Date(formData.targetDate + 'T00:00:00') : undefined}
          onChange={(d) => updateFormData({ targetDate: formatDate(d) })}
          format="yyyy.MM.dd"
          min={new Date()}
          buttonText="선택"
        />
      </div>

      {/* 목표 기록 */}
      <div css={sectionStyle}>
        <Paragraph typography="st7" color="secondary">목표 기록</Paragraph>
        <Spacing size={spacing.sm} />
        <div css={timeInputsRowStyle}>
          <div css={timeFieldStyle}>
            <TextField
              variant="box"
              type="number"
              value={formData.goalHours}
              onChange={(e) => updateFormData({ goalHours: e.target.value })}
              css={timeInputWidthStyle}
            />
            <span css={timeLabelStyle}>시간</span>
          </div>
          <div css={timeFieldStyle}>
            <TextField
              variant="box"
              type="number"
              value={formData.goalMinutes}
              onChange={(e) => updateFormData({ goalMinutes: e.target.value })}
              css={timeInputWidthStyle}
            />
            <span css={timeLabelStyle}>분</span>
          </div>
          <div css={timeFieldStyle}>
            <TextField
              variant="box"
              type="number"
              value={formData.goalSeconds}
              onChange={(e) => updateFormData({ goalSeconds: e.target.value })}
              css={timeInputWidthStyle}
            />
            <span css={timeLabelStyle}>초</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const containerStyle = css`
  padding-top: ${spacing.sm}px;
`;

const sectionStyle = css`
  margin-bottom: ${spacing.xl}px;
`;
