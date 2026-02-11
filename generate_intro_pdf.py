"""
Architect Enterprise Builder - System Introduction Document PDF Generator
"""
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor, white, black
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, HRFlowable
from reportlab.lib.styles import ParagraphStyle
import os

# ── Colors ──
DARK = HexColor("#0f172a")
BLUE = HexColor("#2563eb")
BLUE_LIGHT = HexColor("#eff6ff")
BLUE_MID = HexColor("#3b82f6")
SLATE = HexColor("#475569")
SLATE_LIGHT = HexColor("#94a3b8")
SLATE_BG = HexColor("#f8fafc")
GREEN = HexColor("#059669")
PURPLE = HexColor("#7c3aed")
ORANGE = HexColor("#ea580c")
WHITE = HexColor("#ffffff")
BORDER = HexColor("#e2e8f0")

# ── Font Registration ──
# Try to use Malgun Gothic (Windows Korean font)
font_registered = False
for font_path in [
    "C:/Windows/Fonts/malgunbd.ttf",
    "C:/Windows/Fonts/malgun.ttf",
]:
    if os.path.exists(font_path):
        try:
            pdfmetrics.registerFont(TTFont("Korean", font_path))
            font_registered = True
            break
        except:
            pass

if not font_registered:
    # Fallback
    pdfmetrics.registerFont(TTFont("Korean", "C:/Windows/Fonts/gulim.ttc", subfontIndex=0))

BOLD_FONT = "Korean"
NORMAL_FONT = "Korean"

# Try bold variant
for bold_path in ["C:/Windows/Fonts/malgunbd.ttf"]:
    if os.path.exists(bold_path):
        try:
            pdfmetrics.registerFont(TTFont("KoreanBold", bold_path))
            BOLD_FONT = "KoreanBold"
            break
        except:
            pass

# ── Styles ──
def make_style(name, font=None, size=10, color=DARK, leading=16, align=TA_LEFT, space_before=0, space_after=0, bold=False):
    f = BOLD_FONT if bold else (font or NORMAL_FONT)
    return ParagraphStyle(
        name=name,
        fontName=f,
        fontSize=size,
        textColor=color,
        leading=leading,
        alignment=align,
        spaceBefore=space_before,
        spaceAfter=space_after,
    )

style_cover_title = make_style("CoverTitle", size=28, color=DARK, leading=36, bold=True, align=TA_CENTER)
style_cover_sub = make_style("CoverSub", size=14, color=BLUE, leading=20, align=TA_CENTER)
style_cover_desc = make_style("CoverDesc", size=11, color=SLATE, leading=18, align=TA_CENTER)

style_h1 = make_style("H1", size=20, color=DARK, leading=28, bold=True, space_before=10, space_after=8)
style_h2 = make_style("H2", size=14, color=BLUE, leading=20, bold=True, space_before=16, space_after=6)
style_h3 = make_style("H3", size=12, color=DARK, leading=18, bold=True, space_before=10, space_after=4)

style_body = make_style("Body", size=10, color=SLATE, leading=17, align=TA_JUSTIFY, space_after=4)
style_body_dark = make_style("BodyDark", size=10, color=DARK, leading=17, align=TA_JUSTIFY, space_after=4)
style_bullet = make_style("Bullet", size=10, color=SLATE, leading=17, space_after=2)
style_small = make_style("Small", size=9, color=SLATE_LIGHT, leading=14)
style_badge = make_style("Badge", size=9, color=BLUE, leading=14, bold=True)
style_footer = make_style("Footer", size=8, color=SLATE_LIGHT, leading=12, align=TA_CENTER)
style_caption = make_style("Caption", size=9, color=SLATE, leading=14, align=TA_CENTER, space_before=4)

style_table_header = make_style("TableHeader", size=9, color=WHITE, leading=14, bold=True, align=TA_CENTER)
style_table_body = make_style("TableBody", size=9, color=DARK, leading=14)

# ── Page template ──
def draw_page(canvas_obj, doc):
    w, h = A4
    # Header line
    canvas_obj.setStrokeColor(BLUE)
    canvas_obj.setLineWidth(2)
    canvas_obj.line(25*mm, h - 15*mm, w - 25*mm, h - 15*mm)
    # Header text
    canvas_obj.setFont(BOLD_FONT, 7)
    canvas_obj.setFillColor(SLATE_LIGHT)
    canvas_obj.drawString(25*mm, h - 13*mm, "Architect Enterprise Builder  |  System Introduction")
    # Footer
    canvas_obj.setFont(NORMAL_FONT, 7)
    canvas_obj.setFillColor(SLATE_LIGHT)
    canvas_obj.drawCentredString(w/2, 12*mm, f"Confidential  |  Page {doc.page}")
    # Footer line
    canvas_obj.setStrokeColor(BORDER)
    canvas_obj.setLineWidth(0.5)
    canvas_obj.line(25*mm, 16*mm, w - 25*mm, 16*mm)

