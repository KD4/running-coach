import { NavLink } from 'react-router-dom';
import { css } from '@emotion/react';
import { Paragraph } from '@toss/tds-mobile';
import { color, layout } from '../styles/tokens';

function RunIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="5" r="2" />
      <path d="M7 20l3-8 2 2 3-6" />
      <path d="M10 14l-2 6" />
      <path d="M15 8l3 4h2" />
      <path d="M10 14h3" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

export default function BottomNav() {
  return (
    <nav css={navStyle}>
      <NavLink to="/today" css={navItemStyle}>
        {({ isActive }) => (
          <div css={navItemInnerStyle(isActive)}>
            <RunIcon />
            <Paragraph typography="st7" css={css`color: inherit;`}>오늘</Paragraph>
          </div>
        )}
      </NavLink>
      <NavLink to="/schedule" css={navItemStyle}>
        {({ isActive }) => (
          <div css={navItemInnerStyle(isActive)}>
            <CalendarIcon />
            <Paragraph typography="st7" css={css`color: inherit;`}>스케줄</Paragraph>
          </div>
        )}
      </NavLink>
      <NavLink to="/profile" css={navItemStyle}>
        {({ isActive }) => (
          <div css={navItemInnerStyle(isActive)}>
            <ProfileIcon />
            <Paragraph typography="st7" css={css`color: inherit;`}>프로필</Paragraph>
          </div>
        )}
      </NavLink>
    </nav>
  );
}

const navStyle = css`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: ${layout.navHeight}px;
  background: ${color.bgCard};
  border-top: 1px solid ${color.border};
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding-bottom: env(safe-area-inset-bottom);
  z-index: 100;
`;

const navItemStyle = css`
  text-decoration: none;
  padding: 4px 16px;
`;

const navItemInnerStyle = (isActive: boolean) => css`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  color: ${isActive ? color.primary : color.textSecondary};
`;
