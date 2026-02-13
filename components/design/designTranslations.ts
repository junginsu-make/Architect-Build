
import { Language } from '../../types';

export const designTranslations: Record<Language, Record<string, string>> = {
  [Language.KO]: {
    // Tab & Section labels
    pageFlowLabel: '흐름도',
    uiMockupsLabel: '목업',
    wireframesLabel: '와이어프레임',
    componentArchLabel: '컴포넌트',
    designTokensLabel: '디자인 토큰',
    frontendTechLabel: '기술 스택',

    // Section titles
    pageFlowTitle: '페이지 흐름도',
    componentTreeTitle: '컴포넌트 트리',
    designTokensTitle: '디자인 토큰',
    frontendTechTitle: '프론트엔드 기술 스택',

    // Table headers
    pageNameLabel: '페이지',
    routeLabel: '라우트',
    descriptionLabel: '설명',
    componentsLabel: '컴포넌트',
    propsLabel: 'Props',
    childrenLabel: '자식 컴포넌트',

    // Design tokens
    colorsLabel: '색상 팔레트',
    typographyLabel: '타이포그래피',
    spacingLabel: '간격 시스템',

    // Mockups
    expandMockup: '클릭하여 확대',
    mockupRenderFailed: '이미지 렌더링 실패',
    noMockupsDesc: '이미지 목업이 생성되지 않았습니다.',

    // Wireframes
    previewLabel: '미리보기',
    codeLabel: '코드',
    copyHtmlCode: 'HTML 복사',
    copiedLabel: '복사됨!',
    noWireframesDesc: '와이어프레임이 생성되지 않았습니다.',

    // Empty state
    noDesignPlan: 'UI 설계 없음',
    noDesignPlanDesc: '프론트엔드 설계가 아직 생성되지 않았습니다.',

    // Progress messages
    frontendDesignGenerating: '프론트엔드 UI 설계 생성 중...',
    frontendDesignComplete: '프론트엔드 UI 설계 완료',
    frontendDesignFailed: '프론트엔드 UI 설계 생성 실패 (백엔드 설계에는 영향 없음)',
    selectPageLabel: '페이지 선택',
  },
  [Language.EN]: {
    pageFlowLabel: 'Page Flow',
    uiMockupsLabel: 'Mockups',
    wireframesLabel: 'Wireframes',
    componentArchLabel: 'Components',
    designTokensLabel: 'Design Tokens',
    frontendTechLabel: 'Tech Stack',

    pageFlowTitle: 'Page Flow Diagram',
    componentTreeTitle: 'Component Tree',
    designTokensTitle: 'Design Tokens',
    frontendTechTitle: 'Frontend Tech Stack',

    pageNameLabel: 'Page',
    routeLabel: 'Route',
    descriptionLabel: 'Description',
    componentsLabel: 'Components',
    propsLabel: 'Props',
    childrenLabel: 'Children',

    colorsLabel: 'Color Palette',
    typographyLabel: 'Typography',
    spacingLabel: 'Spacing System',

    expandMockup: 'Click to expand',
    mockupRenderFailed: 'Render failed',
    noMockupsDesc: 'No UI mockups have been generated.',

    previewLabel: 'Preview',
    codeLabel: 'Code',
    copyHtmlCode: 'Copy HTML',
    copiedLabel: 'Copied!',
    noWireframesDesc: 'No wireframes have been generated.',

    noDesignPlan: 'No UI Design',
    noDesignPlanDesc: 'Frontend design has not been generated yet.',

    frontendDesignGenerating: 'Generating frontend UI design...',
    frontendDesignComplete: 'Frontend UI design complete',
    frontendDesignFailed: 'Frontend UI design generation failed (backend design unaffected)',
    selectPageLabel: 'Select page',
  },
};
