import { css } from '@emotion/react';

interface ChipGroupProps {
  children: React.ReactNode;
}

export default function ChipGroup({ children }: ChipGroupProps) {
  return <div css={chipGroupStyle}>{children}</div>;
}

const chipGroupStyle = css`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;
