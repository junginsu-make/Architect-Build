
import { Type } from "@google/genai";
import { Language } from "../types";
import { getGeminiClient, checkApiKey } from "./geminiClient";
import type { ImplementationPlan } from "./claudeService";

function getAI() {
  return getGeminiClient();
}

export interface MeetingTopic {
    title: string;
    summary: string;
    speakers: string;
}

export interface MeetingMinutes {
    meetingTitle: string;
    overview: string;
    keyTopics: MeetingTopic[];
    requirements: string[];
    actionItems: string[];
    designKeywords: {
        background: string;
        model: string;
        process: string;
        tech: string;
        goal: string;
    };
}

export interface FollowUpQuestion {
    question: string;
    examples: string[];
    suggestion: string;
}

export interface GroundingSource {
    title: string;
    uri: string;
}

export interface ClientMilestone {
    phase: string;
    duration: string;
    outcome: string;
}

export interface ClientProposal {
    problemStatement: string;
    solutionOverview: string;
    keyFeatures: string[];
    milestones: ClientMilestone[];
    expectedOutcomes: string;
    dataProtection: string;
    investmentSummary: string;
}

export interface SolutionBlueprint {
    roadmap: string[];
    architectureDiagram: string;
    sequenceDiagram: string;
    techStackGraph: string;
    analysisSummary: string;
    estimatedROI: string;
    securityStrategy: string;
    projectLogoBase64?: string;
    sources?: GroundingSource[];
    clientProposal?: ClientProposal;
    implementationPlan?: ImplementationPlan;
}

export type EnterpriseQuestionType = 'COMPANY_CONTEXT' | 'SOLUTION_MODEL' | 'MODULE_LOGIC' | 'TECH_INTEGRATION' | 'BUSINESS_GOAL';

export interface DocumentAnalysis {
  title: string;
  overview: string;
  businessBackground: string;
  systemModel: string;
  workProcess: string;
  techEnvironment: string;
  finalGoal: string;
  keyFindings: string[];
  dataGaps: string[];
  designKeywords: {
    background: string;
    model: string;
    process: string;
    tech: string;
    goal: string;
  };
}

export const analyzeDocument = async (
  data: string,
  mimeType: string,
  lang: Language = Language.KO,
): Promise<DocumentAnalysis> => {
  checkApiKey(lang);
  const langText = lang === Language.KO ? "모든 내용을 한국어로 작성하세요." : "Write everything in English.";

  const prompt = `당신은 시니어 비즈니스 분석 전문가입니다. 제공된 문서를 처음부터 끝까지 빠짐없이 정밀하게 읽고, 시스템 설계에 필요한 핵심 요소를 추출하여 JSON으로 작성하세요.

${langText}

문서가 길더라도 전체 내용을 분석하세요. 각 필드 작성 지침:

- title: 문서의 핵심 주제를 한 줄로 요약
- overview: 전체 문서 내용을 3~5문장으로 요약 (핵심 맥락과 목적 포함)
- businessBackground: 비즈니스 배경 및 현재 문제점 (문서에서 직접 추출, 없으면 "정보 없음")
- systemModel: 도입 희망하는 시스템/솔루션 모델 (SaaS, 관리 도구, 모바일 앱 등. 없으면 "정보 없음")
- workProcess: 현재 업무 프로세스 또는 시스템 도입 후 기대 프로세스 (없으면 "정보 없음")
- techEnvironment: 기존 기술 환경, 사용 도구, 연동 필요 시스템 (없으면 "정보 없음")
- finalGoal: 최종 비즈니스 목표 및 성공 지표 (없으면 "정보 없음")
- keyFindings: 문서에서 발견한 설계에 중요한 핵심 사항들 (최소 3개, 최대 10개)
- dataGaps: 문서에 누락되어 있어 추가 확인이 필요한 정보 (설계에 필요하지만 문서에 없는 것)
- designKeywords: 시스템 설계에 바로 반영할 5가지 핵심 키워드
  - background: 비즈니스 배경 한 줄 요약
  - model: 시스템 모델 한 줄 요약
  - process: 핵심 프로세스 한 줄 요약
  - tech: 기술 환경 한 줄 요약
  - goal: 최종 목표 한 줄 요약

추출된 정보가 문서에 없으면 추측하지 말고 반드시 "정보 없음"으로 표시하세요.`;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      overview: { type: Type.STRING },
      businessBackground: { type: Type.STRING },
      systemModel: { type: Type.STRING },
      workProcess: { type: Type.STRING },
      techEnvironment: { type: Type.STRING },
      finalGoal: { type: Type.STRING },
      keyFindings: { type: Type.ARRAY, items: { type: Type.STRING } },
      dataGaps: { type: Type.ARRAY, items: { type: Type.STRING } },
      designKeywords: {
        type: Type.OBJECT,
        properties: {
          background: { type: Type.STRING },
          model: { type: Type.STRING },
          process: { type: Type.STRING },
          tech: { type: Type.STRING },
          goal: { type: Type.STRING },
        },
        required: ["background", "model", "process", "tech", "goal"],
      },
    },
    required: ["title", "overview", "businessBackground", "systemModel", "workProcess", "techEnvironment", "finalGoal", "keyFindings", "dataGaps", "designKeywords"],
  };

  // Build content parts based on mimeType
  const parts: any[] = [];
  if (mimeType === 'text/plain') {
    // For plain text, decode base64 and send as text part directly (more reliable)
    try {
      const text = decodeURIComponent(escape(atob(data)));
      parts.push({ text: text });
    } catch {
      // Fallback to inlineData if decoding fails
      parts.push({ inlineData: { data, mimeType } });
    }
  } else {
    parts.push({ inlineData: { data, mimeType } });
  }
  parts.push({ text: prompt });

  try {
    const response = await getAI().models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts }],
      config: {
        responseMimeType: 'application/json',
        responseSchema,
      },
    });
    try {
      return JSON.parse(response.text?.trim() ?? '{}') as DocumentAnalysis;
    } catch {
      throw new Error('문서 분석 결과를 파싱할 수 없습니다.');
    }
  } catch (error) {
    console.error("Doc Analysis Error:", error);
    throw error;
  }
};