def draw_cover(canvas_obj, doc):
    pass  # No header/footer on cover

# ── Helper functions ──
def bullet(text, style=style_bullet):
    return Paragraph(f"&bull;&nbsp;&nbsp;{text}", style)

def numbered(num, text, style=style_bullet):
    return Paragraph(f"<b>{num}.</b>&nbsp;&nbsp;{text}", style)

def section_divider():
    return HRFlowable(width="100%", thickness=0.5, color=BORDER, spaceBefore=8, spaceAfter=8)

def info_box(title, text):
    """Create a styled info box as a table"""
    data = [[Paragraph(f"<b>{title}</b>", make_style("BoxTitle", size=10, color=BLUE, bold=True, leading=16)),],
            [Paragraph(text, make_style("BoxBody", size=9, color=SLATE, leading=15))]]
    t = Table(data, colWidths=[150*mm])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), BLUE_LIGHT),
        ('BOX', (0,0), (-1,-1), 0.5, BLUE_MID),
        ('TOPPADDING', (0,0), (-1,0), 8),
        ('BOTTOMPADDING', (0,-1), (-1,-1), 8),
        ('LEFTPADDING', (0,0), (-1,-1), 12),
        ('RIGHTPADDING', (0,0), (-1,-1), 12),
    ]))
    return t

# ══════════════════════════════════════
#  BUILD DOCUMENT
# ══════════════════════════════════════
output_path = os.path.join(os.path.dirname(__file__), "Architect_System_Introduction.pdf")

doc = SimpleDocTemplate(
    output_path,
    pagesize=A4,
    topMargin=22*mm,
    bottomMargin=22*mm,
    leftMargin=25*mm,
    rightMargin=25*mm,
)

story = []

# ═══════════════════════════════════
#  COVER PAGE
# ═══════════════════════════════════
story.append(Spacer(1, 60*mm))
story.append(Paragraph("Architect", make_style("LogoText", size=42, color=DARK, leading=50, bold=True, align=TA_CENTER)))
story.append(Paragraph("Enterprise Builder", make_style("LogoSub", size=18, color=BLUE, leading=24, bold=True, align=TA_CENTER)))
story.append(Spacer(1, 15*mm))
story.append(HRFlowable(width="40%", thickness=2, color=BLUE, spaceBefore=0, spaceAfter=0))
story.append(Spacer(1, 15*mm))
story.append(Paragraph("AI 기반 엔터프라이즈 솔루션 설계 시스템", make_style("CoverTag", size=16, color=DARK, leading=24, bold=True, align=TA_CENTER)))
story.append(Spacer(1, 8*mm))
story.append(Paragraph("시스템 소개서", make_style("CoverDocType", size=14, color=SLATE, leading=20, align=TA_CENTER)))
story.append(Spacer(1, 30*mm))
story.append(Paragraph("비즈니스 요구사항 분석부터 기술 설계서 생성까지", style_cover_desc))
story.append(Paragraph("AI가 전문 컨설턴트처럼 설계하는 올인원 솔루션", style_cover_desc))
story.append(Spacer(1, 20*mm))
story.append(Paragraph("2026", make_style("Year", size=11, color=SLATE_LIGHT, leading=14, align=TA_CENTER)))

story.append(PageBreak())

# ═══════════════════════════════════
#  TABLE OF CONTENTS
# ═══════════════════════════════════
story.append(Paragraph("목차", style_h1))
story.append(Spacer(1, 5*mm))

toc_items = [
    ("1", "시스템 개요", "Architect Enterprise Builder란?"),
    ("2", "핵심 기능", "AI 진단 대화, 문서/음성 분석, 설계 자동 생성"),
    ("3", "작동 방식", "5단계 진단 대화 → 병렬 AI 생성 → 이중 결과물"),
    ("4", "결과물 상세", "클라이언트 제안서 & 개발자 기술 설계서"),
    ("5", "다국어 지원", "한국어/영어 실시간 전환 및 콘텐츠 번역"),
    ("6", "내보내기 기능", "HTML, ZIP, JSON, 인쇄 지원"),
    ("7", "AI 기술 구성", "Google Gemini + Anthropic Claude 이중 AI"),
    ("8", "활용 시나리오", "누가, 언제, 어떻게 사용하나?"),
]

