# Cursor Prompts: Complete Multi-Orchestration System with Supabase

## How to Use These Prompts

1. Open **Cursor** (you have it)
2. Click **Composer** (or Cmd+Shift+L)
3. **Copy-paste the prompt** below
4. **Hit Enter**
5. Cursor generates the code
6. Review + deploy

**That's it. Cursor does 80-90% of the work.**

---

# PHASE 1: OBSERVABILITY FOUNDATION

## Prompt 1: Database Setup (SQL for Supabase)

```
I'm building a multi-orchestration intelligence system. Create the PostgreSQL schema for Supabase that I'll use for monitoring 3 automation projects.

Create these tables:

1. project_status_history
   - id (bigserial primary key)
   - project_name (varchar)
   - status (varchar: healthy/degraded/down)
   - last_check (timestamp)
   - uptime_percentage (float)
   - response_time_ms (int)
   - error_message (text, nullable)
   - recorded_at (timestamp default now)

2. project_metrics
   - id (bigserial primary key)
   - project_name (varchar)
   - requests_per_second (float)
   - error_rate (float)
   - error_count (int)
   - api_usage (jsonb)
   - memory_usage_percent (float)
   - cpu_usage_percent (float)
   - database_query_time_ms (int)
   - recorded_at (timestamp default now)

3. system_health
   - id (bigserial primary key)
   - orchestration_hub_status (varchar)
   - database_status (varchar)
   - last_check (timestamp)
   - recorded_at (timestamp default now)

4. agent_events (for Phase 2)
   - id (bigserial primary key)
   - project_name (varchar)
   - event_type (varchar)
   - description (text)
   - severity (varchar: info/warning/critical)
   - metadata (jsonb)
   - occurred_at (timestamp default now)

5. action_history (for Phase 3)
   - id (bigserial primary key)
   - project_name (varchar)
   - action_type (varchar)
   - status (varchar: pending/approved/executing/completed/failed)
   - triggered_by (varchar)
   - result (text, nullable)
   - executed_at (timestamp)
   - created_at (timestamp default now)

Include:
- Proper indexes for fast queries: (project_name, recorded_at DESC)
- Enable RLS (row level security) - basic setup
- Add comments explaining each table
- Make it ready for TimescaleDB hypertables (recorded_at will be time dimension)

Provide complete SQL ready to paste into Supabase SQL editor.
```

---

## Prompt 2: Next.js Dashboard with Supabase

```
Create a production-ready Next.js dashboard that monitors 3 automation projects with real-time updates from Supabase.

Requirements:
- Next.js 14+ with TypeScript
- Supabase real-time subscriptions (NOT polling)
- Dark theme with Tailwind CSS
- Components needed:
  * Dashboard page showing 3 project cards
  * Each project card: name, status indicator (red/yellow/green), uptime %, response time ms
  * Metrics section with charts for error rate, CPU, memory usage
  * System health indicator
  * Auto-refresh when Supabase data changes (real-time)

Implementation:
- Use @supabase/supabase-js client library
- Subscribe to project_status_history real-time changes
- Subscribe to project_metrics real-time changes
- Use recharts for metric visualization
- Environment variables: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
- Fully typed with TypeScript
- Professional UI (no generic look)
- Responsive design
- Loading states while connecting to Supabase
- Error handling if Supabase is down
- Show last update timestamp

File structure:
- app/page.tsx (main dashboard)
- app/layout.tsx (layout with styles)
- components/ProjectCard.tsx
- components/MetricsChart.tsx
- components/SystemHealth.tsx
- lib/supabase.ts (Supabase client setup)
- package.json with dependencies

Ready to deploy to Vercel. Include instructions.
```

---

## Prompt 3: Node.js Orchestration Hub

```
Create a Node.js service that monitors 3 automation projects and stores data in Supabase.

Requirements:
- Node.js 18+ with TypeScript
- Fastify framework (lightweight, fast)
- Supabase client for database writes
- Continuous monitoring (every 10 seconds for health, every 30 seconds for metrics)

Functionality:
1. Check /health endpoint on each project:
   - http://localhost:3010/health (email-blast)
   - http://localhost:3011/health (chatbot)
   - http://localhost:3012/health (social-media)
   - Store results in project_status_history table

2. Check /metrics endpoint on each project:
   - Same URLs
   - Store in project_metrics table

3. Error handling:
   - If endpoint doesn't respond in 5 seconds, mark as 'down'
   - Catch errors, don't crash
   - Log all activities

4. API endpoints:
   - GET /health (returns hub status)
   - GET /api/status (returns current status of all 3 projects)
   - GET /api/metrics/:projectName (returns latest metrics)

5. WebSocket (optional):
   - WS /ws/status (send updates to connected clients)
   - Send updates every 10 seconds

Environment variables:
- SUPABASE_URL
- SUPABASE_KEY
- PROJECT_ENDPOINTS (JSON array of projects)

File structure:
- src/index.ts (main server)
- src/services/ProjectMonitor.ts (monitoring logic)
- src/services/supabaseClient.ts (Supabase setup)
- src/types.ts (TypeScript interfaces)
- package.json
- Dockerfile (for later)
- .env.example

Fully typed, production-ready, with proper logging.
Ready to deploy to Railway or Supabase Edge Functions.
```

