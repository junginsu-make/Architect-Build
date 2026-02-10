import React, { useState, useMemo } from 'react';
import type { IntakeFormSchema, IntakeFormData } from '../../types/intake';
import IntakeFieldRenderer from './IntakeFieldRenderer';
import IntakeFormPreview from './IntakeFormPreview';

// Intake Form Schema: 5 sections mapped to the 5 diagnostic questions
const intakeSchema: IntakeFormSchema = {
  sections: [
    {
      id: 'business_background',
      title: '비즈니스 배경',
      titleEn: 'Business Background',
      description: '현재 운영 중인 비즈니스와 직면한 문제점을 설명해 주세요.',
      descriptionEn: 'Describe your current business operations and pain points.',
      fields: [
        { id: 'company_name', label: '회사/프로젝트명', labelEn: 'Company/Project Name', type: 'text', priority: 'P1', placeholder: '예: ABC 물류', placeholderEn: 'e.g. ABC Logistics', required: true },
        { id: 'industry', label: '업종', labelEn: 'Industry', type: 'select', priority: 'P1', required: true,
          options: [
            { value: 'manufacturing', label: '제조업', labelEn: 'Manufacturing' },
            { value: 'logistics', label: '물류/유통', labelEn: 'Logistics/Distribution' },
            { value: 'finance', label: '금융/보험', labelEn: 'Finance/Insurance' },
            { value: 'healthcare', label: '의료/헬스케어', labelEn: 'Healthcare' },
            { value: 'education', label: '교육', labelEn: 'Education' },
            { value: 'retail', label: '리테일/커머스', labelEn: 'Retail/Commerce' },
            { value: 'it', label: 'IT/소프트웨어', labelEn: 'IT/Software' },
            { value: 'other', label: '기타', labelEn: 'Other' },
          ]
        },
        { id: 'pain_points', label: '현재 가장 큰 불편사항', labelEn: 'Biggest Pain Points', type: 'textarea', priority: 'P1', placeholder: '수작업, 데이터 분산, 커뮤니케이션 문제 등', placeholderEn: 'Manual work, scattered data, communication issues, etc.', required: true },
        { id: 'company_size', label: '직원 수', labelEn: 'Employee Count', type: 'select', priority: 'P2',
          options: [
            { value: '1-10', label: '1~10명', labelEn: '1-10' },
            { value: '11-50', label: '11~50명', labelEn: '11-50' },
            { value: '51-200', label: '51~200명', labelEn: '51-200' },
            { value: '201-1000', label: '201~1000명', labelEn: '201-1000' },
            { value: '1000+', label: '1000명 이상', labelEn: '1000+' },
          ]
        },
        { id: 'budget_range', label: '예산 범위', labelEn: 'Budget Range', type: 'select', priority: 'P3',
          options: [
            { value: 'under_10m', label: '1천만원 이하', labelEn: 'Under $10K' },
            { value: '10m_50m', label: '1천만~5천만원', labelEn: '$10K-$50K' },
            { value: '50m_100m', label: '5천만~1억원', labelEn: '$50K-$100K' },
            { value: '100m_500m', label: '1억~5억원', labelEn: '$100K-$500K' },
            { value: 'over_500m', label: '5억원 이상', labelEn: 'Over $500K' },
          ]
        },
      ],
    },
    {
      id: 'system_model',
      title: '시스템 모델',
      titleEn: 'System Model',
      description: '희망하는 솔루션의 형태를 선택해 주세요.',
      descriptionEn: 'Choose the desired form of the solution.',
      fields: [
        { id: 'system_type', label: '시스템 유형', labelEn: 'System Type', type: 'radio', priority: 'P1', required: true,
          options: [
            { value: 'web_app', label: '웹 애플리케이션', labelEn: 'Web Application' },
            { value: 'mobile_app', label: '모바일 앱', labelEn: 'Mobile App' },
            { value: 'admin_dashboard', label: '관리자 대시보드', labelEn: 'Admin Dashboard' },
            { value: 'chatbot', label: 'AI 챗봇/어시스턴트', labelEn: 'AI Chatbot/Assistant' },
            { value: 'saas', label: 'SaaS 플랫폼', labelEn: 'SaaS Platform' },
            { value: 'automation', label: '업무 자동화 시스템', labelEn: 'Automation System' },
          ]
        },
        { id: 'system_description', label: '시스템 상세 설명', labelEn: 'System Description', type: 'textarea', priority: 'P1', placeholder: '어떤 기능을 중심으로 구축하고 싶으신지 자유롭게 서술해 주세요.', placeholderEn: 'Describe the core features you want to build.', required: true },
        { id: 'reference_services', label: '참고 서비스/벤치마크', labelEn: 'Reference Services', type: 'text', priority: 'P2', placeholder: '예: Notion, Slack, Salesforce 등', placeholderEn: 'e.g. Notion, Slack, Salesforce' },
      ],
    },
    {
      id: 'workflow',
      title: '업무 프로세스',
      titleEn: 'Workflow & Processes',
      description: '사용자가 시스템에서 수행할 핵심 업무 흐름을 설명해 주세요.',
      descriptionEn: 'Describe the key workflows users will perform in the system.',
      fields: [
        { id: 'primary_users', label: '주요 사용자', labelEn: 'Primary Users', type: 'text', priority: 'P1', placeholder: '예: 영업팀, 물류 담당자, 고객', placeholderEn: 'e.g. Sales team, logistics staff, customers', required: true },
        { id: 'core_workflow', label: '핵심 업무 프로세스', labelEn: 'Core Workflow', type: 'textarea', priority: 'P1', placeholder: '주문 접수 → 배정 → 처리 → 완료 보고 등 단계별로 작성해 주세요.', placeholderEn: 'Order received → Assignment → Processing → Report completion, etc.', required: true },
        { id: 'data_volume', label: '예상 데이터 규모', labelEn: 'Expected Data Volume', type: 'select', priority: 'P2',
          options: [
            { value: 'small', label: '소규모 (일 100건 이하)', labelEn: 'Small (under 100/day)' },
            { value: 'medium', label: '중규모 (일 100~1000건)', labelEn: 'Medium (100-1000/day)' },
            { value: 'large', label: '대규모 (일 1000건 이상)', labelEn: 'Large (over 1000/day)' },
          ]
        },
        { id: 'special_requirements', label: '특수 요구사항', labelEn: 'Special Requirements', type: 'textarea', priority: 'P3', placeholder: '다국어 지원, 오프라인 모드, 실시간 알림 등', placeholderEn: 'Multi-language, offline mode, real-time notifications, etc.' },
      ],
    },
    {
      id: 'tech_environment',
      title: '기술 환경',
      titleEn: 'Technical Environment',
      description: '현재 사용 중인 도구와 기술 환경을 알려주세요.',
      descriptionEn: 'Tell us about your current tools and technical environment.',
      fields: [
        { id: 'current_tools', label: '현재 사용 도구', labelEn: 'Current Tools', type: 'multi-select', priority: 'P1', required: true,
          options: [
            { value: 'excel', label: '엑셀/스프레드시트', labelEn: 'Excel/Spreadsheet' },
            { value: 'erp', label: 'ERP', labelEn: 'ERP' },
            { value: 'crm', label: 'CRM', labelEn: 'CRM' },
            { value: 'email', label: '이메일', labelEn: 'Email' },
            { value: 'messenger', label: '메신저 (카카오톡, Slack 등)', labelEn: 'Messenger (Slack, etc.)' },
            { value: 'custom', label: '자체 개발 시스템', labelEn: 'Custom System' },
            { value: 'none', label: '없음', labelEn: 'None' },
          ]
        },
        { id: 'integration_needs', label: '연동 필요 시스템', labelEn: 'Integration Needs', type: 'textarea', priority: 'P2', placeholder: '기존 시스템과 연동이 필요한 부분을 설명해 주세요.', placeholderEn: 'Describe systems that need integration.' },
        { id: 'hosting_preference', label: '호스팅 선호', labelEn: 'Hosting Preference', type: 'radio', priority: 'P3',
          options: [
            { value: 'cloud', label: '클라우드', labelEn: 'Cloud' },
            { value: 'on_premise', label: '온프레미스', labelEn: 'On-premise' },
            { value: 'hybrid', label: '하이브리드', labelEn: 'Hybrid' },
            { value: 'no_preference', label: '선호 없음', labelEn: 'No preference' },
          ]
        },
      ],
    },
    {
      id: 'success_metrics',
      title: '성공 지표',
      titleEn: 'Success Metrics',
      description: '이 프로젝트의 성공을 측정할 KPI를 정의해 주세요.',
      descriptionEn: 'Define KPIs to measure project success.',
      fields: [
        { id: 'primary_kpi', label: '핵심 KPI', labelEn: 'Primary KPI', type: 'textarea', priority: 'P1', placeholder: '예: 처리 시간 50% 단축, 오류율 90% 감소', placeholderEn: 'e.g. 50% faster processing, 90% fewer errors', required: true },
        { id: 'timeline', label: '목표 일정', labelEn: 'Target Timeline', type: 'select', priority: 'P2',
          options: [
            { value: '1month', label: '1개월 이내', labelEn: 'Within 1 month' },
            { value: '3months', label: '1~3개월', labelEn: '1-3 months' },
            { value: '6months', label: '3~6개월', labelEn: '3-6 months' },
            { value: '1year', label: '6개월~1년', labelEn: '6 months - 1 year' },
            { value: 'flexible', label: '유연', labelEn: 'Flexible' },
          ]
        },
        { id: 'secondary_goals', label: '부가 목표', labelEn: 'Secondary Goals', type: 'textarea', priority: 'P3', placeholder: '브랜드 이미지 향상, 직원 만족도 등', placeholderEn: 'Brand improvement, employee satisfaction, etc.' },
      ],
    },
  ],
};