for num, title, desc in toc_items:
    story.append(Paragraph(f"<b>{num}. {title}</b>", make_style("TOCTitle", size=11, color=DARK, leading=18, bold=True)))
    story.append(Paragraph(f"&nbsp;&nbsp;&nbsp;&nbsp;{desc}", make_style("TOCDesc", size=9, color=SLATE, leading=14, space_after=6)))

story.append(PageBreak())

# ═══════════════════════════════════
#  1. SYSTEM OVERVIEW
# ═══════════════════════════════════
story.append(Paragraph("1. 시스템 개요", style_h1))
story.append(section_divider())

story.append(Paragraph(
    "Architect Enterprise Builder는 <b>AI 기반 엔터프라이즈 솔루션 설계 시스템</b>입니다. "
    "사업을 운영하면서 '우리 회사에 맞는 시스템을 만들고 싶은데, 어디서부터 시작해야 할지 모르겠다'는 "
    "고민을 가진 분들을 위해 만들어졌습니다.",
    style_body_dark
))
story.append(Spacer(1, 3*mm))
story.append(Paragraph(
    "전문 IT 컨설턴트가 하는 일을 AI가 대신합니다. 사업 현황과 고민을 대화로 알려주시면, "
    "AI가 분석하여 <b>클라이언트용 사업 제안서</b>와 <b>개발팀용 기술 설계서</b>를 동시에 생성합니다.",
    style_body_dark
))

story.append(Spacer(1, 5*mm))
story.append(info_box(
    "한 줄 요약",
    "대화만으로 비즈니스 요구사항을 분석하고, 전문가 수준의 제안서와 기술 설계서를 자동으로 만들어주는 AI 설계 도구입니다."
))

story.append(Spacer(1, 6*mm))
story.append(Paragraph("핵심 가치", style_h2))

values = [
    ("전문가 없이도 전문가 수준의 설계", "IT 전문가나 컨설턴트가 없어도, AI가 체계적인 질문을 통해 요구사항을 정밀하게 파악하고 전문적인 설계 결과물을 제공합니다."),
    ("대화만으로 완성", "복잡한 양식을 채울 필요 없이, 자연스러운 대화를 통해 5가지 핵심 요소를 수집합니다. 문서 첨부나 회의 녹음도 지원합니다."),
    ("이중 결과물 동시 생성", "사업주가 보는 제안서와 개발팀이 보는 기술 문서를 한 번에 생성합니다. 같은 내용을 두 가지 관점으로 제공하여 소통 비용을 줄입니다."),
    ("한국어/영어 자유 전환", "모든 결과물을 한국어와 영어로 즉시 전환할 수 있어, 글로벌 팀이나 해외 파트너와의 협업에 활용 가능합니다."),
]

for title, desc in values:
    story.append(Paragraph(f"<b>{title}</b>", make_style("ValTitle", size=10, color=DARK, leading=16, bold=True, space_before=4)))
    story.append(Paragraph(desc, style_body))

story.append(PageBreak())

# ═══════════════════════════════════
#  2. KEY FEATURES
# ═══════════════════════════════════
story.append(Paragraph("2. 핵심 기능", style_h1))
story.append(section_divider())

# Feature 1
story.append(Paragraph("2.1 AI 진단 대화 (5단계 인터뷰)", style_h2))
story.append(Paragraph(
    "AI가 시니어 솔루션 아키텍트 역할로 5가지 핵심 영역에 대해 체계적으로 질문합니다. "
    "각 단계마다 구체적인 예시와 팁을 제공하여, IT에 익숙하지 않은 분도 쉽게 답변할 수 있습니다.",
    style_body
))

phase_data = [
    ["단계", "질문 영역", "수집 내용"],
    ["1단계", "비즈니스 배경", "현재 사업 현황, 겪고 있는 문제점, 시스템 도입 동기"],
    ["2단계", "시스템 모델", "원하는 솔루션 형태 (웹, 앱, 관리도구, SaaS 등)"],
    ["3단계", "업무 프로세스", "실제 사용자가 시스템을 어떻게 사용할지 (업무 흐름)"],
    ["4단계", "기술 환경", "현재 사용 중인 도구, 연동 필요 시스템 (엑셀, ERP 등)"],
    ["5단계", "성공 지표 (KPI)", "시스템 도입 후 달성하고자 하는 비즈니스 목표"],
]