export const analyzeAudio = async (base64Data: string, mimeType: string, lang: Language = Language.KO): Promise<MeetingMinutes> => {
  checkApiKey(lang);
  const langText = lang === Language.KO
    ? "모든 내용을 한국어로 작성하세요."
    : "Write everything in English.";

  const prompt = `당신은 시니어 비즈니스 애널리스트입니다. 제공된 음성 데이터를 듣고 전문적인 비즈니스 회의록을 JSON으로 작성하세요.

${langText}

단순히 말을 받아적지 말고, 비즈니스 관점에서 재구성하여 전문적인 톤으로 작성하세요.

각 필드 설명:
- meetingTitle: 회의 주제를 한 줄로 정의 (예: "물류 관리 시스템 도입 논의")
- overview: 회의 전체 내용을 2~3문장으로 요약
- keyTopics: 주요 논의된 안건들 (최소 3개). 각 안건의 title(안건명), summary(논의 내용 요약), speakers(발언자 또는 "참석자")
- requirements: 회의에서 도출된 핵심 요구사항 목록 (구체적이고 실행 가능한 항목)
- actionItems: 후속 조치 사항 (누가 무엇을 할지)
- designKeywords: 시스템 설계에 반영할 5가지 핵심 요소
  - background: 비즈니스 배경 및 현재 문제점
  - model: 도입 희망 시스템 모델 (SaaS, 관리자 도구, 모바일 앱 등)
  - process: 핵심 업무 프로세스 및 사용자 흐름
  - tech: 기술 환경 및 연동 필요 시스템
  - goal: 최종 비즈니스 목표 및 성공 지표`;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      meetingTitle: { type: Type.STRING },
      overview: { type: Type.STRING },
      keyTopics: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            summary: { type: Type.STRING },
            speakers: { type: Type.STRING },
          },
          required: ["title", "summary", "speakers"],
        },
      },
      requirements: { type: Type.ARRAY, items: { type: Type.STRING } },
      actionItems: { type: Type.ARRAY, items: { type: Type.STRING } },
      designKeywords: {
        type: Type.OBJECT,
        properties: {
          background: { type: Type.STRING },
          model: { type: Type.STRING },
          process: { type: Type.STRING },
          tech: { type: Type.STRING },
          goal: { type: Type.STRING },
        },
        required: ["background", "model", "process", "tech", "goal"],
      },
    },
    required: ["meetingTitle", "overview", "keyTopics", "requirements", "actionItems", "designKeywords"],
  };

  try {
    const response = await getAI().models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [
        {
          parts: [
            { inlineData: { data: base64Data, mimeType } },
            { text: prompt },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema,
      },
    });
    try {
      return JSON.parse(response.text?.trim() ?? '{}') as MeetingMinutes;
    } catch {
      throw new Error('회의록 분석 결과를 파싱할 수 없습니다.');
    }
  } catch (error) {
    console.error("Audio Analysis Error:", error);
    throw new Error("음성 분석에 실패했습니다.");
  }
};

