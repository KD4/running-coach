import {
  Asset,
  Image,
  Icon,
  List,
  ListRow,
  ListHeaderV3,
  Badge,
} from '@toss/tds-mobile';
import { adaptive } from '@toss/tds-colors';

export default function Page() {
  return (
    <>
      <Asset.Icon
        frameShape={Asset.frameShape.CleanW24}
        name="icon-arrow-back-ios-mono"
        color="#191F28ff"
        aria-hidden={true}
      />
      <Asset.Icon
        frameShape={Asset.frameShape.CleanW20}
        name="icon-pencil-line-mono"
        color="rgba(0, 19, 43, 0.58)"
        aria-hidden={true}
      />
      <Asset.Icon
        frameShape={Asset.frameShape.CleanW20}
        name="icon-dots-mono"
        color="rgba(0, 19, 43, 0.58)"
        aria-hidden={true}
      />
      <Asset.Icon
        frameShape={Asset.frameShape.CleanW20}
        name="icon-x-mono"
        color="rgba(0, 19, 43, 0.58)"
        aria-hidden={true}
      />
      <Spacing size={54} />
      <div />
      <Spacing size={22} />
      <List>
        <ListRow
          contents={
            <ListRow.Texts
              type="1RowTypeA"
              top="이름"
              topProps={{ color: adaptive.grey800 }}
            />
          }
          right={
            <ListRow.Texts
              type="Right1RowTypeA"
              top="김토스"
              topProps={{ color: adaptive.grey700 }}
            />
          }
          verticalPadding="large"
        />
        <ListRow
          contents={
            <ListRow.Texts
              type="1RowTypeA"
              top="영문 이름"
              topProps={{ color: adaptive.grey800 }}
            />
          }
          right={
            <ListRow.Texts
              type="Right1RowTypeA"
              top="Toss Kim"
              topProps={{ color: adaptive.grey700 }}
            />
          }
          verticalPadding="large"
        />
        <ListRow
          contents={
            <ListRow.Texts
              type="1RowTypeA"
              top="생년월일"
              topProps={{ color: adaptive.grey800 }}
            />
          }
          right={
            <ListRow.Texts
              type="Right1RowTypeA"
              top="2000.02.12"
              topProps={{ color: adaptive.grey700 }}
            />
          }
          verticalPadding="large"
        />
        <ListRow
          contents={
            <ListRow.Texts
              type="1RowTypeA"
              top="국적"
              topProps={{ color: adaptive.grey800 }}
            />
          }
          right={
            <ListRow.Texts
              type="Right1RowTypeA"
              top="한국"
              topProps={{ color: adaptive.grey700 }}
            />
          }
          verticalPadding="large"
        />
        <ListRow
          contents={
            <ListRow.Texts
              type="1RowTypeA"
              top="휴대폰 번호"
              topProps={{ color: adaptive.grey800 }}
            />
          }
          right={
            <ListRow.Texts
              type="Right1RowTypeA"
              top="010-1234-5678"
              topProps={{ color: adaptive.grey700 }}
            />
          }
          verticalPadding="large"
        />
        <ListRow
          contents={
            <ListRow.Texts
              type="1RowTypeA"
              top="이메일 주소"
              topProps={{ color: adaptive.grey800 }}
            />
          }
          right={
            <ListRow.Texts
              type="Right1RowTypeA"
              top="TossKim12@naver.com"
              topProps={{ color: adaptive.grey700 }}
            />
          }
          verticalPadding="large"
        />
      </List>
      <Border variant="height16" />
      <Spacing size={61} />
      <div>
        <ListRow
          contents={
            <ListRow.Texts
              type="1RowTypeA"
              top="집 주소"
              topProps={{ color: adaptive.grey800 }}
            />
          }
          right={
            <ListRow.Texts
              type="Right1RowTypeA"
              top="서울특별시 강남구 테헤란로 142"
              topProps={{ color: adaptive.grey700 }}
            />
          }
          verticalPadding="large"
        />
        <ListRow
          contents={
            <ListRow.Texts
              type="1RowTypeA"
              top="집 전화번호"
              topProps={{ color: adaptive.grey800 }}
            />
          }
          right={
            <ListRow.Texts
              type="Right1RowTypeA"
              top="없음"
              topProps={{ color: adaptive.grey500 }}
            />
          }
          verticalPadding="large"
        />
      </div>
      <Spacing size={16} />
      <Border variant="padding24" />
      <ListHeader
        title={
          <ListHeader.TitleParagraph
            color={adaptive.grey800}
            fontWeight="bold"
            typography="t5"
          >
            회사 정보
          </ListHeader.TitleParagraph>
        }
        descriptionPosition="bottom"
      />
      <List>
        <ListRow
          contents={
            <ListRow.Texts
              type="1RowTypeA"
              top="회사 이름"
              topProps={{ color: adaptive.grey800 }}
            />
          }
          right={
            <ListRow.Texts
              type="Right1RowTypeA"
              top="없음"
              topProps={{ color: adaptive.grey500 }}
            />
          }
          verticalPadding="large"
        />
        <ListRow
          contents={
            <ListRow.Texts
              type="1RowTypeA"
              top="회사 주소"
              topProps={{ color: adaptive.grey800 }}
            />
          }
          right={
            <ListRow.Texts
              type="Right1RowTypeA"
              top="없음"
              topProps={{ color: adaptive.grey500 }}
            />
          }
          verticalPadding="large"
        />
        <ListRow
          contents={
            <ListRow.Texts
              type="1RowTypeA"
              top="회사 전화번호"
              topProps={{ color: adaptive.grey800 }}
            />
          }
          right={
            <ListRow.Texts
              type="Right1RowTypeA"
              top="없음"
              topProps={{ color: adaptive.grey500 }}
            />
          }
          verticalPadding="large"
        />
      </List>
      <Spacing size={64} />
      <TextButton variant="underline">
        주민등록번호 변경이 필요한가요?
      </TextButton>
    </>
  );
}