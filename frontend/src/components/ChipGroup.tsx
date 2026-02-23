import { css } from '@emotion/react';
import { spacing } from '../styles/tokens';

interface ChipGroupProps {
  children: React.ReactNode;
}

export default function ChipGroup({ children }: ChipGroupProps) {
  return <div css={chipGroupStyle}>{children}</div>;
}

const chipGroupStyle = css`
  display: flex;
  flex-wrap: wrap;
  gap: ${spacing.sm}px;
`;
