import { Outlet } from 'react-router-dom';
import { css } from '@emotion/react';
import BottomNav from '../components/BottomNav';
import { layout } from '../styles/tokens';

export default function MainLayout() {
  return (
    <div css={appLayoutStyle}>
      <main css={appMainStyle}>
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}

const appLayoutStyle = css`
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
`;

const appMainStyle = css`
  flex: 1;
  padding-bottom: ${layout.navHeight}px;
`;
