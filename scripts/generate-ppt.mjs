import PptxGenJS from 'pptxgenjs';

const pptx = new PptxGenJS();

// ── Brand Colors ──
const C = {
  bgDark:    '0A0A1A',
  bgCard:    '12122A',
  bgMid:     '1A1A3E',
  accent:    '06B6D4',   // cyan
  accent2:   '0891B2',   // teal
  gold:      'F59E0B',   // amber
  rose:      'F43F5E',   // danger/contradiction
  white:     'FFFFFF',
  gray:      '94A3B8',
  grayLight: 'CBD5E1',
  green:     '10B981',
  purple:    '8B5CF6',
};

const FONT = 'Inter';
const FONT_BOLD = 'Inter';

// ── Helper: Background ──
function addBg(slide) {
  slide.background = { fill: C.bgDark };
  // subtle gradient overlay
  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: 10, h: 5.63,
    fill: { color: C.bgDark },
  });
  // subtle accent bar at top
  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: 10, h: 0.04,
    fill: { color: C.accent },
  });
}

// ── Helper: Side accent line ──
function addAccentLine(slide, y, h = 0.04) {
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.5, y, w: 0.06, h,
    fill: { color: C.accent },
  });
}

// ── Helper: Section number pill ──
function addSectionNum(slide, num, label, x = 0.6, y = 0.3) {
  // number circle
  slide.addShape(pptx.ShapeType.ellipse, {
    x, y, w: 0.35, h: 0.35,
    fill: { color: C.accent },
  });
  slide.addText(num.toString(), {
    x, y, w: 0.35, h: 0.35,
    fontSize: 12, fontFace: FONT_BOLD, color: C.white,
    align: 'center', valign: 'middle', bold: true,
  });
  slide.addText(label, {
    x: x + 0.45, y: y + 0.04, w: 4, h: 0.3,
    fontSize: 11, fontFace: FONT, color: C.gray,
    valign: 'middle',
  });
}

// ══════════════════════════════════════════════════
// SLIDE 1 — TITLE
// ══════════════════════════════════════════════════
{
  const slide = pptx.addSlide();
  addBg(slide);

  // Decorative circles
  slide.addShape(pptx.ShapeType.ellipse, {
    x: 7.5, y: -0.8, w: 3, h: 3,
    fill: { color: C.accent, transparency: 92 },
  });
  slide.addShape(pptx.ShapeType.ellipse, {
    x: 8.2, y: 3.5, w: 2.2, h: 2.2,
    fill: { color: C.accent2, transparency: 90 },
  });

  // Vertical accent line
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.8, y: 1.2, w: 0.06, h: 2.8,
    fill: { color: C.accent },
  });

  // Main Title
  slide.addText('ECHOTRACE AI', {
    x: 1.2, y: 1.3, w: 7, h: 0.8,
    fontSize: 44, fontFace: FONT_BOLD, color: C.white,
    bold: true, valign: 'middle',
  });

  // Tagline
  slide.addText('Multimodal Investigation Intelligence Platform', {
    x: 1.2, y: 2.1, w: 6, h: 0.5,
    fontSize: 20, fontFace: FONT, color: C.accent,
    valign: 'middle',
  });

  // Divider line
  slide.addShape(pptx.ShapeType.rect, {
    x: 1.2, y: 2.8, w: 2.5, h: 0.003,
    fill: { color: C.gray, transparency: 50 },
  });

  // Subtitle
  slide.addText('Turn scattered evidence into an explainable investigation timeline.', {
    x: 1.2, y: 3.0, w: 6, h: 0.4,
    fontSize: 13, fontFace: FONT, color: C.gray, italic: true,
    valign: 'middle',
  });

  // Presenter info
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.6, y: 4.2, w: 3.8, h: 1.1,
    fill: { color: C.bgCard },
    rectRadius: 0.08,
  });
  slide.addText('Presented by', {
    x: 0.8, y: 4.3, w: 3.4, h: 0.3,
    fontSize: 10, fontFace: FONT, color: C.gray,
    valign: 'middle',
  });
  slide.addText('Jackson JP', {
    x: 0.8, y: 4.55, w: 3.4, h: 0.35,
    fontSize: 16, fontFace: FONT_BOLD, color: C.white, bold: true,
    valign: 'middle',
  });
  slide.addText('Panimalar Engineering College', {
    x: 0.8, y: 4.85, w: 3.4, h: 0.3,
    fontSize: 11, fontFace: FONT, color: C.grayLight,
    valign: 'middle',
  });

  // Bottom accent bar
  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 5.59, w: 10, h: 0.04,
    fill: { color: C.accent },
  });
}

