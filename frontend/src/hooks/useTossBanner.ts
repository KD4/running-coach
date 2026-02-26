import { TossAds } from '@apps-in-toss/web-framework';
import { useCallback, useEffect, useRef, useState } from 'react';

export function useTossBanner(adGroupId: string) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const destroyRef = useRef<(() => void) | null>(null);

  // callback ref: DOM에 붙는 시점을 정확히 감지
  const containerRef = useCallback((node: HTMLDivElement | null) => {
    setContainer(node);
  }, []);

  // 1단계: SDK 초기화
  useEffect(() => {
    if (!TossAds.initialize.isSupported() || isInitialized) return;

    TossAds.initialize({
      callbacks: {
        onInitialized: () => setIsInitialized(true),
        onInitializationFailed: () => {},
      },
    });
  }, [isInitialized]);

  // 2단계: 초기화 완료 + DOM 준비 후 배너 부착
  useEffect(() => {
    if (!isInitialized || !container) return;

    const attached = TossAds.attachBanner(adGroupId, container, {});
    destroyRef.current = attached.destroy;

    return () => {
      destroyRef.current?.();
      destroyRef.current = null;
    };
  }, [isInitialized, container, adGroupId]);

  return containerRef;
}
