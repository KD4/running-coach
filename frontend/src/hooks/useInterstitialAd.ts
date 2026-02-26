import { loadFullScreenAd, showFullScreenAd, GoogleAdMob } from '@apps-in-toss/web-framework';

const AD_TTL_MS = 1 * 60 * 1000; // 1분
let lastShownAt = 0;

/** TTL 내인지 확인 (팝업 표시 여부 판단용) */
showInterstitialAd.shouldShow = (): boolean => {
  return Date.now() - lastShownAt >= AD_TTL_MS;
};

/** 전면광고를 표시한다. 실제 광고가 노출됐으면 true, 스킵됐으면 false 반환 */
export function showInterstitialAd(adGroupId: string): Promise<boolean> {
  if (!showInterstitialAd.shouldShow()) return Promise.resolve(false);

  // 5.244.1+: 인앱 광고 2.0 ver2 (토스 애즈 우선 + AdMob fallback)
  if (loadFullScreenAd.isSupported()) {
    return new Promise((resolve) => {
      loadFullScreenAd({
        options: { adGroupId },
        onEvent: (event) => {
          if (event.type === 'loaded') {
            showFullScreenAd({
              options: { adGroupId },
              onEvent: (showEvent) => {
                if (showEvent.type === 'dismissed') { lastShownAt = Date.now(); resolve(true); }
              },
              onError: () => resolve(false),
            });
          }
        },
        onError: () => resolve(false),
      });
    });
  }

  // 5.227.0~5.244.0: 인앱 광고 2.0 (AdMob 단독)
  if (GoogleAdMob.loadAppsInTossAdMob.isSupported()) {
    return new Promise((resolve) => {
      GoogleAdMob.loadAppsInTossAdMob({
        options: { adGroupId },
        onEvent: (event) => {
          if (event.type === 'loaded') {
            GoogleAdMob.showAppsInTossAdMob({
              options: { adGroupId },
              onEvent: (showEvent) => {
                if (showEvent.type === 'dismissed') { lastShownAt = Date.now(); resolve(true); }
              },
              onError: () => resolve(false),
            });
          }
        },
        onError: () => resolve(false),
      });
    });
  }

  // 5.227.0 미만: 미지원
  return Promise.resolve(false);
}
