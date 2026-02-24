import { Asset, Top } from '@toss/tds-mobile';
import { css } from '@emotion/react';
import { color, spacing, layout } from '../../styles/tokens';

interface WizardHeaderProps {
  step: number;
  totalSteps: number;
  title: string;
  subtitle?: string;
  onBack: () => void;
}

export default function WizardHeader({ step, totalSteps, title, subtitle, onBack }: WizardHeaderProps) {
  const progress = ((step + 1) / totalSteps) * 100;

  return (
    <div>
      {/* 뒤로가기 버튼 */}
      <div css={backButtonStyle} onClick={onBack} role="button" tabIndex={0}>
        <Asset.Icon
          frameShape={Asset.frameShape.CleanW24}
          name="icon-arrow-back-ios-mono"
          color={color.text}
          aria-hidden={true}
        />
      </div>

      {/* 프로그레스바 */}
      <div css={progressBarTrackStyle}>
        <div css={progressBarFillStyle(progress)} />
      </div>

      {/* 타이틀 */}
      <div css={titleWrapperStyle}>
        <Top
          upperGap={spacing.lg}
          lowerGap={spacing.md}
          title={<Top.TitleParagraph size={22}>{title}</Top.TitleParagraph>}
          subtitleBottom={
            subtitle ? (
              <Top.SubtitleParagraph size={13} color={color.textSecondary}>
                {subtitle}
              </Top.SubtitleParagraph>
            ) : undefined
          }
        />
      </div>
    </div>
  );
}

const backButtonStyle = css`
  padding: ${spacing.md}px 0;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  min-height: ${layout.minTouchTarget}px;
`;

const progressBarTrackStyle = css`
  height: 3px;
  background: ${color.border};
  margin: 0 -${layout.pagePaddingH}px;
`;

const progressBarFillStyle = (progress: number) => css`
  height: 100%;
  width: ${progress}%;
  background: ${color.primary};
  transition: width 0.3s ease;
`;

const titleWrapperStyle = css`
  width: 80%;
`;