col_widths = [20*mm, 30*mm, 110*mm]
phase_table = Table(
    [[Paragraph(cell, style_table_header if i == 0 else style_table_body) for cell in row]
     for i, row in enumerate(phase_data)],
    colWidths=col_widths
)
phase_table.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,0), DARK),
    ('TEXTCOLOR', (0,0), (-1,0), WHITE),
    ('BACKGROUND', (0,1), (-1,-1), WHITE),
    ('GRID', (0,0), (-1,-1), 0.5, BORDER),
    ('TOPPADDING', (0,0), (-1,-1), 6),
    ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ('LEFTPADDING', (0,0), (-1,-1), 8),
    ('ROWBACKGROUNDS', (0,1), (-1,-1), [WHITE, SLATE_BG]),
    ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
]))
story.append(phase_table)

# Feature 2
story.append(Spacer(1, 5*mm))
story.append(Paragraph("2.2 문서 & 음성 분석", style_h2))
story.append(Paragraph(
    "대화 외에도 기존 자료를 활용하여 더 정밀한 설계가 가능합니다.",
    style_body
))
story.append(bullet("<b>PDF 문서 분석</b> — 기존 사업계획서, 요구사항 정의서, ERD 등을 업로드하면 AI가 자동으로 핵심 내용을 추출하여 설계에 반영합니다."))
story.append(bullet("<b>텍스트 입력</b> — 긴 요구사항 텍스트를 직접 붙여넣어 분석할 수 있습니다."))
story.append(bullet("<b>회의 녹음 분석</b> — 미팅 내용을 녹음하면 AI가 회의록을 생성하고, 비즈니스 요구사항을 자동으로 추출합니다."))
story.append(bullet("<b>문서/회의 기반 즉시 설계</b> — 5단계 인터뷰를 건너뛰고, 문서나 회의 내용만으로 바로 설계를 시작할 수 있습니다."))

# Feature 3
story.append(Spacer(1, 5*mm))
story.append(Paragraph("2.3 개발 일정 제약 설정", style_h2))
story.append(Paragraph(
    "희망 개발 완료 시점을 설정하면 (예: '3개월', '2026년 6월까지'), AI가 로드맵과 마일스톤을 "
    "해당 기간 내에 자동으로 압축 배치합니다. 기능 범위를 줄이지 않고 일정만 조정하며, "
    "병렬 작업 가능한 항목은 동시 진행으로 구성합니다.",
    style_body
))

# Feature 4
story.append(Spacer(1, 5*mm))
story.append(Paragraph("2.4 양식 모드", style_h2))
story.append(Paragraph(
    "대화 방식 외에 구조화된 양식(폼)으로도 요구사항을 입력할 수 있습니다. "
    "양식 모드에서는 각 항목별로 선택지와 입력란이 제공되어, 빠르고 체계적으로 정보를 입력할 수 있습니다.",
    style_body
))

story.append(PageBreak())

# ═══════════════════════════════════
#  3. HOW IT WORKS
# ═══════════════════════════════════
story.append(Paragraph("3. 작동 방식", style_h1))
story.append(section_divider())

story.append(Paragraph(
    "Architect의 전체 프로세스는 크게 3단계로 이루어집니다.",
    style_body_dark
))
story.append(Spacer(1, 3*mm))

# Flow diagram as table
flow_data = [
    [Paragraph("<b>STEP 1</b><br/>요구사항 수집", make_style("FlowTitle", size=10, color=WHITE, leading=15, bold=True, align=TA_CENTER)),
     Paragraph("<b>STEP 2</b><br/>AI 병렬 생성", make_style("FlowTitle", size=10, color=WHITE, leading=15, bold=True, align=TA_CENTER)),
     Paragraph("<b>STEP 3</b><br/>결과 확인 & 내보내기", make_style("FlowTitle", size=10, color=WHITE, leading=15, bold=True, align=TA_CENTER))],
    [Paragraph("5단계 진단 대화<br/>또는 양식 입력<br/>+ 문서/음성 분석", make_style("FlowBody", size=9, color=SLATE, leading=14, align=TA_CENTER)),
     Paragraph("Google Gemini: 비즈니스 분석<br/>Anthropic Claude: 기술 설계<br/>(동시 병렬 처리)", make_style("FlowBody", size=9, color=SLATE, leading=14, align=TA_CENTER)),
     Paragraph("클라이언트 제안서 확인<br/>개발자 설계서 확인<br/>HTML/ZIP/JSON 내보내기", make_style("FlowBody", size=9, color=SLATE, leading=14, align=TA_CENTER))],
]

