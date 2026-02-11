import type { SolutionBlueprint } from './geminiService';
import { Language } from '../types/common';

type Lang = Language;

const reportLabels = {
  [Language.KO]: {
    clientTitle: '솔루션 제안서',
    clientSubtitle: 'AI 기반 맞춤 설계',
    problem: '현재 겪고 계신 문제',
    solution: '우리의 해결 방안',
    keyFeatures: '제공되는 핵심 기능',
    schedule: '추진 일정',
    expectedOutcomes: '도입 후 기대 효과',
    investment: '투자 대비 효과',
    dataProtection: '데이터 보호 및 보안',
    references: '참고 자료',
    devTitle: '개발 설계 문서',
    devSubtitle: 'Architecture & Implementation Plan',
    devNotReady: '구현 계획이 아직 생성되지 않았습니다.',
    sprintPlan: '스프린트 계획',
    duration: '기간',
    goals: '목표',
    deliverables: '산출물',
    dependencies: '의존성',
    projectStructure: '프로젝트 구조',
    techStack: '기술 스택',
    thCategory: '분류', thName: '이름', thVersion: '버전', thPurpose: '목적',
    apiEndpoints: 'API 엔드포인트',
    thMethod: '메서드', thPath: '경로', thDesc: '설명', thAuth: '인증',
    authRequired: '필요', authPublic: '공개',
    dbSchema: '데이터베이스 스키마',
    thColumn: '컬럼', thType: '타입', thConstraint: '제약',
    keyModules: '핵심 모듈',
    deployPlan: '배포 계획',
    testStrategy: '테스트 전략',
    roadmap: '실행 로드맵',
    analysisSummary: '분석 요약',
    estimatedROI: '예상 ROI',
    securityStrategy: '보안 전략',
    reportTitle: '아키텍트 설계 보고서',
    noDeps: '없음',
    calendarTimeline: '캘린더 타임라인',
    thPhase: '단계', thDuration: '기간', thOutcome: '산출물',
    architectureDiagrams: '아키텍처 다이어그램',
    systemArchitecture: '시스템 아키텍처',
    sequenceDiagram: '시퀀스 다이어그램',
    techStackDiagram: '기술 스택',
    mermaidNote: '아래 코드를 Mermaid 렌더러(mermaid.live 등)에서 시각화할 수 있습니다.',
  },
  [Language.EN]: {
    clientTitle: 'Solution Proposal',
    clientSubtitle: 'AI-Powered Custom Design',
    problem: 'Current Challenges',
    solution: 'Our Solution',
    keyFeatures: 'Key Features',
    schedule: 'Project Timeline',
    expectedOutcomes: 'Expected Outcomes',
    investment: 'Return on Investment',
    dataProtection: 'Data Protection & Security',
    references: 'References',
    devTitle: 'Developer Design Document',
    devSubtitle: 'Architecture & Implementation Plan',
    devNotReady: 'Implementation plan has not been generated yet.',
    sprintPlan: 'Sprint Plan',
    duration: 'Duration',
    goals: 'Goals',
    deliverables: 'Deliverables',
    dependencies: 'Dependencies',
    projectStructure: 'Project Structure',
    techStack: 'Tech Stack',
    thCategory: 'Category', thName: 'Name', thVersion: 'Version', thPurpose: 'Purpose',
    apiEndpoints: 'API Endpoints',
    thMethod: 'Method', thPath: 'Path', thDesc: 'Description', thAuth: 'Auth',
    authRequired: 'Required', authPublic: 'Public',
    dbSchema: 'Database Schema',
    thColumn: 'Column', thType: 'Type', thConstraint: 'Constraint',
    keyModules: 'Key Modules',
    deployPlan: 'Deployment Plan',
    testStrategy: 'Testing Strategy',
    roadmap: 'Execution Roadmap',
    analysisSummary: 'Analysis Summary',
    estimatedROI: 'Estimated ROI',
    securityStrategy: 'Security Strategy',
    reportTitle: 'Architect Design Report',
    noDeps: 'None',
    calendarTimeline: 'Calendar Timeline',
    thPhase: 'Phase', thDuration: 'Duration', thOutcome: 'Outcome',
    architectureDiagrams: 'Architecture Diagrams',
    systemArchitecture: 'System Architecture',
    sequenceDiagram: 'Sequence Diagram',
    techStackDiagram: 'Tech Stack',
    mermaidNote: 'Paste the code below into a Mermaid renderer (e.g. mermaid.live) to visualize.',
  },
};

