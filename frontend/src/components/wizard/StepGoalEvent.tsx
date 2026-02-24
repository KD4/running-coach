import { List, ListRow, Checkbox } from '@toss/tds-mobile';
import { adaptive } from '@toss/tds-colors';
import { EVENTS } from '../../constants/workout';
import type { StepProps } from './types';

export default function StepGoalEvent({ formData, updateFormData }: StepProps) {
  return (
    <List>
      {EVENTS.map((ev) => (
        <ListRow
          key={ev.value}
          role="checkbox"
          aria-checked={formData.goalEvent === ev.value}
          onClick={() => updateFormData({ goalEvent: ev.value })}
          contents={
            <ListRow.Texts
              type="1RowTypeA"
              top={ev.label}
              topProps={{ color: adaptive.grey700 }}
            />
          }
          right={<Checkbox.Line size={24} checked={formData.goalEvent === ev.value} />}
          verticalPadding="large"
        />
      ))}
    </List>
  );
}