flow_table = Table(flow_data, colWidths=[50*mm, 55*mm, 55*mm])
flow_table.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (0,0), BLUE),
    ('BACKGROUND', (1,0), (1,0), PURPLE),
    ('BACKGROUND', (2,0), (2,0), GREEN),
    ('BACKGROUND', (0,1), (-1,1), WHITE),
    ('BOX', (0,0), (-1,-1), 1, BORDER),
    ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER),
    ('TOPPADDING', (0,0), (-1,-1), 10),
    ('BOTTOMPADDING', (0,0), (-1,-1), 10),
    ('LEFTPADDING', (0,0), (-1,-1), 8),
    ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
]))
story.append(flow_table)

story.append(Spacer(1, 6*mm))
story.append(Paragraph("상세 흐름", style_h2))

steps_detail = [
    ("요구사항 수집 (5~10분)", "AI가 사업 배경, 원하는 시스템 모델, 업무 흐름, 기술 환경, 목표 KPI를 순서대로 질문합니다. 각 질문에는 구체적인 예시와 전문가 팁이 함께 제공됩니다. 필요하면 PDF 문서를 첨부하거나 회의를 녹음하여 추가 맥락을 제공할 수 있습니다."),
    ("추가 정보 확인", "문서나 회의록에서 누락된 정보가 감지되면, AI가 추가 질문을 통해 빠진 정보를 보완합니다. '건너뛰기'를 입력하면 현재 정보만으로 진행합니다."),
    ("개발 일정 설정", "희망 완료 시점을 입력하면 일정에 맞춰 로드맵이 조정됩니다. 설정하지 않으면 유연한 일정으로 진행됩니다."),
    ("승인 및 생성 시작", "'시작' 또는 '승인'을 입력하면 AI가 설계를 시작합니다. Google Gemini와 Anthropic Claude 두 개의 AI가 동시에 작업하여 빠르게 결과를 생성합니다."),
    ("결과 확인 및 후속 대화", "생성된 결과물을 화면에서 즉시 확인할 수 있습니다. 수정이 필요하면 대화를 계속하여 추가 요청을 할 수 있습니다."),
]
for i, (title, desc) in enumerate(steps_detail):
    story.append(numbered(i+1, f"<b>{title}</b>"))
    story.append(Paragraph(f"&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{desc}", style_body))

story.append(PageBreak())

# ═══════════════════════════════════
#  4. OUTPUT DETAILS
# ═══════════════════════════════════
story.append(Paragraph("4. 결과물 상세", style_h1))
story.append(section_divider())

story.append(Paragraph(
    "Architect는 하나의 분석 결과를 <b>두 가지 관점</b>으로 제공합니다. "
    "같은 프로젝트에 대해 사업주와 개발팀이 각자 필요한 형태의 문서를 받을 수 있습니다.",
    style_body_dark
))

# Client View
story.append(Spacer(1, 4*mm))
story.append(Paragraph("4.1 클라이언트용 제안서", style_h2))
story.append(Paragraph(
    "비개발자(사업주, 의사결정자)가 읽는 문서입니다. 기술 용어 없이 비즈니스 언어로 작성됩니다.",
    style_body
))

client_items = [
    ["항목", "내용"],
    ["문제 정의", "현재 겪고 있는 비즈니스 문제를 공감하며 정리"],
    ["솔루션 개요", "해결 방안을 쉬운 말로 상세히 설명 (기술명 없이)"],
    ["핵심 기능 (7~10개)", "비즈니스 가치 중심으로 기능 서술"],
    ["추진 일정 (마일스톤)", "단계별 일정과 각 단계의 산출물"],
    ["캘린더 타임라인", "스프린트 기반 시각적 캘린더 일정표"],
    ["기대 효과", "도입 전후 비교 시나리오"],
    ["투자 대비 효과", "정성적 ROI 분석 및 업계 벤치마크 참고"],
    ["데이터 보호", "보안 및 개인정보 보호 방안 (쉬운 설명)"],
]

client_table = Table(
    [[Paragraph(cell, style_table_header if i == 0 else style_table_body) for cell in row]
     for i, row in enumerate(client_items)],
    colWidths=[45*mm, 115*mm]
)
client_table.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,0), BLUE),
    ('GRID', (0,0), (-1,-1), 0.5, BORDER),
    ('TOPPADDING', (0,0), (-1,-1), 5),
    ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ('LEFTPADDING', (0,0), (-1,-1), 8),
    ('ROWBACKGROUNDS', (0,1), (-1,-1), [WHITE, SLATE_BG]),
    ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
]))
story.append(client_table)

