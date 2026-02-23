import { css } from '@emotion/react';
import { Paragraph } from '@toss/tds-mobile';
import { color, radius, layout } from '../styles/tokens';

interface ChipProps {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

export default function Chip({ selected, onClick, children }: ChipProps) {
  return (
    <button type="button" css={chipButtonStyle(selected)} onClick={onClick}>
      <Paragraph typography="st6" css={css`color: ${selected ? '#FFFFFF' : color.text};`}>
        {children}
      </Paragraph>
    </button>
  );
}

const chipButtonStyle = (selected: boolean) => css`
  min-height: ${layout.minTouchTarget}px;
  padding: 8px 16px;
  border-radius: ${radius.pill}px;
  border: 1px solid ${selected ? color.primary : color.border};
  background: ${selected ? color.primary : color.bgCard};
  cursor: pointer;
  user-select: none;
  transition: all 0.15s;
  &:active {
    transform: scale(0.975);
  }
`;
