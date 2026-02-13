import React, { useState } from 'react';
import JSZip from 'jszip';
import type { SolutionBlueprint } from '../../services/geminiService';
import { Language } from '../../types/common';
import { generateClientReportHtml, generateDeveloperReportHtml, downloadHtml, printReport } from '../../services/reportGenerator';
import { useDeliverableStore } from '../../store/deliverableStore';
import ExportButton from './ExportButton';

interface DownloadManagerProps {
  blueprint: SolutionBlueprint;
  lang: Language;
}

const DownloadManager: React.FC<DownloadManagerProps> = ({ blueprint, lang }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [reportLang, setReportLang] = useState<Language>(lang);
  const translatedBlueprints = useDeliverableStore((s) => s.translatedBlueprints);

  // Use translated blueprint matching reportLang if available, otherwise fall back to current blueprint
  const getExportBlueprint = () => translatedBlueprints[reportLang] ?? blueprint;

  const handleClientHtmlDownload = () => {
    const html = generateClientReportHtml(getExportBlueprint(), reportLang);
    downloadHtml(html, 'client-proposal.html');
  };

  const handleDeveloperHtmlDownload = () => {
    const html = generateDeveloperReportHtml(getExportBlueprint(), reportLang);
    downloadHtml(html, 'developer-docs.html');
  };

  const handlePrintClient = () => {
    const html = generateClientReportHtml(getExportBlueprint(), reportLang);
    printReport(html);
  };

  const handlePrintDeveloper = () => {
    const html = generateDeveloperReportHtml(getExportBlueprint(), reportLang);
    printReport(html);
  };

  const handleJsonDownload = () => {
    const dataStr = JSON.stringify(getExportBlueprint(), null, 2);
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
      const bp = getExportBlueprint();

      // Blueprint JSON (root)
      zip.file('blueprint.json', JSON.stringify(bp, null, 2));

      // ── client/ ──
      if (bp.clientProposal) {
        const cp = bp.clientProposal;
        const isKo = reportLang === Language.KO;
        const proposalMd = [
          `# ${isKo ? '프로젝트 제안서' : 'Project Proposal'}`,
          ``,
          `## ${isKo ? '문제 정의' : 'Problem Statement'}`,
          cp.problemStatement,
          ``,
          `## ${isKo ? '솔루션 개요' : 'Solution Overview'}`,
          cp.solutionOverview,
          ``,
          `## ${isKo ? '핵심 기능' : 'Key Features'}`,
          ...cp.keyFeatures.map((f) => `- ${f}`),
          ``,
          `## ${isKo ? '프로젝트 마일스톤' : 'Project Milestones'}`,
          ``,
          `| ${isKo ? '단계' : 'Phase'} | ${isKo ? '기간' : 'Duration'} | ${isKo ? '산출물' : 'Outcome'} |`,
          `|------|------|--------|`,
          ...cp.milestones.map((m) => `| ${m.phase} | ${m.duration} | ${m.outcome} |`),
          ``,
          `## ${isKo ? '기대 효과' : 'Expected Outcomes'}`,
          cp.expectedOutcomes,
          ``,
          `## ${isKo ? '데이터 보호 방안' : 'Data Protection'}`,
          cp.dataProtection,
          ``,
          `## ${isKo ? '투자 요약' : 'Investment Summary'}`,
          cp.investmentSummary,
        ].join('\n');
        zip.file('client/proposal.md', proposalMd);
        zip.file('client/proposal.html', generateClientReportHtml(bp, reportLang));
      }

      // ── developer/ ──
      if (bp.implementationPlan) {
        const impl = bp.implementationPlan;

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
          const isKo = reportLang === Language.KO;
          const sprintMd = [
            `# ${isKo ? '스프린트 계획' : 'Sprint Plan'}`,
            ``,
            ...impl.sprintPlan.flatMap((s) => [
              `## Sprint ${s.sprint}: ${s.title}`,
              ``,
              `**${isKo ? '기간' : 'Duration'}:** ${s.duration}`,
              ``,
              `### ${isKo ? '목표' : 'Goals'}`,
              ...s.goals.map((g) => `- ${g}`),
              ``,
              `### ${isKo ? '산출물' : 'Deliverables'}`,
              ...s.deliverables.map((d) => `- ${d}`),
              ``,
              `### ${isKo ? '의존성' : 'Dependencies'}`,
              ...(s.dependencies.length > 0
                ? s.dependencies.map((dep) => `- ${dep}`)
                : [`- ${isKo ? '없음' : 'None'}`]),
              ``,
              `---`,
              ``,
            ]),
          ].join('\n');
          zip.file('developer/sprint-plan.md', sprintMd);
        }

        // Deployment Plan
        if (impl.deploymentPlan) {
          const isKo = reportLang === Language.KO;
          zip.file('developer/deployment-plan.md', `# ${isKo ? '배포 계획' : 'Deployment Plan'}\n\n${impl.deploymentPlan}`);
        }

        // Testing Strategy
        if (impl.testingStrategy) {
          const isKo = reportLang === Language.KO;
          zip.file('developer/testing-strategy.md', `# ${isKo ? '테스트 전략' : 'Testing Strategy'}\n\n${impl.testingStrategy}`);
        }

        // API Spec
        if (impl.apiDesign?.length) {
          const isKo = reportLang === Language.KO;
          const apiMd = [
            `# ${isKo ? 'API 명세서' : 'API Specification'}`,
            ``,
            `## ${isKo ? '엔드포인트 목록' : 'Endpoint List'}`,
            ``,
            `| ${isKo ? '메서드' : 'Method'} | ${isKo ? '경로' : 'Path'} | ${isKo ? '설명' : 'Description'} | ${isKo ? '인증' : 'Auth'} |`,
            `|--------|------|------|------|`,
            ...impl.apiDesign.map((a) => `| ${a.method} | \`${a.path}\` | ${a.description} | ${a.auth ? (isKo ? '필요' : 'Required') : (isKo ? '공개' : 'Public')} |`),
            ``,
            `## ${isKo ? '상세 설명' : 'Details'}`,
            ``,
            ...impl.apiDesign.flatMap((a) => [
              `### \`${a.method} ${a.path}\``,
              ``,
              `- **${isKo ? '설명' : 'Description'}:** ${a.description}`,
              `- **${isKo ? '인증' : 'Auth'}:** ${a.auth ? (isKo ? '필요' : 'Required') : (isKo ? '공개' : 'Public')}`,
              ...(a.requestBody ? [``, `#### ${isKo ? '요청 본문' : 'Request Body'}`, '```json', a.requestBody, '```'] : []),
              ...(a.responseBody ? [``, `#### ${isKo ? '응답' : 'Response'}`, '```json', a.responseBody, '```'] : []),
              ...(a.errorCodes?.length ? [``, `#### ${isKo ? '에러 코드' : 'Error Codes'}`, ...a.errorCodes.map(c => `- \`${c}\``)] : []),
              ``,
            ]),
          ].join('\n');
          zip.file('developer/api-spec.md', apiMd);
        }

        // DB Schema
        if (impl.databaseDesign?.length) {
          const isKo = reportLang === Language.KO;
          const dbMd = [
            `# ${isKo ? '데이터베이스 스키마' : 'Database Schema'}`,
            ``,
            ...impl.databaseDesign.flatMap((table) => [
              `## ${table.name}`,
              ``,
              table.description,
              ``,
              `| ${isKo ? '컬럼' : 'Column'} | ${isKo ? '타입' : 'Type'} | ${isKo ? '제약' : 'Constraint'} |`,
              `|------|------|------|`,
              ...table.columns.map((c) => `| ${c.name} | ${c.type} | ${c.constraint} |`),
              ``,
            ]),
          ].join('\n');
          zip.file('developer/db-schema.md', dbMd);
        }

        // Implementation JSON (full structured data)
        zip.file('developer/implementation.json', JSON.stringify(impl, null, 2));

        // Individual source files for key modules
        if (impl.keyModules?.length) {
          for (const mod of impl.keyModules) {
            // Use the file path from the module, placing under developer/src/
            const filePath = mod.file.startsWith('/') ? mod.file.slice(1) : mod.file;
            zip.file(`developer/src/${filePath}`, mod.code);
          }
        }

        // Developer HTML report
        zip.file('developer/full-report.html', generateDeveloperReportHtml(bp, reportLang));
      }

      // ── diagrams/ ──
      if (bp.architectureDiagram) {
        zip.file('diagrams/architecture.mmd', bp.architectureDiagram);
      }
      if (bp.sequenceDiagram) {
        zip.file('diagrams/sequence.mmd', bp.sequenceDiagram);
      }
      if (bp.techStackGraph) {
        zip.file('diagrams/tech-stack.mmd', bp.techStackGraph);
      }

      // ── frontend-design/ ──
      if (bp.frontendDesignPlan) {
        const fd = bp.frontendDesignPlan;

        // Page flow Mermaid diagram
        if (fd.pageFlow?.mermaidDiagram) {
          zip.file('frontend-design/page-flow.mmd', fd.pageFlow.mermaidDiagram);
        }

        // Component architecture Mermaid diagram
        if (fd.componentArchitecture?.mermaidDiagram) {
          zip.file('frontend-design/component-tree.mmd', fd.componentArchitecture.mermaidDiagram);
        }

        // Design tokens JSON
        if (fd.designTokens) {
          zip.file('frontend-design/design-tokens.json', JSON.stringify(fd.designTokens, null, 2));
        }

        // Frontend tech stack JSON
        if (fd.frontendTechStack?.length) {
          zip.file('frontend-design/tech-stack.json', JSON.stringify(fd.frontendTechStack, null, 2));
        }

        // HTML wireframes
        if (fd.htmlWireframes?.length) {
          for (let i = 0; i < fd.htmlWireframes.length; i++) {
            const wf = fd.htmlWireframes[i];
            zip.file(`frontend-design/wireframes/${String(i + 1).padStart(2, '0')}-${wf.pageName}.html`, wf.htmlCode);
          }
        }

        // UI mockup images (base64 → binary SVG or PNG)
        if (fd.uiMockups?.length) {
          for (let i = 0; i < fd.uiMockups.length; i++) {
            const mockup = fd.uiMockups[i];
            if (mockup.imageBase64) {
              const isSvg = mockup.imageBase64.startsWith('PHN2');
              const ext = isSvg ? 'svg' : 'png';
              zip.file(
                `frontend-design/mockups/${String(i + 1).padStart(2, '0')}-${mockup.pageName}.${ext}`,
                mockup.imageBase64,
                { base64: true },
              );
            }
          }
        }
      }

      // ── report.md (root) ──
      const isKoReport = reportLang === Language.KO;
      const mdContent = [
        `# ${isKoReport ? '아키텍트 설계 보고서' : 'Architect Design Report'}`,
        ``,
        `## ${isKoReport ? '실행 로드맵' : 'Execution Roadmap'}`,
        ...bp.roadmap.map((step, i) => `${i + 1}. ${step}`),
        ``,
        `## ${isKoReport ? '분석 요약' : 'Analysis Summary'}`,
        bp.analysisSummary,
        ``,
        `## ${isKoReport ? '예상 ROI' : 'Estimated ROI'}`,
        bp.estimatedROI,
        ``,
        `## ${isKoReport ? '보안 전략' : 'Security Strategy'}`,
        bp.securityStrategy,
        ``,
        ...(bp.sources?.length
          ? [`## ${isKoReport ? '참고 자료' : 'References'}`, ...bp.sources
              .filter((s) => { try { const u = new URL(s.uri); return u.protocol === 'https:' || u.protocol === 'http:'; } catch { return false; } })
              .map((s) => `- [${s.title}](${s.uri})`)]
          : []),
      ].join('\n');
      zip.file('report.md', mdContent);

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
    docDownload: '문서 다운로드',
    print: '인쇄',
    fullExport: '전체 내보내기',
    reportLang: '보고서 언어',
  };

  const enLabels = {
    export: 'Export',
    clientDoc: 'Client Report',
    devDoc: 'Developer Docs',
    printClient: 'Print Client Report',
    printDev: 'Print Developer Docs',
    zip: 'Download Full ZIP',
    json: 'Raw JSON',
    docDownload: 'Document Download',
    print: 'Print',
    fullExport: 'Full Export',
    reportLang: 'Report Language',
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
          {/* Report language selector */}
          <div className="flex items-center justify-between px-2 pt-1 pb-2">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{labels.reportLang}</p>
            <div className="flex bg-slate-100 rounded-lg overflow-hidden">
              <button
                onClick={() => setReportLang(Language.KO)}
                className={`px-3 py-1 text-[10px] font-bold transition-all ${
                  reportLang === Language.KO ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                한국어
              </button>
              <button
                onClick={() => setReportLang(Language.EN)}
                className={`px-3 py-1 text-[10px] font-bold transition-all ${
                  reportLang === Language.EN ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                English
              </button>
            </div>
          </div>

          <div className="border-t border-slate-100 my-1" />

          {/* Document downloads */}
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2 pt-1">{labels.docDownload}</p>
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
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2">{labels.print}</p>
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
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2">{labels.fullExport}</p>
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
