import React from 'react';
import type { IntakeFormSchema, IntakeFormData } from '../../types/intake';

interface IntakeFormPreviewProps {
  formData: IntakeFormData;
  schema: IntakeFormSchema;
  onBack: () => void;
  onSubmit: () => void;
}

const IntakeFormPreview: React.FC<IntakeFormPreviewProps> = ({ formData, schema, onBack, onSubmit }) => {
  return (
    <div className="flex flex-col h-full bg-white">
      {/* Print-friendly preview */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 print:hidden">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          양식으로 돌아가기
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all"
          >
            인쇄/PDF
          </button>
          <button
            onClick={onSubmit}
            className="px-6 py-2 rounded-xl bg-blue-600 text-white text-xs font-black hover:bg-blue-700 transition-all"
          >
            설계 시작
          </button>
        </div>
      </div>

      <div className="flex-grow overflow-y-auto">
        <div className="max-w-[210mm] mx-auto p-8 print:p-12 print:max-w-none">
          {/* Header */}
          <div className="mb-8 pb-6 border-b-2 border-slate-900">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  프로젝트 요구사항 정의서
                </h1>
                <p className="text-sm text-slate-400 mt-1">Architect Enterprise Builder - Intake Form</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400">{new Date().toLocaleDateString('ko-KR')}</p>
              </div>
            </div>
          </div>

          {/* Sections */}
          {schema.sections.map((section, sIdx) => (
            <div key={section.id} className="mb-8">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-slate-900 text-white rounded flex items-center justify-center text-[10px] font-black">
                  {sIdx + 1}
                </span>
                {section.title}
              </h2>

              <div className="grid grid-cols-1 gap-3">
                {section.fields.map((field) => {
                  const val = formData[field.id];
                  const displayVal = !val
                    ? '-'
                    : Array.isArray(val)
                    ? val.length > 0
                      ? val
                          .map((v) => {
                            const opt = field.options?.find((o) => o.value === v);
                            return opt ? opt.label : v;
                          })
                          .join(', ')
                      : '-'
                    : field.options
                    ? (field.options.find((o) => o.value === val)?.label || val)
                    : val || '-';

                  const isEmpty = displayVal === '-';

                  return (
                    <div
                      key={field.id}
                      className="flex gap-4 py-2 px-3 rounded-lg bg-slate-50/50"
                    >
                      <div className="w-40 flex-shrink-0 flex items-start gap-2">
                        <span className={`text-[9px] font-black px-1 py-0.5 rounded ${
                          field.priority === 'P1' ? 'bg-blue-50 text-blue-600'
                          : field.priority === 'P2' ? 'bg-slate-100 text-slate-500'
                          : 'bg-slate-50 text-slate-400'
                        }`}>
                          {field.priority}
                        </span>
                        <span className="text-xs font-bold text-slate-600">
                          {field.label}
                        </span>
                      </div>
                      <div className={`flex-grow text-sm ${isEmpty ? 'text-slate-300 italic' : 'text-slate-800'}`}>
                        {displayVal}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Footer */}
          <div className="mt-12 pt-6 border-t border-slate-200 text-center print:mt-8">
            <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">
              Generated by Architect Enterprise Builder
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntakeFormPreview;
