import type { SolutionBlueprint } from './geminiService';

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
  return md
    .split('\n')
    .map(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('#### ')) return `<h4>${escapeHtml(trimmed.slice(5))}</h4>`;
      if (trimmed.startsWith('### ')) return `<h3>${escapeHtml(trimmed.slice(4))}</h3>`;
      if (trimmed.startsWith('## ')) return `<h2>${escapeHtml(trimmed.slice(3))}</h2>`;
      if (trimmed.startsWith('# ')) return `<h1>${escapeHtml(trimmed.slice(2))}</h1>`;
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) return `<li>${escapeHtml(trimmed.slice(2))}</li>`;
      if (/^\d+\.\s/.test(trimmed)) return `<li>${escapeHtml(trimmed.replace(/^\d+\.\s/, ''))}</li>`;
      if (trimmed === '---') return '<hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0;">';
      if (trimmed === '') return '';
      return `<p>${escapeHtml(trimmed).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/`(.+?)`/g, '<code>$1</code>')}</p>`;
    })
    .join('\n');
}

export function generateClientReportHtml(blueprint: SolutionBlueprint): string {
  const cp = blueprint.clientProposal;
  const logo = blueprint.projectLogoBase64
    ? `<img src="data:image/png;base64,${blueprint.projectLogoBase64}" style="width:56px;height:56px;border-radius:12px;border:1px solid #e2e8f0;margin-bottom:16px;" />`
    : '';

  let body = '';

  if (cp) {
    body = `
      <div style="text-align:center;margin-bottom:40px;">
        ${logo}
        <h1>솔루션 제안서</h1>
        <p class="subtitle">AI 기반 맞춤 설계</p>
      </div>

      <h2>현재 겪고 계신 문제</h2>
      <div class="section-card">
        <p>${escapeHtml(cp.problemStatement)}</p>
      </div>

      <h2>우리의 해결 방안</h2>
      <div class="section-card" style="background:#eff6ff;border-color:#bfdbfe;">
        <p>${escapeHtml(cp.solutionOverview)}</p>
      </div>

      <h2>제공되는 핵심 기능</h2>
      ${cp.keyFeatures.map(f => `<div class="feature-item"><span class="feature-check">&#10003;</span><span>${escapeHtml(f)}</span></div>`).join('\n')}

      <h2>추진 일정</h2>
      ${cp.milestones.map((m, i) => `
        <div class="milestone">
          <div class="milestone-num">${i + 1}</div>
          <div>
            <div class="milestone-phase">${escapeHtml(m.phase)} <span class="milestone-duration">${escapeHtml(m.duration)}</span></div>
            <div class="milestone-outcome">${escapeHtml(m.outcome)}</div>
          </div>
        </div>
      `).join('\n')}

      <h2>도입 후 기대 효과</h2>
      <div class="section-card" style="background:#f0fdf4;border-color:#bbf7d0;">
        <p>${escapeHtml(cp.expectedOutcomes)}</p>
      </div>

      <h2>투자 대비 효과</h2>
      <p>${escapeHtml(cp.investmentSummary)}</p>

      <h2>데이터 보호 및 보안</h2>
      <p>${escapeHtml(cp.dataProtection)}</p>
    `;
  } else {
    body = `
      <div style="text-align:center;margin-bottom:40px;">
        ${logo}
        <h1>아키텍트 설계 보고서</h1>
        <p class="subtitle">AI 기반 맞춤 설계</p>
      </div>

      <h2>분석 요약</h2>
      ${markdownToHtml(blueprint.analysisSummary)}

      <h2>실행 로드맵</h2>
      <ol>${blueprint.roadmap.map(step => `<li>${escapeHtml(step)}</li>`).join('\n')}</ol>

      <h2>예상 ROI</h2>
      ${markdownToHtml(blueprint.estimatedROI)}

      <h2>보안 전략</h2>
      ${markdownToHtml(blueprint.securityStrategy)}
    `;
  }

  if (blueprint.sources?.length) {
    const validSources = blueprint.sources.filter(s => {
      try { const u = new URL(s.uri); return u.protocol === 'https:' || u.protocol === 'http:'; } catch { return false; }
    });
    if (validSources.length > 0) {
      body += `<h2>참고 자료</h2><ul>${validSources.map(s => `<li><a href="${escapeHtml(s.uri)}" target="_blank">${escapeHtml(s.title)}</a></li>`).join('\n')}</ul>`;
    }
  }

  body += `<div class="footer">Architect Enterprise Builder</div>`;

  return `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>솔루션 제안서</title><style>${baseStyle}</style></head><body>${body}</body></html>`;
}

export function generateDeveloperReportHtml(blueprint: SolutionBlueprint): string {
  const impl = blueprint.implementationPlan;
  if (!impl) {
    return `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><title>개발 문서</title><style>${baseStyle}</style></head><body><h1>개발 문서</h1><p>구현 계획이 아직 생성되지 않았습니다.</p></body></html>`;
  }

  let body = `
    <div style="text-align:center;margin-bottom:40px;">
      <h1>개발 설계 문서</h1>
      <p class="subtitle">Architecture &amp; Implementation Plan</p>
    </div>
  `;

  // PRD
  if (impl.prd) {
    body += `<h2>PRD (Product Requirements Document)</h2>${markdownToHtml(impl.prd)}`;
  }

  // LLD
  if (impl.lld) {
    body += `<h2>LLD (Low-Level Design)</h2>${markdownToHtml(impl.lld)}`;
  }

  // Sprint Plan
  if (impl.sprintPlan?.length) {
    body += `<h2>스프린트 계획</h2>`;
    for (const sp of impl.sprintPlan) {
      body += `
        <h3>Sprint ${sp.sprint}: ${escapeHtml(sp.title)}</h3>
        <p><strong>기간:</strong> ${escapeHtml(sp.duration)}</p>
        <h4>목표</h4><ul>${sp.goals.map(g => `<li>${escapeHtml(g)}</li>`).join('')}</ul>
        <h4>산출물</h4><ul>${sp.deliverables.map(d => `<li>${escapeHtml(d)}</li>`).join('')}</ul>
        ${sp.dependencies.length > 0 ? `<h4>의존성</h4><ul>${sp.dependencies.map(d => `<li>${escapeHtml(d)}</li>`).join('')}</ul>` : ''}
      `;
    }
  }

  // Project Structure
  if (impl.projectStructure) {
    body += `<h2>프로젝트 구조</h2><pre>${escapeHtml(impl.projectStructure)}</pre>`;
  }

  // Tech Stack
  if (impl.techStack?.length) {
    body += `<h2>기술 스택</h2><table><thead><tr><th>분류</th><th>이름</th><th>버전</th><th>목적</th></tr></thead><tbody>`;
    for (const t of impl.techStack) {
      body += `<tr><td>${escapeHtml(t.category)}</td><td><strong>${escapeHtml(t.name)}</strong></td><td>${escapeHtml(t.version)}</td><td>${escapeHtml(t.purpose)}</td></tr>`;
    }
    body += `</tbody></table>`;
  }

  // API Design
  if (impl.apiDesign?.length) {
    body += `<h2>API 엔드포인트</h2><table><thead><tr><th>메서드</th><th>경로</th><th>설명</th><th>인증</th></tr></thead><tbody>`;
    for (const a of impl.apiDesign) {
      body += `<tr><td><span class="badge badge-method">${escapeHtml(a.method)}</span></td><td><code>${escapeHtml(a.path)}</code></td><td>${escapeHtml(a.description)}</td><td>${a.auth ? '<span class="badge badge-auth">필요</span>' : '공개'}</td></tr>`;
    }
    body += `</tbody></table>`;
  }

  // DB Schema
  if (impl.databaseDesign?.length) {
    body += `<h2>데이터베이스 스키마</h2>`;
    for (const table of impl.databaseDesign) {
      body += `<h3>${escapeHtml(table.name)}</h3><p>${escapeHtml(table.description)}</p>`;
      body += `<table><thead><tr><th>컬럼</th><th>타입</th><th>제약</th></tr></thead><tbody>`;
      for (const c of table.columns) {
        body += `<tr><td><code>${escapeHtml(c.name)}</code></td><td>${escapeHtml(c.type)}</td><td>${escapeHtml(c.constraint)}</td></tr>`;
      }
      body += `</tbody></table>`;
    }
  }

  // Key Modules
  if (impl.keyModules?.length) {
    body += `<h2>핵심 모듈</h2>`;
    for (const mod of impl.keyModules) {
      body += `<h3>${escapeHtml(mod.name)} <span style="font-size:12px;color:#94a3b8;font-weight:400;">${escapeHtml(mod.file)}</span></h3>`;
      body += `<p>${escapeHtml(mod.description)}</p>`;
      body += `<pre>${escapeHtml(mod.code)}</pre>`;
    }
  }

  // Deploy
  if (impl.deploymentPlan) {
    body += `<h2>배포 계획</h2>${markdownToHtml(impl.deploymentPlan)}`;
  }

  // Testing
  if (impl.testingStrategy) {
    body += `<h2>테스트 전략</h2>${markdownToHtml(impl.testingStrategy)}`;
  }

  // Roadmap
  body += `<h2>실행 로드맵</h2><ol>${blueprint.roadmap.map(step => `<li>${escapeHtml(step)}</li>`).join('\n')}</ol>`;

  body += `<div class="footer">Architect Enterprise Builder</div>`;

  return `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>개발 설계 문서</title><style>${baseStyle}</style></head><body>${body}</body></html>`;
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