// ══════════════════════════════════════════════════
// SLIDE 2 — PROBLEM STATEMENT
// ══════════════════════════════════════════════════
{
  const slide = pptx.addSlide();
  addBg(slide);
  addSectionNum(slide, '01', 'The Challenge');

  // Header
  slide.addText('The Evidence Fragmentation Problem', {
    x: 0.6, y: 0.75, w: 7, h: 0.55,
    fontSize: 26, fontFace: FONT_BOLD, color: C.white, bold: true,
    valign: 'middle',
  });

  // Divider
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.6, y: 1.3, w: 1.5, h: 0.003,
    fill: { color: C.accent },
  });

  // Problem cards
  const problems = [
    { icon: '📷', title: 'Mixed Modalities', desc: 'Photos, voice notes, PDFs, screenshots, GPS data — each requires a separate tool for analysis, creating silos that hide critical connections.' },
    { icon: '🔗', title: 'Missed Relationships', desc: 'Critical links between evidence pieces go undetected. A voice note contradicts a photo timestamp, but no tool connects them automatically.' },
    { icon: '⚠️', title: 'Delayed Discovery', desc: 'Contradictions and gaps are found only during manual review — days or weeks after evidence collection, causing rework and delays.' },
    { icon: '🤖', title: 'Chatbots, Not Reasoners', desc: 'Current AI tools answer simple questions. They cannot reason across modalities, detect contradictions, or reconstruct event timelines.' },
  ];

  problems.forEach((p, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 0.6 + col * 4.5;
    const y = 1.6 + row * 1.7;

    // Card bg
    slide.addShape(pptx.ShapeType.rect, {
      x, y, w: 4.2, h: 1.5,
      fill: { color: C.bgCard },
      rectRadius: 0.1,
    });
    // Left accent
    slide.addShape(pptx.ShapeType.rect, {
      x, y, w: 0.05, h: 1.5,
      fill: { color: C.rose },
    });

    slide.addText(p.icon, {
      x: x + 0.25, y: y + 0.1, w: 0.4, h: 0.35,
      fontSize: 18, valign: 'middle',
    });
    slide.addText(p.title, {
      x: x + 0.65, y: y + 0.1, w: 3.2, h: 0.35,
      fontSize: 14, fontFace: FONT_BOLD, color: C.white, bold: true,
      valign: 'middle',
    });
    slide.addText(p.desc, {
      x: x + 0.25, y: y + 0.5, w: 3.7, h: 0.85,
      fontSize: 10.5, fontFace: FONT, color: C.gray,
      valign: 'top', lineSpacing: 14,
    });
  });

  // Bottom consequence
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.6, y: 5.0, w: 8.8, h: 0.45,
    fill: { color: C.rose, transparency: 85 },
    rectRadius: 0.06,
  });
  slide.addText('⌛  Result: Delayed decisions, human error, incomplete investigations, and undetected fraud costing billions annually.', {
    x: 0.8, y: 5.0, w: 8.4, h: 0.45,
    fontSize: 10.5, fontFace: FONT, color: C.rose,
    valign: 'middle', bold: true,
  });
}

