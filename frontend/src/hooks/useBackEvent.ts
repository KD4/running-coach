import { useEffect } from 'react';
import { graniteEvent } from '@apps-in-toss/web-framework';

/**
 * 뒤로가기 버튼 이벤트를 구독하는 훅
 * onEvent가 호출되면 기본 뒤로가기 동작은 차단됨
 * @param onBack 뒤로가기 시 실행할 콜백
 */
export function useBackEvent(onBack: () => void) {
  useEffect(() => {
    const unsubscription = graniteEvent.addEventListener('backEvent', {
      onEvent: () => {
        onBack();
      },
      onError: (error) => {
        console.error(`뒤로가기 이벤트 오류: ${error}`);
      },
    });

    return () => {
      unsubscription();
    };
  }, [onBack]);
}
