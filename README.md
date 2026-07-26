<div align="center">

# 🕵️ EchoTrace AI

**Multimodal Investigation Intelligence Platform**

> **Turn scattered evidence into an explainable investigation timeline.**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-06B6D4?style=flat&logo=tailwindcss)](https://tailwindcss.com/)
[![Gemini](https://img.shields.io/badge/Gemini-1.5-8E75B2?style=flat&logo=googlegemini)](https://ai.google.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=flat&logo=firebase)](https://firebase.google.com/)
[![Express](https://img.shields.io/badge/Express-4-000000?style=flat&logo=express)](https://expressjs.com/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen?style=flat)]()

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [API Reference](#-api-reference)
- [Use Cases](#-use-cases)
- [Development Roadmap](#-development-roadmap)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🔍 Overview

EchoTrace AI is a **multimodal investigation assistant** that reconstructs event timelines from mixed evidence — photos, screenshots, voice notes, PDFs, maps, and text messages. Instead of acting as a simple chatbot, it functions as a **reasoning engine over heterogeneous evidence**, analyzing relationships across all uploaded files to detect contradictions, extract entities, and produce interactive timelines with confidence scores.

### Why EchoTrace AI?

Traditional investigation tools handle only **one modality at a time** — separate tools for OCR, speech recognition, document parsing, and image analysis. Critical connections between evidence pieces are missed, contradictions go undetected, and timelines remain disconnected. EchoTrace AI solves this by leveraging **Google Gemini's multimodal reasoning** capabilities to analyze everything together in a single pass.

---

## ✨ Key Features

### 🧠 Live Claim Guardian
Continuously evaluates claims in real-time as each document or photo is uploaded. The dashboard updates instantly — damage detected, vehicle matched, timeline mismatches flagged, invoice anomalies highlighted.

### ⏱️ Interactive Timeline Builder
Automatically constructs a chronological evidence timeline with confidence scores for every extracted event. Visualize the sequence of events with linked evidence references.

### ⚡ Contradiction Detector
AI-powered cross-referencing across all evidence modalities. Detects mismatches between witness statements, timestamps, visual evidence, and documents — with confidence scoring for each finding.

### 👤 Entity Extraction & Relationship Graph
Extracts people, vehicles, locations, objects, and organizations from all evidence types. Visualize connections through an interactive evidence graph built with React Flow.

### 📸 AI Evidence Quality Scanner
Before analysis begins, scans each piece of evidence for quality — blur detection, visibility checks, completeness assessment. Tells users exactly which photos need retaking before leaving the scene.

### 🤖 Live Copilot
Real-time streaming analysis progress as evidence is processed. Watch as the AI reads documents, analyzes photos, extracts entities, builds timelines, detects contradictions, and maps relationships — all in real-time.

### 📊 Claim Confidence Meter
Dynamic confidence scoring that changes based on evidence quality and completeness. Each change is explained — "Invoice validates repair estimate: +12%" — providing transparency into the AI's reasoning.

### 💬 Smart Investigation Assistant
Ask complex questions about your evidence: "Show every place where Person A appears", "Which evidence contradicts Witness 2?", "What evidence is missing?" — answered with cited source references.

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          FRONTEND (Next.js 15)                           │
│  ┌────────────────┐ ┌────────────────┐ ┌──────────────────────────────┐  │
│  │   Timeline      │ │  Evidence      │ │  Entity Explorer             │  │
│  │   View          │ │  Graph         │ │  + Filtering                 │  │
│  │                 │ │  (React Flow)  │ │                              │  │
│  └───────┬─────────┘ └───────┬────────┘ └──────────┬───────────────────┘  │
│          │                   │                      │                      │
│          └───────────────────┴──────────────────────┘                      │
│                                    │                                       │
│                           ┌────────┴────────┐                              │
│                           │  TanStack Query  │                              │
│                           │  (Caching +      │                              │
│                           │   API State)     │                              │
│                           └────────┬────────┘                              │
│                                    │                                       │
│                         Tailwind CSS + shadcn/ui + Framer Motion           │
└────────────────────────────────────┼───────────────────────────────────────┘
                                     │ REST API (Next.js Rewrites)
┌────────────────────────────────────┼───────────────────────────────────────┐
│                      BACKEND (Node.js + Express)                            │
│  ┌────────────────┐ ┌────────────────┐ ┌──────────────────────────────┐   │
│  │  Evidence       │ │  Analysis      │ │  Contradiction               │   │
│  │  Service        │ │  Pipeline      │ │  Detector                    │   │
│  │  (Upload,       │ │  (Orchestrate  │ │  (Cross-reference all        │   │
│  │   Validate)     │ │   AI calls)    │ │   extractions)               │   │
│  └───────┬─────────┘ └───────┬────────┘ └──────────┬───────────────────┘   │
│          │                   │                      │                      │
│          └───────────────────┼──────────────────────┘                      │
│                              │                                              │
│                    ┌─────────┴─────────┐                                   │
│                    │   Gemini API 1.5   │                                   │
│                    │  (Flash / Pro)     │                                   │
│                    │                    │                                   │
│                    │  Vision • Audio    │                                   │
│                    │  Document • Text   │                                   │
│                    └─────────┬─────────┘                                   │
│                              │                                              │
│                    Zod Validation Layer                                     │
└────────────────────────────────┼───────────────────────────────────────────┘
                                 │
┌────────────────────────────────┼───────────────────────────────────────────┐
│                      STORAGE LAYER                                         │
│  ┌─────────────────────────┐  ┌─────────────────────────────────────────┐  │
│  │  In-Memory Data Store   │  │  Local File System (uploads/)           │  │
│  │  • Investigations        │  │  • Evidence files (images, audio, PDFs) │  │
│  │  • Entities & Timelines  │  │  • Hot data cache for fast retrieval   │  │
│  │  • Analysis Results      │  │  • Upload validation & processing      │  │
│  └─────────────────────────┘  └─────────────────────────────────────────┘  │
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────┐   │
│  │  Firebase Firestore / Storage / Auth  (planned for production)      │   │
│  └────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **User Uploads** → Mixed evidence (images, audio, PDFs, text) through Next.js frontend
2. **Storage** → Files saved to Firebase Storage; metadata indexed in Firestore
3. **Analysis Pipeline** → Express API orchestrates Gemini API calls with all evidence
4. **AI Reasoning** → Gemini processes all modalities together — vision, audio, document understanding, and text
5. **Structured Output** → Gemini returns structured JSON (entities, events, contradictions, relationships, confidence scores)
6. **Post-Processing** → Contradiction Detector cross-references all extracted data; Timeline Builder constructs sequence
7. **Real-Time UI** → Results streamed to frontend across 5 interactive views — Timeline, Entities, Evidence, Compare, Overview
8. **Live Copilot** → Analysis progress streamed in real-time as each step completes

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| **Next.js 15** | React framework with SSR, file-based routing, API rewrites |
| **React 18** | UI component library |
| **TypeScript** | End-to-end type safety |
| **Tailwind CSS 3** | Utility-first styling with custom design system |
| **shadcn/ui** | Enterprise-quality component library (cards, dialogs, tables) |
| **Framer Motion** | Smooth animations — timeline transitions, card expansions, loading states |
| **React Flow** | Interactive evidence relationship graph visualization |
| **TanStack Query** | Server state management, caching, optimistic updates |

### Backend
| Technology | Purpose |
|-----------|---------|
| **Node.js** | JavaScript runtime |
| **Express** | REST API framework with Zod validation |
| **Concurrently** | Parallel dev server orchestration |

### AI & Intelligence
| Technology | Purpose |
|-----------|---------|
| **Gemini API 1.5 Flash/Pro** | Core multimodal reasoning — vision, audio, document, text understanding |
| **Custom Analysis Pipeline** | Orchestrates multi-step extraction with fallback strategies |

### Infrastructure
| Technology | Purpose |
|-----------|---------|
| **In-Memory Cache** | Fast evidence and investigation data store |
| **Firebase Firestore** *(planned)* | NoSQL database for investigations, entities, timelines |
| **Firebase Storage** *(planned)* | Evidence file hosting and retrieval |
| **Firebase Auth** *(planned)* | Authentication with Google Login |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+ (recommended: v20 LTS)
- **npm** v9+
- **Google Gemini API Key** — Get one from [Google AI Studio](https://aistudio.google.com/)
- **Firebase Project** — Create one at [Firebase Console](https://console.firebase.google.com/)

### Installation

```bash
# Clone the repository
git clone https://github.com/Jacksonfio/EchoTrace.git
cd EchoTrace

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys (see Configuration section)
```

### Configuration

Edit the `.env` file in the project root:

```env
# ── Gemini API ──
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash

# ── Firebase ──
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id

# ── Server ──
PORT=3001
NODE_ENV=development
```

### Development

```bash
# Start both frontend and backend in development mode
npm run dev

# Frontend will be at: http://localhost:3000
# Backend API will be at: http://localhost:3001
```

Or start them individually:

```bash
# Frontend only
npm run dev:frontend

# Backend only
npm run dev:server
```

### Build for Production

```bash
npm run build
```

### Type Checking

```bash
npm run typecheck
```

---

## 📁 Project Structure

```
echotrace/
├── apps/
│   └── frontend/                  # Next.js 15 application
│       ├── src/
│       │   ├── app/               # Next.js App Router pages
│       │   │   ├── page.tsx       # Main dashboard page
│       │   │   └── layout.tsx     # Root layout
│       │   └── components/        # React components
│       │       ├── AnalysisBar.tsx       # Live Copilot + Confidence + Quality
│       │       ├── ClaimConfidence.tsx   # Dynamic confidence meter
│       │       ├── ContradictionPanel.tsx # Contradiction detection display
│       │       ├── EntityRelations.tsx   # Entity explorer with filters
│       │       ├── EvidenceQuality.tsx   # Per-file quality scanner
│       │       ├── EvidenceTimeline.tsx  # Interactive timeline
│       │       ├── CaseNotes.tsx         # Investigator notes panel
│       │       ├── EvidenceGraph.tsx     # React Flow relationship graph
│       │       ├── CompareEvidence.tsx   # Side-by-side evidence comparison
│       │       ├── UploadZone.tsx        # Drag-and-drop upload
│       │       ├── LiveCopilot.tsx       # Real-time analysis streaming
│       │       └── FloatingChat.tsx      # AI investigation assistant
│       ├── next.config.js
│       ├── tailwind.config.js
│       └── tsconfig.json
│
├── server/                        # Express backend
│   ├── src/
│   │   ├── index.ts               # Server entry point
│   │   ├── routes/
│   │   │   ├── investigations.ts  # CRUD for investigations
│   │   │   ├── analyze.ts         # Analysis pipeline endpoint
│   │   │   ├── upload.ts          # File upload handling
│   │   │   └── chat.ts            # Investigation chat Q&A
│   │   └── services/
│   │       ├── gemini.ts          # Gemini API integration
│   │       ├── store.ts           # In-memory data store
│   │       └── analysis.ts        # Analysis orchestration
│   ├── tsconfig.json
│   └── package.json
│
├── shared/                        # Shared TypeScript types
│   ├── types/
│   │   ├── index.ts               # Core interfaces
│   │   └── prompts.ts             # Gemini prompt templates
│   ├── tsconfig.json
│   └── package.json
│
├── firebase/                      # Firebase configuration
├── docs/                          # Documentation
├── scripts/                       # Utility scripts
├── public/                        # Static assets
├── .env.example                   # Environment variable template
├── .gitignore
├── package.json                   # Workspace root
└── README.md                      # This file
```

---

## 📡 API Reference

### Investigations

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/investigations` | Create a new investigation |
| `GET` | `/api/investigations` | List all investigations |
| `GET` | `/api/investigations/:id` | Get investigation details with entities, timeline, contradictions |
| `DELETE` | `/api/investigations/:id` | Delete an investigation |
| `DELETE` | `/api/investigations` | Clear all investigations |

### Evidence

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/upload/:id/batch` | Upload evidence files to an investigation |

### Analysis

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/analyze/:id` | Run AI analysis on investigation evidence |

### Chat

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/chat/:id` | Ask questions about investigation evidence |

### Response Format

All API responses follow a consistent structure:

```json
{
  "success": true,
  "data": { ... },
  "error": null
}
```

Analysis results include structured entities, timeline events, contradictions, and relationships:

```json
{
  "entities": [
    { "id": "ent-1", "type": "Person", "name": "Unknown Male", "mentions": 3, "confidence": 92 },
    { "id": "ent-2", "type": "Vehicle", "name": "Dark Gray SUV", "confidence": 87 }
  ],
  "events": [
    { "id": "evt-1", "time": "08:42", "description": "Vehicle arrives at location", "confidence": 94 }
  ],
  "contradictions": [
    { "id": "con-1", "description": "Witness statement claims blue car, photo shows gray SUV", "severity": "high", "confidence": 90 }
  ]
}
```

---

## 🎯 Use Cases

### 🚗 Insurance Claim Investigation
Upload accident photos, policy documents, FIR reports, and witness statements. EchoTrace cross-references everything to validate the claim, detect fraud indicators, and assess damage progression in real-time.

### 🔍 Missing Person Investigation
Combine CCTV frames, WhatsApp conversations, voice notes, and GPS location data. The AI reconstructs the person's movement timeline and identifies discrepancies in witness accounts.

### 📰 Journalism Fact Verification
Upload interview recordings, screenshot evidence, photos, and documents. Detect contradictions between sources and verify the authenticity timeline of visual evidence.

### 🏢 Corporate Incident Investigation
Document workplace incidents with photos, emails, security footage frames, and incident reports. Generate explainable timelines for compliance and legal review.

### 👮 Law Enforcement Evidence Organization
Structure chaotic crime scene evidence — photos, witness statements, forensic reports, and call records — into a coherent, searchable investigation dashboard.

### 🔐 Cybersecurity Post-Incident Documentation
Correlate incident screenshots, system logs, communication records, and timeline data for comprehensive post-incident reporting.

---

## 🗺️ Development Roadmap

### ✅ Completed (MVP)
- [x] Drag-and-drop evidence upload (images, audio, PDFs, text)
- [x] Gemini-powered multimodal analysis pipeline
- [x] Entity extraction (people, vehicles, locations, organizations)
- [x] Automatic timeline generation with confidence scores
- [x] Contradiction detection with severity ratings
- [x] Interactive evidence relationship graph (React Flow)
- [x] Live Copilot — real-time streaming analysis progress
- [x] Evidence quality scanner — per-file quality assessment
- [x] Claim confidence meter with detailed breakdowns
- [x] Smart investigation assistant chat
- [x] Case notes with persistence
- [x] Side-by-side evidence comparison
- [x] Dark theme professional UI with animations

### 🔜 In Progress
- [ ] Real-time evidence capture assistant (AI guides camera for optimal collection)
- [ ] Environmental context verification (weather, traffic, location APIs)
- [ ] Duplicate claim detection across investigations
- [ ] Automated PDF report generation

### 🔮 Future
- [ ] Mobile app for on-scene evidence collection
- [ ] Multi-user collaboration with role-based access
- [ ] WebSocket/Socket.IO for true real-time streaming
- [ ] Advanced video frame extraction and analysis
- [ ] Integration with police and insurance databases
- [ ] Custom AI model fine-tuning for domain-specific investigations

---

## 🤝 Contributing

Contributions are welcome and appreciated! Here's how you can help:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

Please ensure your code passes the type checker before submitting:

```bash
npm run typecheck
```

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with ❤️ by Jackson JP** — [Panimalar Engineering College](https://www.panimalar.ac.in/)

**Powered by [Google Gemini](https://ai.google.dev/) · [Next.js](https://nextjs.org/) · [Firebase](https://firebase.google.com/)**

</div>
