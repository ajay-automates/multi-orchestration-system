<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=15,22,28&height=170&section=header&text=Multi-Orchestration%20System&fontSize=40&fontAlignY=35&animation=twinkling&fontColor=ffffff&desc=AI-Powered%20Self-Healing%20Infrastructure%20%7C%20Claude%20AI&descAlignY=55&descSize=18" width="100%" />

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](.)
[![Claude AI](https://img.shields.io/badge/Claude_3.5-Reasoning-8B5CF6?style=for-the-badge&logo=anthropic&logoColor=white)](.)
[![Supabase](https://img.shields.io/badge/Supabase-Real--Time-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](.)
[![Fastify](https://img.shields.io/badge/Fastify-Server-000000?style=for-the-badge&logo=fastify&logoColor=white)](.)
[![Next.js](https://img.shields.io/badge/Next.js-Dashboard-000000?style=for-the-badge&logo=next.js&logoColor=white)](.)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

**Autonomous system that monitors, analyzes, and repairs itself using Claude AI. Detects anomalies. Fixes them. No human intervention.**

[Quick Start](#quick-start) · [Architecture](#project-structure) · [Test the AI](#test-the-ai) · [Dashboard](#dashboard-features)

</div>

---

## What This Does

A **fully autonomous orchestration system** that monitors multiple projects in real-time, detects anomalies using intelligent agents, analyzes problems with Claude AI, repairs itself without human intervention, and learns from every decision.

---

## System Flow

```
Project Health Monitored (10s intervals)
        │
        ▼
HealthMonitorAgent detects failure
        │
        ▼
MetricsAnalyzerAgent identifies anomaly pattern
        │
        ▼
AutoFixerAgent calls Claude AI
        │
        ├──→ Claude analyzes metrics + context
        ├──→ Recommends action with confidence score
        └──→ If confidence > 70%: execute automatically
              If confidence < 70%: escalate to human
        │
        ▼
Action executed (restart / clear cache / pause service)
        │
        ▼
Audit trail logged in Supabase
Dashboard updates in real-time via WebSocket
```

---

## Capabilities

| Phase | Feature | Status |
|-------|---------|--------|
| **Phase 1: Observability** | Real-time health monitoring (10s intervals), metrics collection, Supabase integration, Next.js dashboard | ✅ |
| **Phase 2: Intelligence** | Event-driven pub/sub, HealthMonitorAgent, MetricsAnalyzerAgent, WebSocket streaming | ✅ |
| **Phase 3: Autonomous Action** | AutoFixerAgent, ActionExecutor (restart, clear cache, pause), audit trail | ✅ |
| **Phase 4: AI Reasoning** | Claude 3.5 Sonnet integration, confidence scoring, autonomous execution | ✅ |

---

## Quick Start

```bash
git clone https://github.com/ajay-automates/multi-orchestration-system.git
cd multi-orchestration-system

# Install
cd orchestration-hub && npm install
cd ../dashboard && npm install

# Configure (see .env templates in repo)
# Start orchestration hub
cd orchestration-hub && npm run dev    # http://localhost:4001

# Start dashboard
cd dashboard && npm run dev            # http://localhost:3000
```

---

## Test the AI

Trigger an anomaly and watch Claude analyze and fix it:

```bash
curl -X POST http://localhost:4001/api/test/anomaly \
  -H "Content-Type: application/json" \
  -d '{"projectName": "email-blast", "type": "high_memory"}'
```

**What happens:** System detects anomaly → AutoFixerAgent calls Claude → Claude analyzes metrics → If confidence > 70%, action executes automatically → Dashboard shows real-time AI decision.

Available test types: `high_memory` (triggers cache clearing), `high_cpu` (triggers service pause), `high_error` (triggers service restart).

---

## Project Structure

```
multi-orchestration-system/
├── orchestration-hub/          # The Brain
│   ├── src/
│   │   ├── agents/
│   │   │   ├── HealthMonitorAgent.ts
│   │   │   ├── MetricsAnalyzerAgent.ts
│   │   │   └── AutoFixerAgent.ts
│   │   ├── services/
│   │   │   ├── EventBus.ts
│   │   │   ├── ProjectMonitor.ts
│   │   │   ├── ActionExecutor.ts
│   │   │   └── ClaudeAnalyzer.ts
│   │   └── index.ts
├── dashboard/                  # The UI
│   └── app/page.tsx
└── projects/                   # Mock Services
```

---

## Dashboard Features

| Feature | Details |
|---------|---------|
| **Real-Time Status** | Live project health indicators |
| **Agent Activity Log** | Every decision and action logged |
| **Metrics Charts** | CPU, memory, error rates over time |
| **AI Decisions** | View Claude's reasoning for each action |
| **Historical Data** | Query past events and metrics |

---

## Tech Stack

`TypeScript` `Node.js` `Fastify` `Next.js` `Supabase` `Claude AI` `WebSocket` `Event-Driven Architecture`

---

## Related Projects

| Project | Description |
|---------|-------------|
| [AI Code Review Bot](https://github.com/ajay-automates/ai-code-review-bot) | Automated PR reviews via Claude + GitHub Actions |
| [Social Media Automator](https://github.com/ajay-automates/social-media-automator) | Multi-platform SaaS with 6 AI agents |

---

<div align="center">

**Built by [Ajay Kumar Reddy Nelavetla](https://github.com/ajay-automates)** · December 2025

*Infrastructure that fixes itself. For real.*

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=15,22,28&height=100&section=footer" width="100%" />

</div>
