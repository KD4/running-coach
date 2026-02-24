import { css } from '@emotion/react';
import { Paragraph } from '@toss/tds-mobile';
import { color, radius } from '../styles/tokens';

interface ChipProps {
  selected: boolean;
  onClick: () => void;
  size?: 'medium' | 'small';
  children: React.ReactNode;
}

export default function Chip({ selected, onClick, size = 'medium', children }: ChipProps) {
  const typo = size === 'small' ? 'st8' : 'st7';
  return (
    <button type="button" css={chipButtonStyle(selected, size)} onClick={onClick}>
      <Paragraph typography={typo} css={css`color: ${selected ? '#FFFFFF' : color.text};`}>
        {children}
      </Paragraph>
    </button>
  );
}

const chipButtonStyle = (selected: boolean, size: 'medium' | 'small') => css`
  min-height: ${size === 'small' ? 32 : 36}px;
  padding: ${size === 'small' ? '4px 10px' : '6px 14px'};
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