---

## Prompt 4: Environment Setup Guide

```
Create a complete setup guide (.env.example and instructions) for deploying the multi-orchestration system with Supabase.

What to include:
1. Supabase setup:
   - Create Supabase project
   - Get API URL and API key
   - Create database tables (provide the SQL)
   - Enable real-time
   
2. Environment variables needed:
   For Supabase:
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   
   For orchestration hub:
   - SUPABASE_URL
   - SUPABASE_SERVICE_KEY (NOT anon key)
   - PROJECT_ENDPOINTS (JSON with 3 projects)
   - HUB_PORT

3. Local development setup:
   - npm install instructions
   - npm run dev for each component
   - How to test health endpoints

4. Deployment:
   - Dashboard: Deploy to Vercel (step-by-step)
   - Hub: Deploy to Railway or Supabase Edge Functions
   - Domain setup

5. Verification checklist:
   - Is Supabase connected?
   - Are health endpoints responding?
   - Are metrics being stored?
   - Is dashboard showing real-time updates?

Format as markdown with code blocks. Make it copy-paste friendly.
```

---

# PHASE 2: DISTRIBUTED INTELLIGENCE

## Prompt 5: Agent Framework

```
Create a TypeScript agent framework for autonomous system analysis.

Requirements:
- Abstract base Agent class
- Agent lifecycle: initialize → run → shutdown
- Subscribe to Supabase real-time events
- Publish events to event bus
- Type-safe with full TypeScript

Agent interface:
- constructor(name: string)
- abstract run(): Promise<void> (main agent logic)
- subscribe(table: string, callback: Function)
- publish(eventType: string, data: any)
- logger (structured logging)
- error handling (don't crash on errors)

Concrete agents to create:
1. HealthMonitorAgent
   - Subscribes to project_status_history
   - Detects when status changes
   - Publishes: ProjectHealthChanged, ProjectDown, ProjectDegraded events

2. MetricsAnalyzerAgent
   - Subscribes to project_metrics
   - Detects anomalies:
     * CPU > 80%
     * Memory > 85%
     * Error rate > 5%
     * Response time > 1000ms
   - Publishes: AnomalyDetected event with details

Event bus:
- Simple publish/subscribe using EventEmitter
- Events stored in Supabase agent_events table
- Real-time capable

File structure:
- src/agents/Agent.ts (base class)
- src/agents/HealthMonitorAgent.ts
- src/agents/MetricsAnalyzerAgent.ts
- src/services/EventBus.ts
- src/types.ts

Fully typed, production-ready. Ready to integrate with orchestration hub.
```

---

## Prompt 6: Real-time Event System

```
Create a real-time event system that connects agents to Supabase.

Requirements:
- Event bus that agents publish to
- Publish events to Supabase agent_events table
- Subscribe to specific event types
- Real-time broadcasting to connected clients

Implementation:
- Use Supabase real-time for subscriptions
- Store events in agent_events table with timestamp
- Include metadata (project_name, severity, details)
- Publish different event types:
  * ProjectDown
  * ProjectDegraded
  * AnomalyDetected (CPU high, memory high, etc.)
  * HealthMonitorStarted
  * MetricsAnalyzed

Features:
- Event filtering by type and project
- Real-time push to WebSocket clients
- Event logging and history
- Error handling

File structure:
- src/services/EventBus.ts
- src/services/EventPublisher.ts
- Integration with WebSocket from hub

Make it compatible with dashboard WebSocket endpoint.
Fully typed, production-ready.
```

---

# PHASE 3: AUTONOMOUS ACTION

## Prompt 7: Action System