// ══════════════════════════════════════════════════
// SLIDE 3 — PROPOSED SOLUTION
// ══════════════════════════════════════════════════
{
  const slide = pptx.addSlide();
  addBg(slide);
  addSectionNum(slide, '02', 'Our Solution');

  slide.addText('EchoTrace AI — One Platform, Every Modality', {
    x: 0.6, y: 0.75, w: 7, h: 0.55,
    fontSize: 24, fontFace: FONT_BOLD, color: C.white, bold: true,
    valign: 'middle',
  });
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.6, y: 1.3, w: 1.5, h: 0.003,
    fill: { color: C.accent },
  });

  // Flow diagram: vertical pipeline
  const steps = [
    { label: 'UPLOAD', detail: 'Drag & drop any evidence — photos, audio, PDFs, screenshots, text messages, maps', color: C.accent },
    { label: 'PROCESS', detail: 'Gemini analyzes all modalities together in a single reasoning pass', color: C.accent2 },
    { label: 'EXTRACT', detail: 'Entities (people, vehicles, locations), events, timestamps, relationships', color: C.purple },
    { label: 'DETECT', detail: 'Cross-modal contradiction analysis with confidence scoring', color: C.gold },
    { label: 'VISUALIZE', detail: 'Interactive timeline, evidence graph, and live copilot insights', color: C.green },
  ];

  steps.forEach((s, i) => {
    const y = 1.6 + i * 0.78;
    // Step circle
    slide.addShape(pptx.ShapeType.ellipse, {
      x: 0.6, y: y + 0.08, w: 0.45, h: 0.45,
      fill: { color: s.color },
    });
    slide.addText((i + 1).toString(), {
      x: 0.6, y: y + 0.08, w: 0.45, h: 0.45,
      fontSize: 14, fontFace: FONT_BOLD, color: C.white, bold: true,
      align: 'center', valign: 'middle',
    });
    // Arrow down (except last)
    if (i < steps.length - 1) {
      slide.addShape(pptx.ShapeType.rect, {
        x: 0.8, y: y + 0.53, w: 0.003, h: 0.28,
        fill: { color: C.gray, transparency: 60 },
      });
    }
    // Label
    slide.addText(s.label, {
      x: 1.3, y: y + 0.02, w: 2, h: 0.28,
      fontSize: 13, fontFace: FONT_BOLD, color: C.white, bold: true,
      valign: 'middle',
    });
    slide.addText(s.detail, {
      x: 1.3, y: y + 0.28, w: 4, h: 0.3,
      fontSize: 10, fontFace: FONT, color: C.gray,
      valign: 'middle',
    });
  });

  // Right side: Key Differentiator box
  slide.addShape(pptx.ShapeType.rect, {
    x: 5.8, y: 1.6, w: 3.8, h: 3.9,
    fill: { color: C.bgCard },
    rectRadius: 0.12,
    line: { color: C.accent, width: 0.5, transparency: 60 },
  });
  slide.addText('🚀  Key Differentiator', {
    x: 6.0, y: 1.75, w: 3.4, h: 0.4,
    fontSize: 14, fontFace: FONT_BOLD, color: C.accent, bold: true,
    valign: 'middle',
  });
  slide.addText(
    'Gemini acts as a reasoning engine over heterogeneous evidence — not a simple chat interface.\n\n' +
    '• Single API for vision, audio, document, and text reasoning\n' +
    '• Cross-modal contradiction detection\n' +
    '• Structured JSON output — not free-form text\n' +
    '• Every result includes confidence scores cited to source evidence\n\n' +
    'No custom OCR, speech recognition, or CV pipelines needed.',
    {
      x: 6.0, y: 2.3, w: 3.4, h: 3.0,
      fontSize: 10, fontFace: FONT, color: C.grayLight,
      valign: 'top', lineSpacing: 16,
    }
  );
}

