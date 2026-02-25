import { NavLink } from 'react-router-dom';
import { css } from '@emotion/react';
import { Asset, Text } from '@toss/tds-mobile';
import { adaptive } from '@toss/tds-colors';

export default function BottomNav() {
  return (
    <nav css={navWrapperStyle}>
      <div css={navStyle}>
        <NavLink to="/today" css={navItemStyle}>
          {({ isActive }) => (
            <div css={navItemInnerStyle}>
              <Asset.Icon
                frameShape={Asset.frameShape.CleanW24}
                name="icon-home-mono"
                color={isActive ? adaptive.grey800 : adaptive.grey400}
                aria-hidden
              />
              <Text
                display="block"
                color={isActive ? adaptive.grey900 : adaptive.grey600}
                typography="st13"
                fontWeight="medium"
                textAlign="center"
              >
                오늘
              </Text>
            </div>
          )}
        </NavLink>
        <NavLink to="/schedule" css={navItemStyle}>
          {({ isActive }) => (
            <div css={navItemInnerStyle}>
              <Asset.Icon
                frameShape={Asset.frameShape.CleanW24}
                name="icon-book-opened-mono"
                color={isActive ? adaptive.grey800 : adaptive.grey400}
                aria-hidden
              />
              <Text
                display="block"
                color={isActive ? adaptive.grey900 : adaptive.grey600}
                typography="st13"
                fontWeight="medium"
                textAlign="center"
              >
                스케줄
              </Text>
            </div>
          )}
        </NavLink>
        <NavLink to="/profile" css={navItemStyle}>
          {({ isActive }) => (
            <div css={navItemInnerStyle}>
              <Asset.Icon
                frameShape={Asset.frameShape.CleanW24}
                name="icon-fill-three-dots-mono"
                color={isActive ? adaptive.grey800 : adaptive.grey400}
                aria-hidden
              />
              <Text
                display="block"
                color={isActive ? adaptive.grey900 : adaptive.grey600}
                typography="st13"
                fontWeight="medium"
                textAlign="center"
              >
                더보기
              </Text>
            </div>
          )}
        </NavLink>
      </div>
    </nav>
  );
}

const navWrapperStyle = css`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 0 16px;
  padding-bottom: env(safe-area-inset-bottom);
  z-index: 100;
`;

const navStyle = css`
  display: flex;
  justify-content: space-around;
  align-items: center;
  background: ${adaptive.background};
  border-radius: 30px;
  padding: 9px;
  margin-bottom: 8px;
  box-shadow: 0px 20px 20px -16px #191F2911, 0px 40px 200px 0px #191F293f;
`;

const navItemStyle = css`
  text-decoration: none;
  flex: 1;
  &:active, &:hover, &:focus, &.active {
    text-decoration: none;
  }
`;

const navItemInnerStyle = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 42px;
  gap: 2px;
`;
