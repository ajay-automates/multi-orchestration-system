# 🚀 Quick Reference Card - Phase 1

## Start/Stop Commands

```bash
# Start everything
docker-compose up --build

# Start in background
docker-compose up -d --build

# Stop everything
docker-compose down

# Stop and remove volumes (fresh start)
docker-compose down -v

# View running services
docker-compose ps

# View logs
docker-compose logs -f

# Restart a service
docker-compose restart orchestration-hub
```

## URLs

| Service | URL | Purpose |
|---------|-----|---------|
| Dashboard | <http://localhost:3000> | Main monitoring UI |
| Orchestration Hub | <http://localhost:3001> | Central API |
| Email Blast | <http://localhost:3010> | Project 1 |
| Chatbot | <http://localhost:3011> | Project 2 |
| Social Media | <http://localhost:3012> | Project 3 |
| PostgreSQL | localhost:5432 | Database |
| Redis | localhost:6379 | Cache/Queue |

## API Endpoints

### Orchestration Hub

```bash
# Health check
curl http://localhost:3001/health

# All project statuses
curl http://localhost:3001/api/projects/status

# Specific project metrics
curl http://localhost:3001/api/metrics/email-blast

# Historical data (last 24 hours)
curl http://localhost:3001/api/history/email-blast?hours=24

# WebSocket
ws://localhost:3001/ws/status
```

### Individual Projects

```bash
# Health
curl http://localhost:3010/health

# Metrics
curl http://localhost:3010/metrics

# Status
curl http://localhost:3010/status

# Logs
curl http://localhost:3010/logs?limit=100
```

## Database Commands

```bash
# Connect to database
docker exec -it multiorchestretor-postgres-1 psql -U postgres -d orchestration

# Inside psql:
\dt                                    # List tables
\d project_status_history              # Describe table

SELECT COUNT(*) FROM project_status_history;
SELECT COUNT(*) FROM project_metrics;

SELECT project_name, status, uptime_percentage, recorded_at 
FROM project_status_history 
ORDER BY recorded_at DESC 
LIMIT 10;

SELECT project_name, cpu_usage_percent, memory_usage_percent, recorded_at
FROM project_metrics
ORDER BY recorded_at DESC
LIMIT 10;

\q                                     # Quit
```

## Troubleshooting

```bash
# Check Docker is running
docker --version
docker-compose --version

# Check for port conflicts
netstat -ano | findstr "3000 3001 5432"

# View service logs
docker-compose logs orchestration-hub
docker-compose logs dashboard
docker-compose logs email-blast

# Restart a stuck service
docker-compose restart orchestration-hub

# Full reset
docker-compose down -v
docker-compose up --build

# Remove all Docker containers/images (nuclear option)
docker system prune -a
```

## File Locations

```
MULTIORCHESTRETOR/
├── orchestration-hub/src/     # Hub source code
├── dashboard/app/             # Dashboard pages
├── projects/                  # Three mock projects
├── docker-compose.yml         # Service orchestration
├── init.sql                   # Database schema
├── start.bat                  # Quick start script
└── README.md                  # Full documentation
```

## Environment Variables

Edit `.env` to configure:

- `PROJECTS` - Projects to monitor
- `DB_*` - Database settings
- `LOG_LEVEL` - Logging verbosity
- `PORT` - Orchestration hub port

## Health Status Colors

- 🟢 **Green** = Healthy (all systems operational)
- 🟡 **Yellow** = Degraded (partial functionality)
- 🔴 **Red** = Down (service unavailable)

## Monitoring Intervals

- Health checks: Every **10 seconds**
- Metrics collection: Every **30 seconds**
- Dashboard updates: **Real-time** via WebSocket

## Success Checklist

- [ ] All 7 containers running (`docker-compose ps`)
- [ ] Dashboard loads at <http://localhost:3000>
- [ ] All 3 projects show green status
- [ ] WebSocket connected (green dot in dashboard)
- [ ] Database contains records (`SELECT COUNT(*)...`)
- [ ] API endpoints respond (`curl http://localhost:3001/health`)

## Common Issues

**Dashboard stuck on "Loading..."**
→ Check orchestration-hub logs: `docker-compose logs orchestration-hub`

**Projects show as "down"**
→ Verify containers running: `docker-compose ps`
→ Check project logs: `docker-compose logs email-blast`

**Database errors**
→ Wait 30 seconds for initialization
→ Check: `docker-compose logs postgres`

**Port already in use**
→ Find process: `netstat -ano | findstr "3000"`
→ Kill process or change port in docker-compose.yml

## Next Steps

1. ✅ Verify all services running
2. ✅ Open dashboard and confirm 3 projects visible
3. ✅ Test API endpoints with curl
4. ✅ Check database has data
5. ✅ Simulate failure (stop a service)
6. ✅ Watch recovery in dashboard
7. 🎯 Move to Phase 2 (AI Agents)

---

**Need help?** See README.md for detailed documentation
**Found a bug?** Check BUILD_SUMMARY.md for troubleshooting