const baseStyle = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1e293b; line-height: 1.7; padding: 48px; max-width: 800px; margin: 0 auto; }
  h1 { font-size: 24px; font-weight: 800; margin-bottom: 8px; }
  h2 { font-size: 18px; font-weight: 700; margin-top: 36px; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 2px solid #e2e8f0; }
  h3 { font-size: 15px; font-weight: 700; margin-top: 24px; margin-bottom: 8px; }
  h4 { font-size: 13px; font-weight: 700; margin-top: 16px; margin-bottom: 6px; }
  p { font-size: 14px; color: #475569; margin-bottom: 8px; }
  ul, ol { font-size: 14px; color: #475569; padding-left: 24px; margin-bottom: 8px; }
  li { margin-bottom: 4px; }
  table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 13px; }
  th { background: #f8fafc; text-align: left; padding: 8px 12px; border: 1px solid #e2e8f0; font-weight: 600; color: #64748b; }
  td { padding: 8px 12px; border: 1px solid #e2e8f0; color: #475569; }
  pre { background: #1e293b; color: #cbd5e1; padding: 16px; border-radius: 8px; overflow-x: auto; font-size: 12px; line-height: 1.6; margin: 12px 0; white-space: pre-wrap; }
  code { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-size: 12px; }
  .subtitle { font-size: 14px; color: #94a3b8; margin-bottom: 32px; }
  .section-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 16px 0; }
  .feature-item { display: flex; align-items: center; gap: 8px; padding: 8px 0; }
  .feature-check { color: #16a34a; font-weight: bold; }
  .milestone { display: flex; gap: 16px; padding: 12px 0; border-bottom: 1px solid #f1f5f9; }
  .milestone:last-child { border-bottom: none; }
  .milestone-num { width: 28px; height: 28px; border-radius: 50%; background: #3b82f6; color: white; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex-shrink: 0; }
  .milestone-phase { font-weight: 600; font-size: 14px; color: #1e293b; }
  .milestone-duration { font-size: 12px; color: #94a3b8; }
  .milestone-outcome { font-size: 13px; color: #64748b; margin-top: 2px; }
  .footer { margin-top: 48px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
  .badge-method { background: #dbeafe; color: #1d4ed8; }
  .badge-auth { background: #dcfce7; color: #15803d; }
  @media print { body { padding: 24px; } }
`;

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function markdownToHtml(md: string): string {
  const lines = md.split('\n');
  const result: string[] = [];
  let inList: 'ul' | 'ol' | null = null;
  let inCodeBlock = false;

  const flushList = () => {
    if (inList) {
      result.push(`</${inList}>`);
      inList = null;
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();

    // Code block toggle
    if (trimmed.startsWith('```')) {
      flushList();
      if (inCodeBlock) {
        result.push('</code></pre>');
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
        result.push('<pre><code>');
      }
      continue;
    }

    if (inCodeBlock) {
      result.push(escapeHtml(line));
      continue;
    }

    // Headings
    if (trimmed.startsWith('#### ')) { flushList(); result.push(`<h4>${escapeHtml(trimmed.slice(5))}</h4>`); continue; }
    if (trimmed.startsWith('### ')) { flushList(); result.push(`<h3>${escapeHtml(trimmed.slice(4))}</h3>`); continue; }
    if (trimmed.startsWith('## ')) { flushList(); result.push(`<h2>${escapeHtml(trimmed.slice(3))}</h2>`); continue; }
    if (trimmed.startsWith('# ')) { flushList(); result.push(`<h1>${escapeHtml(trimmed.slice(2))}</h1>`); continue; }

    // Unordered list
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      if (inList !== 'ul') { flushList(); result.push('<ul>'); inList = 'ul'; }
      result.push(`<li>${escapeHtml(trimmed.slice(2)).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/`(.+?)`/g, '<code>$1</code>')}</li>`);
      continue;
    }

    // Ordered list
    if (/^\d+\.\s/.test(trimmed)) {
      if (inList !== 'ol') { flushList(); result.push('<ol>'); inList = 'ol'; }
      result.push(`<li>${escapeHtml(trimmed.replace(/^\d+\.\s/, '')).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/`(.+?)`/g, '<code>$1</code>')}</li>`);
      continue;
    }

    // HR
    if (trimmed === '---') { flushList(); result.push('<hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0;">'); continue; }

    // Empty line
    if (trimmed === '') { flushList(); continue; }

    // Normal paragraph
    flushList();
    result.push(`<p>${escapeHtml(trimmed).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/`(.+?)`/g, '<code>$1</code>')}</p>`);
  }

  flushList();
  if (inCodeBlock) result.push('</code></pre>');
  return result.join('\n');
}

export function generateClientReportHtml(blueprint: SolutionBlueprint, lang: Lang = Language.KO): string {
  const cp = blueprint.clientProposal;
  const L = reportLabels[lang];
  const htmlLang = lang === Language.KO ? 'ko' : 'en';

  let body = '';

  if (cp) {
    body = `
      <div style="text-align:center;margin-bottom:40px;">
        <h1>${L.clientTitle}</h1>
        <p class="subtitle">${L.clientSubtitle}</p>
      </div>

      <h2>${L.problem}</h2>
      <div class="section-card">
        <p>${escapeHtml(cp.problemStatement)}</p>
      </div>

      <h2>${L.solution}</h2>
      <div class="section-card" style="background:#eff6ff;border-color:#bfdbfe;">
        <p>${escapeHtml(cp.solutionOverview)}</p>
      </div>

      <h2>${L.keyFeatures}</h2>
      ${cp.keyFeatures.map(f => `<div class="feature-item"><span class="feature-check">&#10003;</span><span>${escapeHtml(f)}</span></div>`).join('\n')}

      <h2>${L.schedule}</h2>
      ${cp.milestones.map((m, i) => `
        <div class="milestone">
          <div class="milestone-num">${i + 1}</div>
          <div>
            <div class="milestone-phase">${escapeHtml(m.phase)} <span class="milestone-duration">${escapeHtml(m.duration)}</span></div>
            <div class="milestone-outcome">${escapeHtml(m.outcome)}</div>
          </div>
        </div>
      `).join('\n')}

      <h2>${L.calendarTimeline}</h2>
      <table>
        <thead><tr><th>#</th><th>${L.thPhase}</th><th>${L.thDuration}</th><th>${L.thOutcome}</th></tr></thead>
        <tbody>
          ${cp.milestones.map((m, i) => `<tr><td style="text-align:center;font-weight:700;color:#3b82f6;">${i + 1}</td><td><strong>${escapeHtml(m.phase)}</strong></td><td>${escapeHtml(m.duration)}</td><td>${escapeHtml(m.outcome)}</td></tr>`).join('\n')}
        </tbody>
      </table>

      <h2>${L.expectedOutcomes}</h2>
      <div class="section-card" style="background:#f0fdf4;border-color:#bbf7d0;">
        <p>${escapeHtml(cp.expectedOutcomes)}</p>
      </div>

      <h2>${L.investment}</h2>
      <p>${escapeHtml(cp.investmentSummary)}</p>

      <h2>${L.dataProtection}</h2>
      <p>${escapeHtml(cp.dataProtection)}</p>
    `;
  } else {
    body = `
      <div style="text-align:center;margin-bottom:40px;">
        <h1>${L.reportTitle}</h1>
        <p class="subtitle">${L.clientSubtitle}</p>
      </div>

      <h2>${L.analysisSummary}</h2>
      ${markdownToHtml(blueprint.analysisSummary)}

      <h2>${L.roadmap}</h2>
      <ol>${blueprint.roadmap.map(step => `<li>${escapeHtml(step)}</li>`).join('\n')}</ol>

      <h2>${L.estimatedROI}</h2>
      ${markdownToHtml(blueprint.estimatedROI)}

      <h2>${L.securityStrategy}</h2>
      ${markdownToHtml(blueprint.securityStrategy)}
    `;
  }

  if (blueprint.sources?.length) {
    const validSources = blueprint.sources.filter(s => {
      try { const u = new URL(s.uri); return u.protocol === 'https:' || u.protocol === 'http:'; } catch { return false; }
    });
    if (validSources.length > 0) {
      body += `<h2>${L.references}</h2><ul>${validSources.map(s => `<li><a href="${escapeHtml(s.uri)}" target="_blank">${escapeHtml(s.title)}</a></li>`).join('\n')}</ul>`;
    }
  }

  body += `<div class="footer">Architect Enterprise Builder</div>`;

  return `<!DOCTYPE html><html lang="${htmlLang}"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>${L.clientTitle}</title><style>${baseStyle}</style></head><body>${body}</body></html>`;
}

export function generateDeveloperReportHtml(blueprint: SolutionBlueprint, lang: Lang = Language.KO): string {
  const impl = blueprint.implementationPlan;
  const L = reportLabels[lang];
  const htmlLang = lang === Language.KO ? 'ko' : 'en';

  if (!impl) {
    return `<!DOCTYPE html><html lang="${htmlLang}"><head><meta charset="UTF-8"><title>${L.devTitle}</title><style>${baseStyle}</style></head><body><h1>${L.devTitle}</h1><p>${L.devNotReady}</p></body></html>`;
  }

  let body = `
    <div style="text-align:center;margin-bottom:40px;">
      <h1>${L.devTitle}</h1>
      <p class="subtitle">${L.devSubtitle}</p>
    </div>
  `;

  if (impl.prd) {
    body += `<h2>PRD (Product Requirements Document)</h2>${markdownToHtml(impl.prd)}`;
  }

  if (impl.lld) {
    body += `<h2>LLD (Low-Level Design)</h2>${markdownToHtml(impl.lld)}`;
  }

  if (impl.sprintPlan?.length) {
    body += `<h2>${L.sprintPlan}</h2>`;
    for (const sp of impl.sprintPlan) {
      body += `
        <h3>Sprint ${sp.sprint}: ${escapeHtml(sp.title)}</h3>
        <p><strong>${L.duration}:</strong> ${escapeHtml(sp.duration)}</p>
        <h4>${L.goals}</h4><ul>${sp.goals.map(g => `<li>${escapeHtml(g)}</li>`).join('')}</ul>
        <h4>${L.deliverables}</h4><ul>${sp.deliverables.map(d => `<li>${escapeHtml(d)}</li>`).join('')}</ul>
        ${sp.dependencies.length > 0 ? `<h4>${L.dependencies}</h4><ul>${sp.dependencies.map(d => `<li>${escapeHtml(d)}</li>`).join('')}</ul>` : ''}
      `;
    }
  }

  if (impl.projectStructure) {
    body += `<h2>${L.projectStructure}</h2><pre>${escapeHtml(impl.projectStructure)}</pre>`;
  }

  if (impl.techStack?.length) {
    body += `<h2>${L.techStack}</h2><table><thead><tr><th>${L.thCategory}</th><th>${L.thName}</th><th>${L.thVersion}</th><th>${L.thPurpose}</th></tr></thead><tbody>`;
    for (const t of impl.techStack) {
      body += `<tr><td>${escapeHtml(t.category)}</td><td><strong>${escapeHtml(t.name)}</strong></td><td>${escapeHtml(t.version)}</td><td>${escapeHtml(t.purpose)}</td></tr>`;
    }
    body += `</tbody></table>`;
  }

  if (impl.apiDesign?.length) {
    body += `<h2>${L.apiEndpoints}</h2><table><thead><tr><th>${L.thMethod}</th><th>${L.thPath}</th><th>${L.thDesc}</th><th>${L.thAuth}</th></tr></thead><tbody>`;
    for (const a of impl.apiDesign) {
      body += `<tr><td><span class="badge badge-method">${escapeHtml(a.method)}</span></td><td><code>${escapeHtml(a.path)}</code></td><td>${escapeHtml(a.description)}</td><td>${a.auth ? `<span class="badge badge-auth">${L.authRequired}</span>` : L.authPublic}</td></tr>`;
    }
    body += `</tbody></table>`;
    // Expanded API endpoint details
    for (const a of impl.apiDesign) {
      body += `<h3><span class="badge badge-method">${escapeHtml(a.method)}</span> <code>${escapeHtml(a.path)}</code></h3>`;
      body += `<p>${escapeHtml(a.description)}</p>`;
      if (a.requestBody) {
        body += `<h4>${lang === Language.KO ? '요청 본문' : 'Request Body'}</h4><pre>${escapeHtml(a.requestBody)}</pre>`;
      }
      if (a.responseBody) {
        body += `<h4>${lang === Language.KO ? '응답' : 'Response'}</h4><pre>${escapeHtml(a.responseBody)}</pre>`;
      }
      if (a.errorCodes && a.errorCodes.length > 0) {
        body += `<h4>${lang === Language.KO ? '에러 코드' : 'Error Codes'}</h4><ul>${a.errorCodes.map(c => `<li><code>${escapeHtml(c)}</code></li>`).join('')}</ul>`;
      }
    }
  }

  if (impl.databaseDesign?.length) {
    body += `<h2>${L.dbSchema}</h2>`;
    for (const table of impl.databaseDesign) {
      body += `<h3>${escapeHtml(table.name)}</h3><p>${escapeHtml(table.description)}</p>`;
      body += `<table><thead><tr><th>${L.thColumn}</th><th>${L.thType}</th><th>${L.thConstraint}</th></tr></thead><tbody>`;
      for (const c of table.columns) {
        body += `<tr><td><code>${escapeHtml(c.name)}</code></td><td>${escapeHtml(c.type)}</td><td>${escapeHtml(c.constraint)}</td></tr>`;
      }
      body += `</tbody></table>`;
    }
  }

  if (impl.keyModules?.length) {
    body += `<h2>${L.keyModules}</h2>`;
    for (const mod of impl.keyModules) {
      body += `<h3>${escapeHtml(mod.name)} <span style="font-size:12px;color:#94a3b8;font-weight:400;">${escapeHtml(mod.file)}</span></h3>`;
      body += `<p>${escapeHtml(mod.description)}</p>`;
      body += `<pre>${escapeHtml(mod.code)}</pre>`;
    }
  }

  if (impl.deploymentPlan) {
    body += `<h2>${L.deployPlan}</h2>${markdownToHtml(impl.deploymentPlan)}`;
  }

  if (impl.testingStrategy) {
    body += `<h2>${L.testStrategy}</h2>${markdownToHtml(impl.testingStrategy)}`;
  }

  body += `<h2>${L.roadmap}</h2><ol>${blueprint.roadmap.map(step => `<li>${escapeHtml(step)}</li>`).join('\n')}</ol>`;

  // Architecture diagrams (Mermaid source code)
  if (blueprint.architectureDiagram || blueprint.sequenceDiagram || blueprint.techStackGraph) {
    body += `<h2>${L.architectureDiagrams}</h2>`;
    body += `<p style="font-size:12px;color:#94a3b8;font-style:italic;">${L.mermaidNote}</p>`;
    if (blueprint.architectureDiagram) {
      body += `<h3>${L.systemArchitecture}</h3><pre>${escapeHtml(blueprint.architectureDiagram)}</pre>`;
    }
    if (blueprint.sequenceDiagram) {
      body += `<h3>${L.sequenceDiagram}</h3><pre>${escapeHtml(blueprint.sequenceDiagram)}</pre>`;
    }
    if (blueprint.techStackGraph) {
      body += `<h3>${L.techStackDiagram}</h3><pre>${escapeHtml(blueprint.techStackGraph)}</pre>`;
    }
  }

  // Analysis summary, ROI, security
  if (blueprint.analysisSummary) {
    body += `<h2>${L.analysisSummary}</h2>${markdownToHtml(blueprint.analysisSummary)}`;
  }

  if (blueprint.estimatedROI) {
    body += `<h2>${L.estimatedROI}</h2>${markdownToHtml(blueprint.estimatedROI)}`;
  }

  if (blueprint.securityStrategy) {
    body += `<h2>${L.securityStrategy}</h2>${markdownToHtml(blueprint.securityStrategy)}`;
  }

  body += `<div class="footer">Architect Enterprise Builder</div>`;

  return `<!DOCTYPE html><html lang="${htmlLang}"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>${L.devTitle}</title><style>${baseStyle}</style></head><body>${body}</body></html>`;
}

export function downloadHtml(html: string, filename: string) {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function printReport(html: string) {
  const win = window.open('', '_blank');
  if (win) {
    win.document.write(html);
    win.document.close();
    win.onload = () => win.print();
  }
}