// ══════════════════════════════════════════════════
// SLIDE 4 — UNIQUENESS
// ══════════════════════════════════════════════════
{
  const slide = pptx.addSlide();
  addBg(slide);
  addSectionNum(slide, '03', 'What Sets Us Apart');

  slide.addText('What Makes EchoTrace AI Different?', {
    x: 0.6, y: 0.75, w: 7, h: 0.55,
    fontSize: 24, fontFace: FONT_BOLD, color: C.white, bold: true,
    valign: 'middle',
  });
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.6, y: 1.3, w: 1.5, h: 0.003,
    fill: { color: C.accent },
  });

  // Comparison table header
  const tableX = 0.5, tableY = 1.5, colW = [3.1, 3.0, 3.0];
  const rowH = 0.38;
  const headerBg = C.accent;

  const headerCells = [
    { text: 'Feature', options: { fontSize: 10, fontFace: FONT_BOLD, color: C.white, bold: true, align: 'center', valign: 'middle' } },
    { text: 'Traditional Tools', options: { fontSize: 10, fontFace: FONT_BOLD, color: C.white, bold: true, align: 'center', valign: 'middle' } },
    { text: 'EchoTrace AI', options: { fontSize: 10, fontFace: FONT_BOLD, color: C.white, bold: true, align: 'center', valign: 'middle' } },
  ];

  const rows = [
    ['Evidence Types',  'One at a time',               'All modalities together'],
    ['Analysis',        'Chatbot Q&A',                  'Reasoning engine with structured output'],
    ['Contradictions',  'Manual detection',             'Automated with confidence scores'],
    ['Timeline',        'Not generated',                'Auto-built from cross-referenced evidence'],
    ['Live Validation', 'After submission',             'Real-time during evidence collection'],
    ['Quality Check',   'Not available',                'AI scans quality before submission'],
  ];

  const tableRows = [
    headerCells,
    ...rows.map((r, i) => r.map((text, j) => ({
      text,
      options: {
        fontSize: 9.5,
        fontFace: FONT,
        color: j === 2 ? C.accent : (j === 1 ? C.gray : C.white),
        align: 'center',
        valign: 'middle',
        bold: j === 2 || j === 0,
        fill: { color: i % 2 === 0 ? C.bgCard : C.bgMid },
      },
    }))),
  ];

  slide.addTable(tableRows, {
    x: tableX, y: tableY, w: 9,
    colW,
    rowH,
    border: { type: 'solid', pt: 0.5, color: C.bgMid, transparency: 50 },
    margin: [4, 6, 4, 6],
    autoPage: false,
  });

  // Unique Features below
  const features = [
    { icon: '🛡️', title: 'Live Claim Guardian', desc: 'Continuously validates claims in real-time as each document is uploaded' },
    { icon: '📸', title: 'AI Evidence Quality Scanner', desc: 'Tells you which photos need retaking before you leave the scene' },
    { icon: '🔍', title: 'Smart Investigation Assistant', desc: 'Answers complex queries like "Show everywhere Person A appears" or "What contradicts Witness 2?"' },
    { icon: '🌐', title: 'Interactive Evidence Graph', desc: 'Visualize connections between people, vehicles, locations, and events' },
  ];

  features.forEach((f, i) => {
    const x = 0.5 + i * 2.3;
    slide.addShape(pptx.ShapeType.rect, {
      x, y: 4.0, w: 2.1, h: 1.4,
      fill: { color: C.bgCard },
      rectRadius: 0.08,
      line: { color: C.accent, width: 0.3, transparency: 80 },
    });
    slide.addText(f.icon + '  ' + f.title, {
      x: x + 0.12, y: 4.08, w: 1.86, h: 0.35,
      fontSize: 10, fontFace: FONT_BOLD, color: C.white, bold: true,
      valign: 'middle',
    });
    slide.addText(f.desc, {
      x: x + 0.12, y: 4.45, w: 1.86, h: 0.8,
      fontSize: 8.5, fontFace: FONT, color: C.gray,
      valign: 'top', lineSpacing: 12,
    });
  });
}

