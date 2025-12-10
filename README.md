# Multi-Orchestration System - Phase 1: Observability Foundation

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Docker](https://img.shields.io/badge/Docker-Required-blue.svg)](https://www.docker.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org/)

A production-ready multi-project orchestration and monitoring system with real-time observability, built with TypeScript, Next.js, and TimescaleDB.

![Dashboard Preview](https://via.placeholder.com/800x400/000000/00FF00?text=Multi-Orchestration+Dashboard)

## 🎯 Overview

This system provides **real-time monitoring and observability** for multiple automation projects. Phase 1 establishes the foundation with health monitoring, metrics collection, and a live dashboard.

### Key Features

- ✅ **Real-time Health Monitoring** - Checks every 10 seconds
- ✅ **Metrics Collection** - Performance data every 30 seconds
- ✅ **Live Dashboard** - WebSocket-powered real-time updates
- ✅ **Time-Series Database** - Efficient historical data storage with TimescaleDB
- ✅ **REST API** - Query status, metrics, and historical data
- ✅ **Docker Compose** - One-command deployment
- ✅ **Standardized Endpoints** - Consistent monitoring across all projects

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  Dashboard (Next.js + React)                 │
│                    http://localhost:4000                     │
└───────────────────────────┬─────────────────────────────────┘
                            │ WebSocket + REST API
┌───────────────────────────▼─────────────────────────────────┐
│            Orchestration Hub (Fastify + TypeScript)          │
│                    http://localhost:4001                     │
│  • Monitors project health every 10 seconds                  │
│  • Collects metrics every 30 seconds                         │
│  • Stores historical data in TimescaleDB                     │
└─────┬───────────────────────────────────────────────────────┘
      │
      ├──► PostgreSQL + TimescaleDB (Port 5432)
      ├──► Redis (Port 6379)
      │
      ├──► Email Blast Project (Port 4010)
      ├──► Chatbot Project (Port 4011)
      └──► Social Media Automator (Port 4012)
```

## 🚀 Quick Start

### Prerequisites

- **Docker Desktop** (version 20+)
- **Docker Compose** (version 2+)
- **Git** (for cloning)

### Installation

1. **Clone the repository**:

   ```bash
   git clone https://github.com/YOUR_USERNAME/multi-orchestration-system.git
   cd multi-orchestration-system
   ```

2. **Start all services**:

   ```bash
   docker compose up --build
   ```

3. **Access the dashboard**:
   - Open your browser to: **<http://localhost:4000>**

That's it! All 7 services will be running and monitoring each other.

## 📊 Services & Ports

| Service | Port | URL | Description |
|---------|------|-----|-------------|
| **Dashboard** | 4000 | <http://localhost:4000> | Real-time monitoring UI |
| **Orchestration Hub** | 4001 | <http://localhost:4001> | Central API & monitoring service |
| **Email Blast** | 4010 | <http://localhost:4010> | Mock automation project |
| **Chatbot** | 4011 | <http://localhost:4011> | Mock automation project |
| **Social Media** | 4012 | <http://localhost:4012> | Mock automation project |
| **PostgreSQL** | 5432 | localhost:5432 | TimescaleDB database |
| **Redis** | 6379 | localhost:6379 | Cache & message queue |

## 🔌 API Endpoints

### Orchestration Hub

```bash
# Health check
GET http://localhost:4001/health

# Get all project statuses
GET http://localhost:4001/api/projects/status

# Get metrics for a specific project
GET http://localhost:4001/api/metrics/:projectName

# Get historical data (last 24 hours by default)
GET http://localhost:4001/api/history/:projectName?hours=24

# WebSocket for real-time updates
ws://localhost:4001/ws/status
```

### Individual Projects

Each project exposes standardized endpoints:

```bash
# Health status
GET http://localhost:4010/health

# Performance metrics
GET http://localhost:4010/metrics

# Current status
GET http://localhost:4010/status

# Recent logs
GET http://localhost:4010/logs?limit=100
```

## 📁 Project Structure

```
multi-orchestration-system/
├── orchestration-hub/          # Central monitoring service
│   ├── src/
│   │   ├── index.ts           # Main Fastify server
│   │   ├── config.ts          # Configuration management
│   │   ├── database.ts        # PostgreSQL/TimescaleDB layer
│   │   ├── types.ts           # TypeScript definitions
│   │   └── services/
│   │       └── ProjectMonitor.ts  # Core monitoring logic
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
│
├── dashboard/                  # Next.js monitoring dashboard
│   ├── app/
│   │   ├── page.tsx           # Main dashboard page
│   │   ├── layout.tsx         # Root layout
│   │   └── globals.css        # Global styles
│   ├── Dockerfile
│   ├── package.json
│   └── tailwind.config.ts
│
├── projects/                   # Mock automation projects
│   ├── email-blast/
│   ├── chatbot/
│   └── social-media/
│
├── docker-compose.yml          # Service orchestration
├── init.sql                    # Database initialization
├── .gitignore
└── README.md
```

## 🛠️ Technology Stack

**Backend:**

- Node.js 20+
- TypeScript 5+
- Fastify 4+ (high-performance HTTP server)
- PostgreSQL 15+ with TimescaleDB 2+
- Redis 7+

**Frontend:**

- Next.js 14+ (App Router)
- React 18+
- Tailwind CSS 3+
- Framer Motion 10+ (animations)

**DevOps:**

- Docker & Docker Compose
- Multi-stage Docker builds
- Health checks & auto-restart

## 🧪 Testing

### Verify All Services

```bash
# Check running containers
docker compose ps

# View logs
docker compose logs -f

# Test orchestration hub
curl http://localhost:4001/api/projects/status

# Test individual projects
curl http://localhost:4010/health
curl http://localhost:4011/health
curl http://localhost:4012/health
```

### Database Queries

```bash
# Connect to PostgreSQL
docker exec -it multiorchestretor-postgres-1 psql -U postgres -d orchestration

# View status history
SELECT project_name, status, uptime_percentage, recorded_at 
FROM project_status_history 
ORDER BY recorded_at DESC 
LIMIT 10;

# View metrics
SELECT project_name, cpu_usage_percent, memory_usage_percent, recorded_at
FROM project_metrics
ORDER BY recorded_at DESC
LIMIT 10;
```

## 🔧 Configuration

All configuration is managed via environment variables. See `.env.example` for available options:

```env
NODE_ENV=development
PORT=4001
DB_HOST=postgres
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=orchestration
PROJECTS="email-blast:http://email-blast:3000,chatbot:http://chatbot:3000,social-media:http://social-media:3000"
LOG_LEVEL=info
```

## 📈 What Gets Monitored

### Health Metrics (Every 10 seconds)

- ✅ Service status (healthy/degraded/down)
- ✅ Response time
- ✅ Uptime percentage
- ✅ Last check timestamp

### Performance Metrics (Every 30 seconds)

- ✅ Requests per second
- ✅ Error rate & count
- ✅ Memory usage
- ✅ CPU usage
- ✅ API usage (flexible JSONB)
- ✅ Database query time

## 🐛 Troubleshooting

### Dashboard shows "Loading..."

```bash
# Check orchestration-hub logs
docker compose logs orchestration-hub

# Verify database is running
docker compose ps postgres
```

### Projects show as "down"

```bash
# Check all services
docker compose ps

# Restart a specific service
docker compose restart email-blast
```

### Port conflicts

```bash
# Check what's using the ports
netstat -ano | findstr "4000 4001"

# Change ports in docker-compose.yml if needed
```

### Full reset

```bash
# Stop and remove everything
docker compose down -v

# Rebuild and start fresh
docker compose up --build
```

## 🚦 Roadmap

This is **Phase 1** of a 5-phase system:

- ✅ **Phase 1: Observability Foundation** (Current)
  - Real-time monitoring
  - Metrics collection
  - Historical data storage
  - Live dashboard

- 🔄 **Phase 2: AI Agents** (Coming Soon)
  - Automated issue detection
  - Self-healing capabilities
  - Intelligent alerts

- 🔄 **Phase 3: Cross-Project Orchestration**
  - Workflow automation
  - Inter-project communication
  - Resource optimization

- 🔄 **Phase 4: Advanced Analytics**
  - Predictive monitoring
  - Performance optimization
  - Cost analysis

- 🔄 **Phase 5: Production Deployment**
  - Kubernetes deployment
  - High availability
  - Security hardening

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📧 Contact

For questions or support, please open an issue on GitHub.

---

**Built with ❤️ using TypeScript, Next.js, and TimescaleDB**

**⭐ Star this repo if you find it useful!**