export const generateFollowUpQuestion = async (
    questionType: EnterpriseQuestionType,
    userResponses: string[],
    lang: Language = Language.KO,
    additionalContext: string[] = []
): Promise<FollowUpQuestion> => {
    checkApiKey(lang);
    const langText = lang === Language.KO ? "한국어로 답변해 주세요." : "Please answer in English.";
    let prompt = '';
    const baseInstruction = `당신은 시니어 솔루션 아키텍트이자 IT 컨설턴트입니다. ${langText}`;
    const contextInfo = additionalContext.length > 0 ? `\n추가 컨텍스트(문서/음성 분석): ${additionalContext.join(' | ')}` : '';

    switch (questionType) {
        case 'SOLUTION_MODEL':
            prompt = `${baseInstruction} 맥락: 사용자가 운영하는 사업과 고충("${userResponses[0]}")을 기반으로, 어떤 '시스템 모델'(SaaS, Admin, Bot 등)이 가장 적합할지 제안하듯 질문하세요.${contextInfo}`;
            break;
        case 'MODULE_LOGIC':
            prompt = `${baseInstruction} 맥락: 선택된 모델("${userResponses[1]}")에서 실제 '사용자'가 '어떤 프로세스'로 업무를 처리할지 구체적으로 물어보세요.${contextInfo}`;
            break;
        case 'TECH_INTEGRATION':
            prompt = `${baseInstruction} 맥락: 업무 시나리오("${userResponses[2]}")를 구현하기 위해 현재 사용 중인 도구(엑셀, ERP 등)가 있는지 질문하세요.${contextInfo}`;
            break;
        case 'BUSINESS_GOAL':
            prompt = `${baseInstruction} 맥락: 환경("${userResponses[3]}")이 파악되었습니다. 마지막으로 얻고자 하는 '성과 지표'(KPI)를 물어보세요.${contextInfo}`;
            break;
    }

    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            question: { type: Type.STRING },
            examples: { type: Type.ARRAY, items: { type: Type.STRING } },
            suggestion: { type: Type.STRING }
        },
        required: ["question", "examples", "suggestion"]
    };

    try {
        const response = await getAI().models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: responseSchema,
            },
        });
        try {
            return JSON.parse(response.text?.trim() ?? '{}') as FollowUpQuestion;
        } catch {
            throw new Error('AI 응답을 파싱할 수 없습니다.');
        }
    } catch (error) {
        console.error("Error:", error);
        throw error;
    }
};

