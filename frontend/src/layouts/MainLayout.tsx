import { Outlet } from 'react-router-dom';
import { useCallback } from 'react';
import { css } from '@emotion/react';
import BottomNav from '../components/BottomNav';
import { layout } from '../styles/tokens';
import { useBackEvent } from '../hooks/useBackEvent';

export default function MainLayout() {
  useBackEvent(useCallback(() => history.back(), []));

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