# Developer View
story.append(Spacer(1, 6*mm))
story.append(Paragraph("4.2 개발자용 기술 설계서", style_h2))
story.append(Paragraph(
    "개발팀이 바로 개발에 착수할 수 있는 수준의 기술 문서입니다. 4개의 탭으로 구성됩니다.",
    style_body
))

story.append(Paragraph("<b>로드맵 탭</b>", style_h3))
story.append(bullet("실행 로드맵 (6단계 이상, 기간/목표/산출물 포함)"))
story.append(bullet("스프린트 계획 (목표, 산출물, 선행 조건 포함)"))
story.append(bullet("캘린더 타임라인 시각화"))
story.append(bullet("분석 요약, 예상 ROI, 보안 전략"))

story.append(Paragraph("<b>아키텍처 탭</b>", style_h3))
story.append(bullet("시스템 아키텍처 다이어그램 (Mermaid 시각화 + 코드)"))
story.append(bullet("기술 스택 다이어그램 (프레임워크, DB, 인프라 등)"))
story.append(bullet("시퀀스 플로우 다이어그램 (사용자 시나리오 흐름)"))

story.append(Paragraph("<b>구현 탭</b>", style_h3))
story.append(bullet("프로젝트 폴더 구조"))
story.append(bullet("API 엔드포인트 명세 (메서드, 경로, 요청/응답, 에러코드)"))
story.append(bullet("데이터베이스 스키마 (테이블, 컬럼, 타입, 제약조건)"))
story.append(bullet("핵심 모듈 코드 (실제 구현 코드 포함)"))
story.append(bullet("배포 계획 및 테스트 전략"))

story.append(Paragraph("<b>문서 탭</b>", style_h3))
story.append(bullet("PRD (제품 요구사항 문서) — 전체 마크다운"))
story.append(bullet("LLD (상세 설계 문서) — 전체 마크다운"))

story.append(PageBreak())

# ═══════════════════════════════════
#  5. MULTILINGUAL
# ═══════════════════════════════════
story.append(Paragraph("5. 다국어 지원", style_h1))
story.append(section_divider())

story.append(Paragraph(
    "Architect는 <b>한국어와 영어를 완벽하게 지원</b>합니다.",
    style_body_dark
))
story.append(Spacer(1, 3*mm))

story.append(Paragraph("UI 라벨 실시간 전환", style_h3))
story.append(Paragraph(
    "화면 상단의 KO/EN 버튼 하나로 모든 인터페이스 라벨이 즉시 전환됩니다. "
    "메뉴, 버튼, 안내 텍스트, 탭 이름 등 100개 이상의 UI 요소가 양국어로 제공됩니다.",
    style_body
))

story.append(Paragraph("AI 생성 콘텐츠 자동 번역", style_h3))
story.append(Paragraph(
    "언어를 전환하면 AI가 생성한 결과물(분석, 로드맵, 제안서, PRD/LLD 등)도 자동으로 번역됩니다. "
    "3개의 AI 번역 엔진이 동시에 작동하여 빠르게 처리하며, 번역 결과는 캐시에 저장되어 "
    "재전환 시 즉시 표시됩니다 (추가 API 호출 없음).",
    style_body
))

story.append(Spacer(1, 3*mm))
story.append(Paragraph("번역 시 보존되는 항목", style_h3))
story.append(bullet("Mermaid 다이어그램 (시각화 요소)"))
story.append(bullet("코드 블록 및 파일 경로"))
story.append(bullet("URL, 날짜, 숫자, 버전 번호"))
story.append(bullet("기술 식별자 (함수명, 클래스명 등)"))

story.append(Spacer(1, 3*mm))
story.append(Paragraph("내보내기 시 번역 반영", style_h3))
story.append(Paragraph(
    "내보내기 메뉴에서 '보고서 언어'를 선택하면 해당 언어의 번역된 결과물로 다운로드됩니다. "
    "한국어로 생성한 결과를 영어로 내보내거나, 그 반대도 가능합니다.",
    style_body
))

story.append(Spacer(1, 8*mm))

# ═══════════════════════════════════
#  6. EXPORT
# ═══════════════════════════════════
story.append(Paragraph("6. 내보내기 기능", style_h1))
story.append(section_divider())

story.append(Paragraph(
    "생성된 결과물을 다양한 형식으로 내보낼 수 있습니다.",
    style_body_dark
))