// Bridge function: convert form data to userResponses array compatible with existing services
export function intakeFormToUserResponses(formData: IntakeFormData, schema: IntakeFormSchema): string[] {
  return schema.sections.map((section) => {
    const parts = section.fields
      .map((field) => {
        const val = formData[field.id];
        if (!val || (Array.isArray(val) && val.length === 0)) return null;
        const displayVal = Array.isArray(val) ? val.join(', ') : val;
        return `${field.label}: ${displayVal}`;
      })
      .filter(Boolean);
    return parts.join('. ');
  });
}

interface IntakeFormProps {
  onSubmit: (userResponses: string[]) => void;
}

const IntakeForm: React.FC<IntakeFormProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState<IntakeFormData>({});
  const [activeSection, setActiveSection] = useState(0);
  const [showPreview, setShowPreview] = useState(false);

  const handleFieldChange = (fieldId: string, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
  };

  const completionStats = useMemo(() => {
    let totalP1 = 0;
    let filledP1 = 0;
    let totalAll = 0;
    let filledAll = 0;

    intakeSchema.sections.forEach((section) => {
      section.fields.forEach((field) => {
        totalAll++;
        const val = formData[field.id];
        const isFilled = val && (!Array.isArray(val) ? val !== '' : val.length > 0);
        if (isFilled) filledAll++;
        if (field.priority === 'P1') {
          totalP1++;
          if (isFilled) filledP1++;
        }
      });
    });

    return {
      totalP1,
      filledP1,
      totalAll,
      filledAll,
      percentAll: totalAll > 0 ? Math.round((filledAll / totalAll) * 100) : 0,
      percentP1: totalP1 > 0 ? Math.round((filledP1 / totalP1) * 100) : 0,
      isP1Complete: filledP1 === totalP1,
    };
  }, [formData]);

  const currentSection = intakeSchema.sections[activeSection];

  const handleSubmit = () => {
    const responses = intakeFormToUserResponses(formData, intakeSchema);
    onSubmit(responses);
  };

  if (showPreview) {
    return (
      <IntakeFormPreview
        formData={formData}
        schema={intakeSchema}
        onBack={() => setShowPreview(false)}
        onSubmit={handleSubmit}
      />
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header with progress */}
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-black text-slate-900 text-sm">
            요구사항 정의서
          </h3>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-500">
              {completionStats.percentAll}% 완료
            </span>
            {!completionStats.isP1Complete && (
              <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded">
                필수: {completionStats.filledP1}/{completionStats.totalP1}
              </span>
            )}
          </div>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-1.5">
          <div
            className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${completionStats.percentAll}%` }}
          />
        </div>
      </div>

      {/* Section navigation */}
      <div className="flex gap-1 px-4 py-3 overflow-x-auto border-b border-slate-100">
        {intakeSchema.sections.map((section, i) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(i)}
            className={`flex-shrink-0 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
              i === activeSection
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
            }`}
          >
            {section.title}
          </button>
        ))}
      </div>

      {/* Section content */}
      <div className="flex-grow overflow-y-auto p-6 space-y-6">
        <div className="mb-4">
          <h4 className="font-bold text-lg text-slate-900 mb-1">
            {currentSection.title}
          </h4>
          <p className="text-sm text-slate-400">
            {currentSection.description}
          </p>
        </div>

        {currentSection.fields.map((field) => (
          <IntakeFieldRenderer
            key={field.id}
            field={field}
            value={formData[field.id] || ''}
            onChange={handleFieldChange}
          />
        ))}
      </div>

      {/* Footer actions */}
      <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between gap-3">
        <div className="flex gap-2">
          {activeSection > 0 && (
            <button
              onClick={() => setActiveSection((s) => s - 1)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-all"
            >
              이전
            </button>
          )}
          {activeSection < intakeSchema.sections.length - 1 && (
            <button
              onClick={() => setActiveSection((s) => s + 1)}
              className="px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-all"
            >
              다음
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowPreview(true)}
            className="px-4 py-2.5 rounded-xl border border-blue-200 text-blue-600 text-xs font-bold hover:bg-blue-50 transition-all"
          >
            프리뷰
          </button>
          <button
            onClick={handleSubmit}
            disabled={!completionStats.isP1Complete}
            className="px-6 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-black hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            설계 시작
          </button>
        </div>
      </div>
    </div>
  );
};

export { intakeSchema };
export default IntakeForm;
