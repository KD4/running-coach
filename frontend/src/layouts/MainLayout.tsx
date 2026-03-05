import { Outlet } from 'react-router-dom';
import { css } from '@emotion/react';
import BottomNav from '../components/BottomNav';
import { layout } from '../styles/tokens';
import { useBackEvent } from '../hooks/useBackEvent';
import { useExitConfirm } from '../hooks/useExitConfirm';

export default function MainLayout() {
  const { openExitDialog, ExitConfirmDialog } = useExitConfirm();
  useBackEvent(openExitDialog);

  return (
    <div css={appLayoutStyle}>
      <ExitConfirmDialog />
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
