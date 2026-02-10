import React, { useState } from 'react';
import JSZip from 'jszip';
import type { SolutionBlueprint } from '../../services/geminiService';
import { Language } from '../../types/common';
import { generateClientReportHtml, generateDeveloperReportHtml, downloadHtml, printReport } from '../../services/reportGenerator';
import ExportButton from './ExportButton';

interface DownloadManagerProps {
  blueprint: SolutionBlueprint;
  lang: Language;
}

const DownloadManager: React.FC<DownloadManagerProps> = ({ blueprint, lang }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleClientHtmlDownload = () => {
    const html = generateClientReportHtml(blueprint);
    downloadHtml(html, 'client-proposal.html');
  };

  const handleDeveloperHtmlDownload = () => {
    const html = generateDeveloperReportHtml(blueprint);
    downloadHtml(html, 'developer-docs.html');
  };

  const handlePrintClient = () => {
    const html = generateClientReportHtml(blueprint);
    printReport(html);
  };

  const handlePrintDeveloper = () => {
    const html = generateDeveloperReportHtml(blueprint);
    printReport(html);
  };

  const handleJsonDownload = () => {
    const dataStr = JSON.stringify(blueprint, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'architect-blueprint.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleZipDownload = async () => {
    setIsExporting(true);
    try {
      const zip = new JSZip();

      // Blueprint JSON (root)
      zip.file('blueprint.json', JSON.stringify(blueprint, null, 2));

      // ── client/ ──
      if (blueprint.clientProposal) {
        const cp = blueprint.clientProposal;
        const proposalMd = [
          `# 프로젝트 제안서`,
          ``,
          `## 문제 정의`,
          cp.problemStatement,
          ``,
          `## 솔루션 개요`,
          cp.solutionOverview,
          ``,
          `## 핵심 기능`,
          ...cp.keyFeatures.map((f) => `- ${f}`),
          ``,
          `## 프로젝트 마일스톤`,
          ``,
          `| 단계 | 기간 | 산출물 |`,
          `|------|------|--------|`,
          ...cp.milestones.map((m) => `| ${m.phase} | ${m.duration} | ${m.outcome} |`),
          ``,
          `## 기대 효과`,
          cp.expectedOutcomes,
          ``,
          `## 데이터 보호 방안`,
          cp.dataProtection,
          ``,
          `## 투자 요약`,
          cp.investmentSummary,
        ].join('\n');
        zip.file('client/proposal.md', proposalMd);
        zip.file('client/proposal.html', generateClientReportHtml(blueprint));
      }

      // ── developer/ ──
      if (blueprint.implementationPlan) {
        const impl = blueprint.implementationPlan;

        // PRD
        if (impl.prd) {
          zip.file('developer/prd.md', impl.prd);
        }

        // LLD
        if (impl.lld) {
          zip.file('developer/lld.md', impl.lld);
        }

        // Sprint Plan
        if (impl.sprintPlan?.length) {
          const sprintMd = [
            `# 스프린트 계획`,
            ``,
            ...impl.sprintPlan.flatMap((s) => [
              `## Sprint ${s.sprint}: ${s.title}`,
              ``,
              `**기간:** ${s.duration}`,
              ``,
              `### 목표`,
              ...s.goals.map((g) => `- ${g}`),
              ``,
              `### 산출물`,
              ...s.deliverables.map((d) => `- ${d}`),
              ``,
              `### 의존성`,
              ...(s.dependencies.length > 0
                ? s.dependencies.map((dep) => `- ${dep}`)
                : [`- 없음`]),
              ``,
              `---`,
              ``,
            ]),
          ].join('\n');
          zip.file('developer/sprint-plan.md', sprintMd);
        }

        // API Spec
        if (impl.apiDesign?.length) {
          const apiMd = [
            `# API 명세서`,
            ``,
            `## 엔드포인트 목록`,
            ``,
            `| 메서드 | 경로 | 설명 | 인증 |`,
            `|--------|------|------|------|`,
            ...impl.apiDesign.map((a) => `| ${a.method} | \`${a.path}\` | ${a.description} | ${a.auth ? '필요' : '공개'} |`),
            ``,
            `## 상세 설명`,
            ``,
            ...impl.apiDesign.flatMap((a) => [
              `### \`${a.method} ${a.path}\``,
              ``,
              `- **설명:** ${a.description}`,
              `- **인증:** ${a.auth ? '필요' : '공개'}`,
              ``,
            ]),
          ].join('\n');
          zip.file('developer/api-spec.md', apiMd);
        }

        // DB Schema
        if (impl.databaseDesign?.length) {
          const dbMd = [
            `# 데이터베이스 스키마`,
            ``,
            ...impl.databaseDesign.flatMap((table) => [
              `## ${table.name}`,
              ``,
              table.description,
              ``,
              `| 컬럼 | 타입 | 제약 |`,
              `|------|------|------|`,
              ...table.columns.map((c) => `| ${c.name} | ${c.type} | ${c.constraint} |`),
              ``,
            ]),
          ].join('\n');
          zip.file('developer/db-schema.md', dbMd);
        }

        // Implementation JSON (full structured data)
        zip.file('developer/implementation.json', JSON.stringify(impl, null, 2));

        // Developer HTML report
        zip.file('developer/full-report.html', generateDeveloperReportHtml(blueprint));
      }

      // ── diagrams/ ──
      if (blueprint.architectureDiagram) {
        zip.file('diagrams/architecture.mmd', blueprint.architectureDiagram);
      }
      if (blueprint.sequenceDiagram) {
        zip.file('diagrams/sequence.mmd', blueprint.sequenceDiagram);
      }
      if (blueprint.techStackGraph) {
        zip.file('diagrams/tech-stack.mmd', blueprint.techStackGraph);
      }

      // ── report.md (root) ──
      const mdContent = [
        `# 아키텍트 설계 보고서`,
        ``,
        `## 실행 로드맵`,
        ...blueprint.roadmap.map((step, i) => `${i + 1}. ${step}`),
        ``,
        `## 분석 요약`,
        blueprint.analysisSummary,
        ``,
        `## 예상 ROI`,
        blueprint.estimatedROI,
        ``,
        `## 보안 전략`,
        blueprint.securityStrategy,
        ``,
        ...(blueprint.sources?.length
          ? [`## 참고 자료`, ...blueprint.sources
              .filter((s) => { try { const u = new URL(s.uri); return u.protocol === 'https:' || u.protocol === 'http:'; } catch { return false; } })
              .map((s) => `- [${s.title}](${s.uri})`)]
          : []),
      ].join('\n');
      zip.file('report.md', mdContent);

      // ── logo.png (root) ──
      if (blueprint.projectLogoBase64 && /^[A-Za-z0-9+/=]+$/.test(blueprint.projectLogoBase64)) {
        try {
          const logoData = Uint8Array.from(atob(blueprint.projectLogoBase64), (c) => c.charCodeAt(0));
          zip.file('logo.png', logoData);
        } catch {
          console.warn('Logo Base64 decoding failed, skipping logo in ZIP');
        }
      }

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'architect-blueprint.zip';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('ZIP export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const hasImpl = !!blueprint.implementationPlan;

  const koLabels = {
    export: '내보내기',
    clientDoc: '클라이언트 보고서',
    devDoc: '개발자 문서',
    printClient: '클라이언트용 인쇄',
    printDev: '개발자용 인쇄',
    zip: 'ZIP 전체 다운로드',
    json: 'JSON 원본',
  };

  const enLabels = {
    export: 'Export',
    clientDoc: 'Client Report',
    devDoc: 'Developer Docs',
    printClient: 'Print Client Report',
    printDev: 'Print Developer Docs',
    zip: 'Download Full ZIP',
    json: 'Raw JSON',
  };

  const labels = lang === Language.KO ? koLabels : enLabels;

  const docIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
  );

  const printIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m0 0a48.159 48.159 0 0 1 12.5 0m-12.5 0V5.625c0-.621.504-1.125 1.125-1.125h9c.621 0 1.125.504 1.125 1.125v3.284" />
    </svg>
  );

  const zipIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
    </svg>
  );

  const jsonIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
    </svg>
  );

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-8 py-4 rounded-2xl bg-slate-900 text-white font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg shadow-slate-200"
      >
        {labels.export}
      </button>

      {isOpen && (
        <div className="absolute bottom-full right-0 mb-2 w-72 bg-white border border-slate-100 rounded-2xl shadow-2xl p-3 space-y-1 z-50">
          {/* Document downloads */}
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2 pt-1">문서 다운로드</p>
          <ExportButton
            format="json"
            target="download"
            label={labels.clientDoc}
            variant="secondary"
            onClick={handleClientHtmlDownload}
            icon={docIcon}
          />
          {hasImpl && (
            <ExportButton
              format="json"
              target="download"
              label={labels.devDoc}
              variant="secondary"
              onClick={handleDeveloperHtmlDownload}
              icon={docIcon}
            />
          )}

          <div className="border-t border-slate-100 my-2" />

          {/* Print */}
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2">인쇄</p>
          <ExportButton
            format="json"
            target="download"
            label={labels.printClient}
            variant="outline"
            onClick={handlePrintClient}
            icon={printIcon}
          />
          {hasImpl && (
            <ExportButton
              format="json"
              target="download"
              label={labels.printDev}
              variant="outline"
              onClick={handlePrintDeveloper}
              icon={printIcon}
            />
          )}

          <div className="border-t border-slate-100 my-2" />

          {/* Full export */}
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2">전체 내보내기</p>
          <ExportButton
            format="zip"
            target="download"
            label={isExporting ? '...' : labels.zip}
            variant="primary"
            onClick={handleZipDownload}
            disabled={isExporting}
            icon={zipIcon}
          />
          <ExportButton
            format="json"
            target="download"
            label={labels.json}
            variant="outline"
            onClick={handleJsonDownload}
            icon={jsonIcon}
          />
        </div>
      )}
    </div>
  );
};

export default DownloadManager;