```
Create an action system for autonomous repairs.

Requirements:
- Action base class with metadata
- Specific action types:
  * RestartService (restart a project)
  * PauseService (pause task processing)
  * ClearCache (clear memory)
  * RollbackDeployment (rollback to previous version)

State machine for actions:
- pending → approved → executing → completed (or failed)
- Track state transitions with timestamps
- Store in action_history table

Validation:
- Validate action can be executed
- Check prerequisites
- Get approval if critical

Execution:
- Actually execute the action (HTTP calls to project endpoints)
- Capture result/output
- Log execution details
- Handle failures gracefully

Audit logging:
- Every action logged in action_history
- Include: who triggered, when, what happened, result
- Immutable (insert-only, no updates)

Rollback capability:
- Can undo some actions
- Track which actions are reversible

File structure:
- src/actions/Action.ts (base class)
- src/actions/RestartService.ts
- src/actions/PauseService.ts
- src/actions/ClearCache.ts
- src/actions/RollbackDeployment.ts
- src/services/ActionExecutor.ts
- src/services/ActionApprover.ts

Fully typed, production-ready.
```

---

## Prompt 8: Auto-Fixer Agent

```
Create an Auto-Fixer Agent that automatically fixes problems.

Requirements:
- Subscribes to AnomalyDetected events
- Decides which action to execute:
  * High memory → ClearCache
  * High CPU → PauseService
  * Service down → RestartService
  * High error rate → RollbackDeployment

Implementation:
- Analyze anomaly details
- Choose appropriate action
- Execute action via ActionExecutor
- Track attempt count (max 3 attempts)
- If 3 failures, escalate to human (publish Escalation event)
- Publish ActionExecuted or ActionFailed event

Circuit breaker:
- If same action fails 3 times on same project
- Stop trying for 30 minutes
- Publish CircuitBreakerTriggered event

Decision logic:
- Simple rules engine
- Log all decisions
- Type-safe

Integration:
- Works with Action system
- Works with EventBus
- Stores results in action_history

File structure:
- src/agents/AutoFixerAgent.ts
- src/services/ActionSelector.ts
- src/services/CircuitBreaker.ts

Fully typed, production-ready.
Include extensive logging for debugging.
```

---

# PHASE 4: AI REASONING

## Prompt 9: Claude API Integration

```
Create Claude API integration for intelligent decision-making.

Requirements:
- Use @anthropic-ai/sdk
- Take context as input:
  * Recent logs
  * Metrics history
  * Previous actions taken
  * Event history
- Call Claude to analyze
- Get recommendation with reasoning
- Extract structured response

Implementation:
- Prompt engineering for multi-orchestration context
- Ask Claude: "Given this system state, what should we do?"
- Parse Claude's response to extract:
  * Recommended action
  * Confidence score (0-1)
  * Reasoning explanation
  * Alternative actions

Handling:
- Rate limiting (track API calls)
- Cost optimization (batch requests)
- Error handling if API fails
- Cache responses for similar situations

Function signature:
- analyzeWithClaude(context: SystemContext): Promise<Decision>
- Where Decision = { action, confidence, reasoning, alternatives }

File structure:
- src/services/ClaudeAnalyzer.ts
- src/types/Decision.ts
- src/prompts/analysis-prompt.ts

Environment:
- ANTHROPIC_API_KEY

Fully typed, production-ready.
Include cost tracking.
```

---

## Prompt 10: Decision-Making Agent

```
Create a Decision-Making Agent that uses Claude for complex decisions.

Requirements:
- Subscribes to complex anomalies
- Gathers context:
  * Current metrics for affected project
  * Recent logs (last 50 entries)
  * Similar incidents in history
  * Previous actions tried and their outcomes
  * System state (other projects, overall health)

Processing:
1. Receive AnomalyDetected event
2. Gather context from Supabase
3. Call ClaudeAnalyzer with context
4. Get recommendation (action + confidence)
5. If confidence > 0.8: Execute action
6. If confidence < 0.8: Escalate to human
7. Track outcome (was recommendation correct?)

Learning system:
- Store decision and outcome
- Track accuracy over time
- Improve prompts based on failures
- Build decision history

Execution:
- Publish AIDecision event with reasoning
- Execute recommended action via ActionExecutor
- Monitor result
- Update learning system

File structure:
- src/agents/DecisionMakingAgent.ts
- src/services/ContextGatherer.ts
- src/services/LearningSystem.ts

Integration:
- Works with ClaudeAnalyzer
- Works with ActionExecutor
- Works with EventBus
- Works with Supabase

Fully typed, production-ready.
Include extensive logging and debugging.
```

---

# PHASE 5: HORIZONTAL SCALING

## Prompt 11: Configuration System