export_data = [
    ["형식", "내용", "용도"],
    ["클라이언트 HTML", "제안서 전체 (마일스톤 캘린더 포함)", "고객에게 제안서 전달"],
    ["개발자 HTML", "로드맵, 아키텍처, 구현계획, PRD, LLD 전체", "개발팀에 기술 문서 전달"],
    ["ZIP 전체", "모든 결과물 (MD, HTML, JSON, 코드, 다이어그램)", "프로젝트 아카이브"],
    ["JSON 원본", "Blueprint 데이터 원본", "시스템 연동, 데이터 활용"],
    ["인쇄", "클라이언트용 / 개발자용 선택 인쇄", "오프라인 미팅, 보고"],
]

export_table = Table(
    [[Paragraph(cell, style_table_header if i == 0 else style_table_body) for cell in row]
     for i, row in enumerate(export_data)],
    colWidths=[35*mm, 70*mm, 55*mm]
)
export_table.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,0), DARK),
    ('GRID', (0,0), (-1,-1), 0.5, BORDER),
    ('TOPPADDING', (0,0), (-1,-1), 6),
    ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ('LEFTPADDING', (0,0), (-1,-1), 8),
    ('ROWBACKGROUNDS', (0,1), (-1,-1), [WHITE, SLATE_BG]),
    ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
]))
story.append(export_table)

story.append(PageBreak())

# ═══════════════════════════════════
#  7. AI TECHNOLOGY
# ═══════════════════════════════════
story.append(Paragraph("7. AI 기술 구성", style_h1))
story.append(section_divider())

story.append(Paragraph(
    "Architect는 <b>Google Gemini</b>와 <b>Anthropic Claude</b> 두 개의 AI를 동시에 활용하여 "
    "각 AI의 장점을 극대화합니다.",
    style_body_dark
))

story.append(Spacer(1, 4*mm))

ai_data = [
    ["AI 모델", "역할", "담당 결과물"],
    ["Google Gemini Pro", "비즈니스 분석 전문가", "로드맵, 분석 요약, ROI, 보안 전략, 클라이언트 제안서"],
    ["Google Gemini Pro", "아키텍처 전문가", "시스템 아키텍처, 시퀀스, 기술스택 다이어그램"],
    ["Google Gemini Flash", "대화 및 분석 전문가", "진단 질문 생성, 문서 분석, 자유 대화, 콘텐츠 번역"],
    ["Anthropic Claude", "개발 설계 전문가", "PRD, LLD, 스프린트 계획, API 설계, DB 스키마, 코드"],
]

ai_table = Table(
    [[Paragraph(cell, style_table_header if i == 0 else style_table_body) for cell in row]
     for i, row in enumerate(ai_data)],
    colWidths=[35*mm, 40*mm, 85*mm]
)
ai_table.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,0), PURPLE),
    ('GRID', (0,0), (-1,-1), 0.5, BORDER),
    ('TOPPADDING', (0,0), (-1,-1), 6),
    ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ('LEFTPADDING', (0,0), (-1,-1), 8),
    ('ROWBACKGROUNDS', (0,1), (-1,-1), [WHITE, SLATE_BG]),
    ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
]))
story.append(ai_table)

story.append(Spacer(1, 5*mm))
story.append(info_box(
    "병렬 처리의 장점",
    "두 AI가 동시에 작업하기 때문에, 순차적으로 처리하는 것보다 생성 시간이 크게 단축됩니다. "
    "Gemini가 비즈니스 분석을 하는 동안 Claude가 기술 설계를 진행하여, 사용자는 Gemini 결과를 먼저 확인하면서 "
    "Claude 결과를 기다릴 수 있습니다. Claude API 키가 없어도 Gemini 결과만으로 정상 동작합니다."
))

story.append(Spacer(1, 5*mm))
story.append(Paragraph("추가 AI 기능", style_h2))
story.append(bullet("<b>Google Search 연동</b> — Gemini Pro가 실시간 웹 검색으로 시장 동향, 경쟁사 분석, 업계 벤치마크를 반영합니다. 참고 자료 출처가 함께 제공됩니다."))
story.append(bullet("<b>기술 레퍼런스 자동 매칭</b> — 사용자가 언급한 기술 스택에 맞는 최신 공식 문서 패턴을 자동으로 참조하여 코드 품질을 높입니다."))
story.append(bullet("<b>회의 녹음 AI 분석</b> — 네이티브 오디오 AI가 회의 내용을 직접 분석하여 회의록과 설계 키워드를 추출합니다."))