export const generateSolutionBlueprint = async (
  userResponses: string[],
  lang: Language = Language.KO,
  additionalContext: string[] = []
): Promise<SolutionBlueprint> => {
  checkApiKey(lang);
  const [background, model, process, tech, goal] = userResponses;
  const langText = lang === Language.KO ? "한국어로 작성하세요." : "Please write in English.";

  const blueprintPrompt = `
당신은 시니어 엔터프라이즈 아키텍트입니다. 아래 사용자의 요구사항을 최우선으로 반영하여 설계 결과를 JSON으로 작성하세요. ${langText}

[사용자 요구사항 — 이것이 설계의 핵심]
1. 비즈니스 배경: ${background}
2. 희망 모델: ${model}
3. 상세 프로세스: ${process}
4. 기존 기술 스택 및 제약: ${tech}
5. 최종 KPI 목표: ${goal}
${additionalContext.length > 0 ? `\n[추가 컨텍스트]\n${additionalContext.join('\n')}` : ''}

[설계 원칙]
- 사용자의 프로세스와 목표를 그대로 설계에 반영하세요.
- 기술 스택은 사용자 기존 환경(${tech})과의 호환성을 최우선으로 선정하세요.
- 로드맵의 각 단계에 산출물과 소요 기간을 명시하세요.
- 아키텍처는 실제 개발팀이 즉시 착수할 수 있는 수준으로 작성하세요.
- 다이어그램은 Mermaid.js 형식, 한국어 노드명, 실제 기술명 포함하세요.
- **중요**: estimatedROI 등 모든 필드에서 검증되지 않은 가상 수치(%, 금액, 배수, 회수 기간 등)를 절대 사용하지 마세요. "업무 효율화", "운영 비용 절감 기대", "생산성 향상" 등 정성적 표현만 사용하세요.

[클라이언트 제안서 작성 지침 — clientProposal]
클라이언트(비개발자)가 읽는 제안서입니다. 반드시 다음을 지키세요:
- 기술 용어, 라이브러리명, 프레임워크명을 절대 사용하지 마세요
- "귀사의 문제 A를 B 방식으로 해결하여 C 효과를 달성합니다" 형태로 서술하세요
- problemStatement: 클라이언트가 겪는 문제를 공감하며 정리 (2~3문장)
- solutionOverview: 해결 방안을 쉬운 말로 서술 (기술명 없이, "자동화 시스템", "맞춤형 관리 도구" 등의 표현 사용)
- keyFeatures: 핵심 기능 5~7개를 비즈니스 가치 중심으로 ("주문 자동 처리", "실시간 매출 현황판" 등)
- milestones: 월별 또는 분기별 추진 일정 (기술 세부사항 없이, "시스템 기본 구축", "실무 테스트" 등)
- expectedOutcomes: 도입 후 기대 효과를 정성적으로 서술 ("업무 효율화 증가", "반복 작업 자동화로 핵심 업무 집중 가능", "데이터 기반 의사결정 체계 구축" 등). 절대로 검증되지 않은 구체적 수치(%, 금액, 배수 등)를 사용하지 마세요. "ROI 100%", "처리 시간 50% 단축", "인건비 월 200만원 절감" 같은 가상 수치는 금지입니다.
- dataProtection: 보안/데이터 보호를 쉬운 말로 ("모든 데이터는 암호화되어 안전하게 보관됩니다" 수준)
- investmentSummary: 투자 대비 효과를 정성적으로 요약. 검증되지 않은 금액, 퍼센트, 회수 기간 등 가상 수치를 절대 포함하지 마세요. "비용 절감 효과가 기대됩니다", "장기적으로 운영 효율이 향상됩니다" 수준으로 작성하세요.

[참고용 웹 조사 — 보조]
최신 기술 버전(2026), 외부 API/플랫폼, 보안 표준 확인에만 사용하세요.
`;

  const schema = {
    type: Type.OBJECT,
    properties: {
      roadmap: { type: Type.ARRAY, items: { type: Type.STRING } },
      architectureDiagram: { type: Type.STRING },
      sequenceDiagram: { type: Type.STRING },
      techStackGraph: { type: Type.STRING },
      analysisSummary: { type: Type.STRING },
      estimatedROI: { type: Type.STRING },
      securityStrategy: { type: Type.STRING },
      clientProposal: {
        type: Type.OBJECT,
        properties: {
          problemStatement: { type: Type.STRING },
          solutionOverview: { type: Type.STRING },
          keyFeatures: { type: Type.ARRAY, items: { type: Type.STRING } },
          milestones: { type: Type.ARRAY, items: {
            type: Type.OBJECT,
            properties: {
              phase: { type: Type.STRING },
              duration: { type: Type.STRING },
              outcome: { type: Type.STRING }
            },
            required: ["phase", "duration", "outcome"]
          }},
          expectedOutcomes: { type: Type.STRING },
          dataProtection: { type: Type.STRING },
          investmentSummary: { type: Type.STRING }
        },
        required: ["problemStatement", "solutionOverview", "keyFeatures", "milestones", "expectedOutcomes", "dataProtection", "investmentSummary"]
      }
    },
    required: ["roadmap", "architectureDiagram", "sequenceDiagram", "techStackGraph", "analysisSummary", "estimatedROI", "securityStrategy", "clientProposal"]
  };

  try {
    const blueprintResponse = await getAI().models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: blueprintPrompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: 'application/json',
        responseSchema: schema,
      }
    });

    let blueprint: SolutionBlueprint;
    try {
      blueprint = JSON.parse(blueprintResponse.text?.trim() ?? '{}') as SolutionBlueprint;
    } catch {
      throw new Error('AI 응답을 파싱할 수 없습니다.');
    }

    // Extract Grounding Sources
    const chunks = blueprintResponse.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
        blueprint.sources = chunks
            .filter((c: any) => c.web)
            .map((c: any) => ({ title: c.web.title, uri: c.web.uri }));
    }

    // Generate Project Logo
    try {
        const logoPrompt = `Create a professional, modern, minimalist enterprise software logo for a project with the following background: "${background}". The style should be clean, high-tech, and suitable for a SaaS landing page. Use a white background. No text inside the logo if possible.`;
        const logoResponse = await getAI().models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: [{ parts: [{ text: logoPrompt }] }]
        });

        if (logoResponse.candidates?.[0]?.content?.parts) {
            for (const part of logoResponse.candidates[0].content.parts) {
                if (part.inlineData) {
                    blueprint.projectLogoBase64 = part.inlineData.data;
                    break;
                }
            }
        }
    } catch (logoError) {
        console.warn("Logo generation skipped or failed:", logoError);
    }

    return blueprint;
  } catch (error) {
    console.error("Blueprint Error:", error);
    throw error;
  }
};

export const generateContinuingChat = async (
  userResponses: string[],
  newMessage: string,
  lang: Language = Language.KO,
  additionalContext: string[] = []
): Promise<string> => {
  checkApiKey(lang);
  const langText = lang === Language.KO ? "한국어로 답변해 주세요." : "Please answer in English.";
  const contextInfo = additionalContext.length > 0 ? ` 추가 컨텍스트: ${additionalContext.join(' | ')}.` : '';
  const prompt = `당신은 솔루션 컨설턴트입니다. 맥락: ${userResponses.join(' | ')}.${contextInfo} 질문: "${newMessage}". ${langText}`;

  try {
    const response = await getAI().models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
    return response.text ?? '';
  } catch (error) {
    console.error("Chat Error:", error);
    throw error;
  }
};
