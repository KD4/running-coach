import { List, ListRow, Checkbox, Spacing, Paragraph } from '@toss/tds-mobile';
import { adaptive } from '@toss/tds-colors';
import { css } from '@emotion/react';
import { DAYS } from '../../constants/workout';
import { spacing } from '../../styles/tokens';
import type { StepProps } from './types';

export default function StepTrainingDays({ formData, updateFormData }: StepProps) {
  const toggleDay = (dayValue: string) => {
    const isSelected = formData.trainingDays.includes(dayValue);
    const newDays = isSelected
      ? formData.trainingDays.filter((d) => d !== dayValue)
      : [...formData.trainingDays, dayValue];

    const updates: Partial<typeof formData> = { trainingDays: newDays };

    // 롱런 요일이 제거된 경우 자동 리셋
    if (isSelected && formData.longRunDay === dayValue) {
      updates.longRunDay = newDays[0] ?? '';
    }

    updateFormData(updates);
  };

  const selectedDays = DAYS.filter((d) => formData.trainingDays.includes(d.value));

  return (
    <div>
      {/* 훈련 요일 선택 */}
      <List>
        {DAYS.map((day) => (
          <ListRow
            key={day.value}
            role="checkbox"
            aria-checked={formData.trainingDays.includes(day.value)}
            onClick={() => toggleDay(day.value)}
            contents={
              <ListRow.Texts
                type="1RowTypeA"
                top={day.label + '요일'}
                topProps={{ color: adaptive.grey700 }}
              />
            }
            right={<Checkbox.Line size={24} checked={formData.trainingDays.includes(day.value)} />}
            verticalPadding="large"
          />
        ))}
      </List>

      {/* 롱런 요일 선택 */}
      {selectedDays.length > 0 && (
        <div css={longRunSectionStyle}>
          <Spacing size={spacing.xl} />
          <Paragraph typography="st6" color="secondary">
            롱런 요일을 선택해주세요
          </Paragraph>
          <Spacing size={spacing.sm} />
          <List>
            {selectedDays.map((day) => (
              <ListRow
                key={day.value}
                role="checkbox"
                aria-checked={formData.longRunDay === day.value}
                onClick={() => updateFormData({ longRunDay: day.value })}
                contents={
                  <ListRow.Texts
                    type="1RowTypeA"
                    top={day.label + '요일'}
                    topProps={{ color: adaptive.grey700 }}
                  />
                }
                right={<Checkbox.Line size={24} checked={formData.longRunDay === day.value} />}
                verticalPadding="large"
              />
            ))}
          </List>
        </div>
      )}
    </div>
  );
}

const longRunSectionStyle = css`
  margin-top: ${spacing.sm}px;
`;