story.append(PageBreak())

# ═══════════════════════════════════
#  8. USE CASES
# ═══════════════════════════════════
story.append(Paragraph("8. 활용 시나리오", style_h1))
story.append(section_divider())

story.append(Paragraph("누가 사용하나요?", style_h2))

users = [
    ("중소기업 대표 / 사업주", "IT 시스템을 도입하고 싶지만 어디서 시작해야 할지 모를 때. 전문 컨설턴트를 고용하기 전에 요구사항을 정리하고, 사업 타당성을 검토하고 싶을 때."),
    ("스타트업 창업자", "아이디어를 구체적인 기술 설계로 빠르게 전환하고 싶을 때. 개발팀에 전달할 PRD/LLD를 직접 작성하기 어려울 때."),
    ("IT 컨설턴트 / PM", "고객 미팅 후 제안서와 기술 문서를 빠르게 초안 작성하고 싶을 때. 고객과의 요구사항 수집 과정을 체계화하고 싶을 때."),
    ("기업 IT 부서", "내부 시스템 개선 프로젝트의 초기 설계를 빠르게 진행하고 싶을 때. 비개발 부서의 요구사항을 기술 문서로 변환해야 할 때."),
]

for title, desc in users:
    story.append(Paragraph(f"<b>{title}</b>", make_style("UserTitle", size=10, color=DARK, leading=16, bold=True, space_before=6)))
    story.append(Paragraph(desc, style_body))

story.append(Spacer(1, 6*mm))
story.append(Paragraph("실제 사용 예시", style_h2))

story.append(Paragraph("<b>시나리오: 물류 회사가 재고 관리 시스템을 만들고 싶을 때</b>",
    make_style("ScenTitle", size=10, color=BLUE, leading=16, bold=True, space_before=4)))

scenario_data = [
    ["단계", "사용자 행동", "시스템 결과"],
    ["1", "사업 배경 설명: '물류 창고 3개 운영 중, 엑셀로 재고 관리하는데 실수가 많아요'", "AI가 물류/재고 관리 도메인으로 분석 시작"],
    ["2", "시스템 모델 선택: '웹 기반 관리자 도구 + 모바일 앱'", "웹+앱 하이브리드 아키텍처 설계"],
    ["3", "업무 흐름 설명: '입고 → 검수 → 적재 → 출고 → 배송 추적'", "프로세스 기반 모듈 설계"],
    ["4", "기존 환경: '엑셀, 택배사 API, 바코드 스캐너'", "연동 아키텍처 포함한 기술 스택 선정"],
    ["5", "목표 KPI: '재고 오차율 5% 이하, 처리 시간 50% 단축'", "KPI 기반 ROI 분석"],
    ["결과", "승인 ('시작' 입력)", "제안서 + PRD + LLD + 스프린트 계획 자동 생성"],
]

scenario_table = Table(
    [[Paragraph(cell, style_table_header if i == 0 else style_table_body) for cell in row]
     for i, row in enumerate(scenario_data)],
    colWidths=[15*mm, 70*mm, 75*mm]
)
scenario_table.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,0), GREEN),
    ('GRID', (0,0), (-1,-1), 0.5, BORDER),
    ('TOPPADDING', (0,0), (-1,-1), 5),
    ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ('LEFTPADDING', (0,0), (-1,-1), 6),
    ('ROWBACKGROUNDS', (0,1), (-1,-1), [WHITE, SLATE_BG]),
    ('VALIGN', (0,0), (-1,-1), 'TOP'),
]))
story.append(scenario_table)

story.append(Spacer(1, 10*mm))
story.append(HRFlowable(width="100%", thickness=1, color=BLUE, spaceBefore=0, spaceAfter=8))
story.append(Paragraph(
    "Architect Enterprise Builder는 비즈니스 아이디어를 전문적인 설계 문서로 변환하는 과정을 "
    "AI가 자동화합니다. 대화 한 번으로 사업주와 개발팀 모두가 필요한 문서를 동시에 얻을 수 있습니다.",
    make_style("Closing", size=11, color=DARK, leading=18, bold=True, align=TA_CENTER, space_after=4)
))
story.append(Paragraph(
    "www.architect-builder.com",
    make_style("URL", size=9, color=BLUE, leading=14, align=TA_CENTER)
))

# ═══════════════════════════════════
#  BUILD
# ═══════════════════════════════════
doc.build(story, onFirstPage=draw_cover, onLaterPages=draw_page)
print(f"PDF generated: {output_path}")