```
Create a configuration system to manage multiple projects without code changes.

Requirements:
- Load projects from YAML config file
- Or load from Supabase projects table
- Each project configuration:
  {
    name: "email-blast",
    healthEndpoint: "http://localhost:3010/health",
    metricsEndpoint: "http://localhost:3010/metrics",
    statusEndpoint: "http://localhost:3010/status",
    alertThresholds: {
      cpuPercent: 80,
      memoryPercent: 85,
      errorRate: 5,
      responseTimeMs: 1000
    }
  }

Features:
- Load projects at startup
- Hot reload (add/remove projects without restart)
- Validate configuration
- Support for 50+ projects
- Type-safe configuration

Implementation:
- ConfigManager class
- Watch config file for changes
- Update running system when changed
- Store configuration in Supabase

File structure:
- src/config/ConfigManager.ts
- src/config/projects.yaml
- src/services/ConfigLoader.ts

Usage:
- const config = await ConfigManager.getProjects()
- config.forEach(project => monitorProject(project))

Fully typed, production-ready.
Support both file-based and database-based configuration.
```

---

## Prompt 12: Database Optimization

```
Create database optimization for handling millions of metric records.

Requirements:
- Add indexes for fast queries
- Optimize aggregation queries
- Implement connection pooling
- Cache recent data in Redis (optional but recommended)
- Partition historical data

Optimization strategies:
1. Indexes:
   - (project_name, recorded_at DESC) for recent data
   - (project_name, status) for status queries
   - (occurred_at DESC) for event history
   - (created_at DESC) for action history

2. Query optimization:
   - Get latest metrics: SELECT * WHERE project_name = ? ORDER BY recorded_at DESC LIMIT 1
   - Get metrics for last hour: WHERE recorded_at > now() - interval '1 hour'
   - Aggregate uptime: AVG(uptime_percentage) grouped by project_name

3. Connection pooling:
   - Use pg connection pool
   - Max connections: 20
   - Idle timeout: 30s

4. Caching:
   - Cache last 100 status records in memory
   - Cache aggregated metrics (compute every 5 min)
   - Invalidate on insert

5. Partitioning (for TimescaleDB):
   - Automatic with hypertables
   - Compress data older than 30 days
   - Automatic cleanup of data older than 1 year

File structure:
- src/services/DatabaseOptimizer.ts
- src/services/QueryBuilder.ts
- src/services/MetricsCache.ts
- SQL migration files

Provide:
- SQL queries for all common operations
- Performance testing
- Monitoring queries (check index usage)

Fully typed, production-ready.
```

---

## Prompt 13: Horizontal Scaling

```
Create infrastructure for running multiple orchestration hub instances.

Requirements:
- Deploy multiple instances of orchestration hub
- Load balance between instances
- Each instance monitors different projects
- Coordinate via Redis Pub/Sub
- Auto-scaling capability

Architecture:
- Instance 1: Monitors projects 1-10
- Instance 2: Monitors projects 11-20
- Instance 3: Monitors projects 21-30
- Load balancer: Distributes requests

Coordination:
- Instances publish metrics to shared Redis
- Subscribe to shared events
- No duplicate monitoring (project assigned to one instance)
- Health checks between instances

Load balancing:
- Use Redis to assign projects to instances
- Automatic failover if instance goes down
- Rebalance when new instance joins

Deployment:
- Docker for containerization (optional)
- Deploy to Railway with auto-scaling
- Environment for multiple instances:
  - INSTANCE_ID
  - TOTAL_INSTANCES
  - REDIS_URL

File structure:
- src/services/InstanceCoordinator.ts
- src/services/ProjectAssigner.ts
- src/services/LoadBalancer.ts
- src/services/HealthChecker.ts

Integration:
- Works with configuration system
- Works with metrics collection
- Works with event system

Fully typed, production-ready.
Include metrics for monitoring instance health.
```

---

# BONUS PROMPTS

## Prompt 14: Dashboard Analytics Page

```
Create an analytics page for the dashboard showing system insights.

Features:
- Uptime trends (graph of last 7 days)
- Most common errors
- Performance trends (CPU, memory, response time)
- Problem resolution time (how long it took to fix)
- Most reliable project ranking
- Auto-fixed problems count
- Manual escalations count

Implementation:
- New page: /analytics
- Charts using recharts
- Data from Supabase with aggregations
- Time range selector (1 day, 7 days, 30 days, 90 days)
- Export as CSV or PDF
- Real-time updates for live data

File structure:
- app/analytics/page.tsx
- components/AnalyticsCharts.tsx
- lib/analyticsQueries.ts

Fully typed, production-ready.
```