// ══════════════════════════════════════════════════
// SLIDE 5 — ARCHITECTURE
// ══════════════════════════════════════════════════
{
  const slide = pptx.addSlide();
  addBg(slide);
  addSectionNum(slide, '04', 'Architecture Overview');

  slide.addText('System Architecture', {
    x: 0.6, y: 0.75, w: 7, h: 0.55,
    fontSize: 24, fontFace: FONT_BOLD, color: C.white, bold: true,
    valign: 'middle',
  });
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.6, y: 1.3, w: 1.5, h: 0.003,
    fill: { color: C.accent },
  });

  // ── LAYER 1: FRONTEND ──
  const layerX = 0.5, layerW = 9;
  const yStart = 1.5;

  // Frontend layer
  slide.addShape(pptx.ShapeType.rect, {
    x: layerX, y: yStart, w: layerW, h: 1.0,
    fill: { color: C.bgCard },
    rectRadius: 0.08,
    line: { color: C.accent, width: 0.3, transparency: 70 },
  });
  slide.addText('FRONTEND  —  Next.js 15 + React + Tailwind CSS + shadcn/ui', {
    x: layerX + 0.2, y: yStart + 0.04, w: layerW - 0.4, h: 0.25,
    fontSize: 9, fontFace: FONT_BOLD, color: C.accent, bold: true,
    valign: 'middle',
  });
  slide.addText('Timeline View  |  Evidence Graph (React Flow)  |  Entity Explorer  |  Live Copilot  |  Contradiction Panel  |  Quality Scanner', {
    x: layerX + 0.2, y: yStart + 0.32, w: layerW - 0.4, h: 0.3,
    fontSize: 8.5, fontFace: FONT, color: C.grayLight,
    valign: 'middle',
  });
  slide.addText('State: TanStack Query  •  Animations: Framer Motion  •  Validation: Zod  •  TypeScript', {
    x: layerX + 0.2, y: yStart + 0.62, w: layerW - 0.4, h: 0.28,
    fontSize: 8, fontFace: FONT, color: C.gray,
    valign: 'middle',
  });

  // Arrow down
  slide.addText('▼', {
    x: 4.5, y: yStart + 0.95, w: 1, h: 0.35,
    fontSize: 12, color: C.accent, align: 'center', valign: 'middle',
  });

  // ── LAYER 2: BACKEND ──
  const y2 = yStart + 1.3;
  slide.addShape(pptx.ShapeType.rect, {
    x: layerX, y: y2, w: layerW, h: 1.0,
    fill: { color: C.bgCard },
    rectRadius: 0.08,
    line: { color: C.purple, width: 0.3, transparency: 70 },
  });
  slide.addText('BACKEND  —  Node.js + Express REST API', {
    x: layerX + 0.2, y: y2 + 0.04, w: layerW - 0.4, h: 0.25,
    fontSize: 9, fontFace: FONT_BOLD, color: C.purple, bold: true,
    valign: 'middle',
  });
  slide.addText('Evidence Ingestion Service  |  Analysis Pipeline (orchestrates multi-modal processing)', {
    x: layerX + 0.2, y: y2 + 0.32, w: layerW - 0.4, h: 0.28,
    fontSize: 8.5, fontFace: FONT, color: C.grayLight,
    valign: 'middle',
  });
  slide.addText('Contradiction Detector  |  Timeline Builder  |  Entity Relationship Mapper  |  Live Copilot Stream', {
    x: layerX + 0.2, y: y2 + 0.62, w: layerW - 0.4, h: 0.28,
    fontSize: 8.5, fontFace: FONT, color: C.grayLight,
    valign: 'middle',
  });

  // Arrow down
  slide.addText('▼', {
    x: 4.5, y: y2 + 0.95, w: 1, h: 0.35,
    fontSize: 12, color: C.purple, align: 'center', valign: 'middle',
  });

  // ── LAYER 3: AI ENGINE ──
  const y3 = y2 + 1.3;
  slide.addShape(pptx.ShapeType.rect, {
    x: layerX, y: y3, w: layerW, h: 0.7,
    fill: { color: C.bgCard },
    rectRadius: 0.08,
    line: { color: C.gold, width: 0.5, transparency: 40 },
  });
  slide.addText('🧠  AI ENGINE  —  Google Gemini API 1.5 (Flash / Pro)', {
    x: layerX + 0.2, y: y3 + 0.04, w: layerW - 0.4, h: 0.25,
    fontSize: 9, fontFace: FONT_BOLD, color: C.gold, bold: true,
    valign: 'middle',
  });
  slide.addText('Multimodal Reasoning: Vision  •  Audio  •  Document (PDF)  •  Text  •  Screenshot Understanding', {
    x: layerX + 0.2, y: y3 + 0.32, w: layerW - 0.4, h: 0.28,
    fontSize: 8.5, fontFace: FONT, color: C.grayLight,
    valign: 'middle',
  });

  // Arrow down
  slide.addText('▼', {
    x: 4.5, y: y3 + 0.65, w: 1, h: 0.35,
    fontSize: 12, color: C.gold, align: 'center', valign: 'middle',
  });

  // ── LAYER 4: STORAGE ──
  const y4 = y3 + 1.0;
  slide.addShape(pptx.ShapeType.rect, {
    x: layerX, y: y4, w: layerW, h: 0.55,
    fill: { color: C.bgCard },
    rectRadius: 0.08,
    line: { color: C.green, width: 0.3, transparency: 70 },
  });
  slide.addText('STORAGE LAYER  —  Firebase Firestore (Investigations, Entities, Timeline)  |  Firebase Storage (Evidence Files)', {
    x: layerX + 0.2, y: y4 + 0.04, w: layerW - 0.4, h: 0.25,
    fontSize: 8.5, fontFace: FONT_BOLD, color: C.green, bold: true,
    valign: 'middle',
  });
  slide.addText('In-Memory Cache (hot data)  |  Auth: Firebase Auth (Google Login)', {
    x: layerX + 0.2, y: y4 + 0.28, w: layerW - 0.4, h: 0.22,
    fontSize: 8, fontFace: FONT, color: C.gray,
    valign: 'middle',
  });

  // Data flow annotation
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.5, y: 5.05, w: 9, h: 0.42,
    fill: { color: C.bgMid, transparency: 30 },
    rectRadius: 0.06,
  });
  slide.addText('📡  Data Flow:  User Upload → Frontend → Express API → Gemini Analysis → Structured JSON → Store → Real-time UI Update', {
    x: 0.7, y: 5.05, w: 8.6, h: 0.42,
    fontSize: 9.5, fontFace: FONT, color: C.accent,
    valign: 'middle', bold: true,
  });
}

