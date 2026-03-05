import { useState, useCallback } from 'react';
import { closeView } from '@apps-in-toss/web-bridge';
import { ConfirmDialog } from '@toss/tds-mobile';

/**
 * 종료 확인 다이얼로그 상태를 관리하는 훅
 * @returns openExitDialog - 다이얼로그를 여는 함수, ExitConfirmDialog - 렌더링할 다이얼로그 컴포넌트
 */
export function useExitConfirm() {
  const [open, setOpen] = useState(false);

  const openExitDialog = useCallback(() => {
    setOpen(true);
  }, []);

  const ExitConfirmDialog = useCallback(() => (
    <ConfirmDialog
      open={open}
      title="러닝 코치를 종료할까요?"
      onClose={() => setOpen(false)}
      cancelButton={
        <ConfirmDialog.CancelButton onClick={() => setOpen(false)}>
          취소
        </ConfirmDialog.CancelButton>
      }
      confirmButton={
        <ConfirmDialog.ConfirmButton onClick={() => closeView()}>
          종료하기
        </ConfirmDialog.ConfirmButton>
      }
    />
  ), [open]);

  return { openExitDialog, ExitConfirmDialog };
}