---

## Prompt 15: Escalation Management Dashboard

```
Create a dashboard for human escalations (Phase 3/4).

Features:
- List all escalations (pending and resolved)
- Each escalation shows:
  * Project name
  * Problem description
  * Auto-fixer tried and failed
  * Recommended action by Claude
  * Approve/reject/custom action
  * History of similar problems and solutions

Implementation:
- New page: /escalations
- Real-time updates of new escalations
- Action buttons: Approve, Reject, Custom
- Search and filter escalations
- History of past escalations and resolutions

File structure:
- app/escalations/page.tsx
- components/EscalationCard.tsx
- components/ActionApprover.tsx
- lib/escalationQueries.ts

Fully typed, production-ready.
```

---

## Prompt 16: System Settings Dashboard

```
Create a settings page for configuring the multi-orchestration system.

Features:
- Add/remove projects
- Configure alert thresholds per project
- Set escalation rules
- Configure Claude decision-making:
  * Confidence threshold (when to escalate)
  * Cost budget per month
  * Rate limiting
- View API keys (with masking)
- View audit logs
- System status and health

Implementation:
- New page: /settings
- Forms for configuration
- Real-time updates
- Validation and error handling
- Confirmation dialogs for destructive actions

File structure:
- app/settings/page.tsx
- app/settings/projects/page.tsx
- app/settings/thresholds/page.tsx
- app/settings/ai-config/page.tsx
- components/SettingsForm.tsx

Fully typed, production-ready.
```

---

# How to Use All These Prompts

## Week 1-2 (Phase 1)

**Day 1:**
- Copy Prompt 1 → Paste in Cursor → Get SQL
- Paste SQL in Supabase SQL editor
- Done ✅

**Days 3-5:**
- Copy Prompt 2 → Paste in Cursor → Get dashboard code
- Review code, maybe tweak colors
- Deploy to Vercel ✅

**Days 6-7:**
- Copy Prompt 3 → Paste in Cursor → Get hub code
- Review code
- Deploy to Railway ✅

**Days 8-10:**
- Copy Prompt 4 → Paste in Cursor → Get setup guide
- Follow the setup guide
- Test everything ✅

## Week 3-4 (Phase 2)

- Copy Prompts 5, 6 → Generate agents
- Integrate with hub
- Test ✅

## Week 5-6 (Phase 3)

- Copy Prompts 7, 8 → Generate actions + auto-fixer
- Integrate with agents
- Test ✅

## Week 7-8 (Phase 4)

- Copy Prompts 9, 10 → Generate Claude integration + decision agent
- Integrate with everything
- Test ✅

## Week 9-10 (Phase 5)

- Copy Prompts 11, 12, 13 → Generate scaling system
- Deploy with multiple instances
- Test with 50+ projects ✅

## Optional (Anytime)

- Copy Prompts 14, 15, 16 → Generate bonus dashboards
- Add insights, escalation mgmt, settings ✅

---

## Tips for Best Results

1. **Copy the entire prompt** (don't modify, cursor understands context)
2. **Let Cursor finish generating** (don't interrupt)
3. **Review the code** (takes 10-20 minutes per component)
4. **Ask follow-up questions** (Cursor can explain or improve)
5. **Test incrementally** (test each component before combining)

---

## Example Workflow

```bash
# Week 1, Day 1:
1. Open Cursor
2. Copy Prompt 1 (database SQL)
3. Paste in Cursor composer
4. Hit enter
5. Get SQL schema
6. Copy SQL
7. Paste in Supabase SQL editor
8. Run it
9. Tables created ✅

# Week 1, Day 3:
1. Create new Cursor composer
2. Copy Prompt 2 (dashboard)
3. Paste in Cursor
4. Hit enter
5. Wait for generation (5 min)
6. Review code
7. Create new Next.js project: npx create-next-app@latest
8. Replace files with Cursor's code
9. Add Supabase env vars
10. npm run dev
11. Test on localhost:3000 ✅

# Week 1, Day 6:
1. Create new Cursor composer
2. Copy Prompt 3 (orchestration hub)
3. Paste and generate
4. Review code
5. Create Node project
6. Add files from Cursor
7. npm install
8. npm run dev
9. Test health checking ✅

# Week 2, Day 1:
1. Deploy dashboard to Vercel (git push)
2. Deploy hub to Railway (connect GitHub)
3. Everything live ✅
```

---

You now have **complete, production-ready prompts for the entire system.**

Just copy-paste these into Cursor and build. 🚀

Need more details on any prompt? Let me know!