// ══════════════════════════════════════════════════
// SLIDE 6 — TECH STACK
// ══════════════════════════════════════════════════
{
  const slide = pptx.addSlide();
  addBg(slide);
  addSectionNum(slide, '05', 'Technology Stack');

  slide.addText('Technology Stack', {
    x: 0.6, y: 0.75, w: 7, h: 0.55,
    fontSize: 24, fontFace: FONT_BOLD, color: C.white, bold: true,
    valign: 'middle',
  });
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.6, y: 1.3, w: 1.5, h: 0.003,
    fill: { color: C.accent },
  });

  // Category cards
  const categories = [
    {
      title: '🎨  Frontend',
      color: C.accent,
      items: [
        'Next.js 15 + React 18 — Fast SSR & file uploads',
        'Tailwind CSS + shadcn/ui — Enterprise UI toolkit',
        'Framer Motion — Smooth timeline & card animations',
        'React Flow — Interactive evidence graph',
        'TanStack Query — API state & caching',
      ],
    },
    {
      title: '⚙️  Backend & AI',
      color: C.purple,
      items: [
        'Node.js + Express — Minimal REST API',
        'Gemini API 1.5 (Flash / Pro) — Multimodal AI engine',
        'Zod — Input validation & type safety',
        'LangChain-ready — Extensible pipeline',
      ],
    },
    {
      title: '🗄️  Infrastructure',
      color: C.green,
      items: [
        'Firebase Firestore — NoSQL investigations database',
        'Firebase Storage — Evidence file hosting',
        'Firebase Auth — Google Login authentication',
        'TypeScript — End-to-end type safety',
        'Vercel / Render — Free deployment',
      ],
    },
  ];

  categories.forEach((cat, i) => {
    const x = 0.4 + i * 3.15;
    const n = cat.items.length;
    const h = 0.35 + n * 0.32;

    slide.addShape(pptx.ShapeType.rect, {
      x, y: 1.55, w: 3.0, h,
      fill: { color: C.bgCard },
      rectRadius: 0.1,
      line: { color: cat.color, width: 0.4, transparency: 70 },
    });
    // Top accent bar
    slide.addShape(pptx.ShapeType.rect, {
      x, y: 1.55, w: 3.0, h: 0.04,
      fill: { color: cat.color },
    });

    slide.addText(cat.title, {
      x: x + 0.15, y: 1.65, w: 2.7, h: 0.35,
      fontSize: 11, fontFace: FONT_BOLD, color: cat.color, bold: true,
      valign: 'middle',
    });

    cat.items.forEach((item, j) => {
      slide.addText('•  ' + item, {
        x: x + 0.15, y: 2.05 + j * 0.33, w: 2.7, h: 0.28,
        fontSize: 8, fontFace: FONT, color: C.grayLight,
        valign: 'middle',
      });
    });
  });

  // Bottom: Why this stack
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.4, y: 4.4, w: 9.2, h: 1.0,
    fill: { color: C.bgCard },
    rectRadius: 0.1,
  });
  slide.addText('💡  Why This Stack?', {
    x: 0.6, y: 4.48, w: 4, h: 0.3,
    fontSize: 11, fontFace: FONT_BOLD, color: C.accent, bold: true,
    valign: 'middle',
  });
  slide.addText(
    'Gemini handles multimodal understanding (vision, audio, documents, text) in a single API — no need for custom OCR, speech recognition, or NLP pipelines. ' +
    'Next.js + Tailwind + shadcn/ui deliver a polished frontend rapidly, while Firebase removes backend infrastructure overhead. ' +
    'This lets a small team focus on product quality rather than plumbing.',
    {
      x: 0.6, y: 4.78, w: 8.8, h: 0.55,
      fontSize: 9, fontFace: FONT, color: C.gray,
      valign: 'top', lineSpacing: 13,
    }
  );
}

