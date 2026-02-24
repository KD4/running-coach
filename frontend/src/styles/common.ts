import { css } from '@emotion/react';
import { color, spacing, radius, layout } from './tokens';

export const pageStyle = css`
  max-width: 480px;
  margin: 0 auto;
  padding: 0 ${layout.pagePaddingH}px ${spacing.xxl}px;
`;

export const cardStyle = css`
  background: ${color.bgCard};
  border-radius: ${radius.card}px;
  overflow: hidden;
`;

export const centerStyle = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
`;

export const formSectionStyle = css`
  margin-bottom: ${spacing.section}px;
`;

export const dateInputStyle = css`
  width: 100%;
  padding: ${spacing.md}px;
  border: 1px solid ${color.border};
  border-radius: ${radius.medium}px;
  font-size: 1rem;
  background: ${color.bgCard};
  color: ${color.text};
  outline: none;
  &:focus {
    border-color: ${color.primary};
  }
`;

export const timeInputsRowStyle = css`
  display: flex;
  gap: 4px;
`;

export const timeFieldStyle = css`
  display: flex;
  align-items: center;
  gap: 0;
  flex: 1;
  min-width: 0;
`;

export const timeInputWidthStyle = css`
  flex: 1;
  min-width: 0;
`;

export const timeLabelStyle = css`
  flex-shrink: 0;
  white-space: nowrap;
  font-size: 0.75rem;
  color: ${color.textSecondary};
  margin-left: -8px;
`;