// ══════════════════════════════════════════════════
// SLIDE 7 — IMPACTS
// ══════════════════════════════════════════════════
{
  const slide = pptx.addSlide();
  addBg(slide);
  addSectionNum(slide, '06', 'Real-World Impact');

  slide.addText('Applications & Impact', {
    x: 0.6, y: 0.75, w: 7, h: 0.55,
    fontSize: 24, fontFace: FONT_BOLD, color: C.white, bold: true,
    valign: 'middle',
  });
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.6, y: 1.3, w: 1.5, h: 0.003,
    fill: { color: C.accent },
  });

  // Use case cards - 3x2 grid
  const useCases = [
    { icon: '🚗', title: 'Insurance Claims', desc: 'Real-time claim validation, damage progression analysis, fraud detection, and automated evidence completeness checks.', color: C.accent },
    { icon: '🔍', title: 'Missing Persons', desc: 'Cross-reference photos, witness statements, location data, and timestamps to reconstruct movement patterns.', color: C.purple },
    { icon: '📰', title: 'Journalism', desc: 'Verify sources, detect photo/video manipulation, cross-check timestamps, and identify contradictions in statements.', color: C.gold },
    { icon: '🏢', title: 'Corporate Incidents', desc: 'Document workplace incidents from mixed evidence with explainable timelines for compliance and legal review.', color: C.green },
    { icon: '👮', title: 'Law Enforcement', desc: 'Organize chaotic evidence into structured investigation timelines with entity relationship tracking.', color: C.rose },
    { icon: '🔐', title: 'Cybersecurity', desc: 'Correlate incident screenshots, system logs, and communication records for post-incident documentation.', color: C.accent2 },
  ];

  useCases.forEach((uc, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = 0.4 + col * 3.1;
    const y = 1.55 + row * 1.85;

    slide.addShape(pptx.ShapeType.rect, {
      x, y, w: 2.9, h: 1.65,
      fill: { color: C.bgCard },
      rectRadius: 0.1,
      line: { color: uc.color, width: 0.3, transparency: 75 },
    });
    // Icon circle
    slide.addShape(pptx.ShapeType.ellipse, {
      x: x + 0.15, y: y + 0.12, w: 0.4, h: 0.4,
      fill: { color: uc.color, transparency: 80 },
    });
    slide.addText(uc.icon, {
      x: x + 0.15, y: y + 0.12, w: 0.4, h: 0.4,
      fontSize: 16, align: 'center', valign: 'middle',
    });
    slide.addText(uc.title, {
      x: x + 0.65, y: y + 0.12, w: 2.0, h: 0.4,
      fontSize: 13, fontFace: FONT_BOLD, color: C.white, bold: true,
      valign: 'middle',
    });
    slide.addText(uc.desc, {
      x: x + 0.15, y: y + 0.6, w: 2.6, h: 0.9,
      fontSize: 9, fontFace: FONT, color: C.gray,
      valign: 'top', lineSpacing: 13,
    });
  });

  // Bottom: Measurable benefits
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.4, y: 5.15, w: 9.2, h: 0.35,
    fill: { color: C.bgCard },
    rectRadius: 0.06,
    line: { color: C.accent, width: 0.3, transparency: 70 },
  });
  slide.addText('📊  70% faster evidence organization  •  Real-time contradiction detection  •  AI-guided evidence collection  •  Explainable confidence scoring', {
    x: 0.6, y: 5.15, w: 8.8, h: 0.35,
    fontSize: 9.5, fontFace: FONT, color: C.accent,
    valign: 'middle', bold: true,
  });
}

// ══════════════════════════════════════════════════
// SLIDE 8 — CONCLUSION
// ══════════════════════════════════════════════════
{
  const slide = pptx.addSlide();
  addBg(slide);

  // Decorative elements
  slide.addShape(pptx.ShapeType.ellipse, {
    x: -1, y: -1, w: 4, h: 4,
    fill: { color: C.accent, transparency: 95 },
  });
  slide.addShape(pptx.ShapeType.ellipse, {
    x: 7.5, y: 3, w: 3.5, h: 3.5,
    fill: { color: C.accent2, transparency: 93 },
  });

  // Center content
  slide.addText('ECHOTRACE AI', {
    x: 1, y: 0.8, w: 8, h: 0.7,
    fontSize: 36, fontFace: FONT_BOLD, color: C.white, bold: true,
    align: 'center', valign: 'middle',
  });

  slide.addText('From Scattered Evidence to Clear Truth', {
    x: 1, y: 1.5, w: 8, h: 0.5,
    fontSize: 18, fontFace: FONT, color: C.accent,
    align: 'center', valign: 'middle', italic: true,
  });

  // Divider
  slide.addShape(pptx.ShapeType.rect, {
    x: 4, y: 2.2, w: 2, h: 0.003,
    fill: { color: C.accent },
  });

  // Summary points
  const points = [
    'Transforms investigations by replacing fragmented single-modality tools with a unified multimodal reasoning platform',
    'Gemini reasons across images, audio, PDFs, and text simultaneously — an investigation engine, not a chatbot',
    'Real-time guidance: Live Copilot, Contradiction Detector, and Evidence Quality Scanner during evidence collection',
    'Built on a modern, scalable stack — Next.js, Tailwind, Firebase, Gemini — ready for production',
  ];

  points.forEach((p, i) => {
    const y = 2.5 + i * 0.55;
    const x = 1.5;

    slide.addShape(pptx.ShapeType.ellipse, {
      x: x - 0.25, y: y + 0.08, w: 0.12, h: 0.12,
      fill: { color: C.accent },
    });
    slide.addText(p, {
      x, y, w: 7, h: 0.45,
      fontSize: 10.5, fontFace: FONT, color: C.grayLight,
      valign: 'middle', lineSpacing: 14,
    });
  });

  // Future Scope
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.6, y: 4.7, w: 8.8, h: 0.75,
    fill: { color: C.bgCard },
    rectRadius: 0.08,
    line: { color: C.accent, width: 0.3, transparency: 75 },
  });
  slide.addText('🔭  Future Scope', {
    x: 0.8, y: 4.75, w: 3, h: 0.25,
    fontSize: 10, fontFace: FONT_BOLD, color: C.accent, bold: true,
    valign: 'middle',
  });
  slide.addText('Real-time evidence capture assistant  •  Weather/traffic API integration  •  Duplicate claim detection  •  Automated PDF report generation  •  Mobile app for on-scene collection', {
    x: 0.8, y: 5.0, w: 8.4, h: 0.4,
    fontSize: 8.5, fontFace: FONT, color: C.gray,
    valign: 'middle',
  });

  // Tagline at bottom
  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 5.59, w: 10, h: 0.04,
    fill: { color: C.accent },
  });
  slide.addText('"Turn scattered evidence into an explainable investigation timeline."', {
    x: 0.5, y: 5.2, w: 9, h: 0.35,
    fontSize: 10, fontFace: FONT, color: C.gray, italic: true,
    align: 'center', valign: 'middle',
  });
}

// ── Save ──
const outPath = 'E:/Gemini/echotrace/EchoTrace_AI_Presentation.pptx';
await pptx.writeFile({ fileName: outPath });

console.log(`✅ Presentation saved to: ${outPath}`);
console.log(`📊 8 slides generated successfully.`);
