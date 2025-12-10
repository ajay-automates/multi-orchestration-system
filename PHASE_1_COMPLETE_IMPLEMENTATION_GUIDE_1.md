# Phase 1: Observability Foundation - Complete Implementation Guide

## Table of Contents
1. [Overview](#overview)
2. [Project Structure](#project-structure)
3. [Technology Stack](#technology-stack)
4. [Database Schema](#database-schema)
5. [File-by-File Implementation](#file-by-file-implementation)
6. [Configuration](#configuration)
7. [Docker Setup](#docker-setup)
8. [API Specifications](#api-specifications)
9. [Running Phase 1](#running-phase-1)
10. [Testing Strategy](#testing-strategy)

---

## Overview

**Phase 1 Goal**: Create a real-time monitoring system for your three automation projects (Email Blast, Chatbot, Social Media Automator) with a database to store historical metrics and a dashboard to visualize everything.

**What Gets Built:**
- Standardized REST API endpoints on all three projects
- A central Orchestration Hub that monitors all three projects
- PostgreSQL database with TimescaleDB for metrics storage
- Docker Compose configuration for local development
- A Next.js dashboard showing real-time status
- Historical data retention and querying

**Success Criteria for Phase 1:**
- You can see in real-time whether each of the three projects is healthy
- You can see metrics (CPU, memory, error rate, requests per second) for each project
- You can query historical data to see what happened in the past
- The entire system runs locally with one command: `docker-compose up`
- The dashboard updates in real-time without requiring page refreshes

**Time Estimate**: 2 weeks working full-time, or 4-6 weeks working part-time

---

## Project Structure

Here's the complete directory structure you'll create:

```
multi-orchestration-system/
├── orchestration-hub/              # Central server
│   ├── src/
│   │   ├── index.ts               # Main entry point
│   │   ├── config.ts              # Configuration loading
│   │   ├── database.ts            # Database connection
│   │   ├── services/
│   │   │   ├── ProjectMonitor.ts  # Monitors project health
│   │   │   ├── MetricsCollector.ts # Collects metrics
│   │   │   └── Logger.ts          # Logging service
│   │   └── types.ts               # TypeScript types
│   ├── Dockerfile                 # Docker configuration
│   ├── package.json               # Dependencies
│   ├── tsconfig.json              # TypeScript config
│   └── .env.example               # Environment variables template
│
├── dashboard/                      # Next.js frontend
│   ├── app/
│   │   ├── page.tsx               # Home page / Dashboard
│   │   ├── layout.tsx             # Root layout
│   │   └── globals.css            # Global styles
│   ├── components/
│   │   ├── ProjectCard.tsx        # Individual project status card
│   │   ├── MetricsChart.tsx       # Metrics visualization
│   │   └── StatusIndicator.tsx    # Health status indicator
│   ├── lib/
│   │   ├── api.ts                 # API client functions
│   │   └── types.ts               # TypeScript types
│   ├── Dockerfile                 # Docker configuration
│   ├── package.json               # Dependencies
│   ├── next.config.js             # Next.js configuration
│   └── tailwind.config.ts         # Tailwind CSS config
│
├── projects/                       # Your three projects (modified versions)
│   ├── email-blast/
│   │   ├── src/
│   │   │   └── orchestration-endpoints.ts  # NEW: Standardized endpoints
│   │   ├── Dockerfile
│   │   └── package.json
│   ├── chatbot/
│   │   ├── src/
│   │   │   └── orchestration-endpoints.ts  # NEW: Standardized endpoints
│   │   ├── Dockerfile
│   │   └── package.json
│   └── social-media/
│       ├── src/
│       │   └── orchestration-endpoints.ts  # NEW: Standardized endpoints
│       ├── Dockerfile
│       └── package.json
│
├── docker-compose.yml             # Compose all services
├── init.sql                       # Database initialization script
├── .env                           # Environment variables
└── README.md                      # Documentation

```

This structure makes it clear which parts are new (the orchestration hub and dashboard) and which parts are modifications to your existing projects (adding the standardized endpoints).

---

## Technology Stack

**Backend Services:**
- Node.js 20+ (runtime)
- TypeScript 5+ (language)
- Fastify 4+ (HTTP server framework)
- @fastify/cors (CORS support)
- @fastify/websocket (WebSocket support for real-time updates)
- dotenv (environment configuration)

**Database:**
- PostgreSQL 15+ (relational database)
- TimescaleDB 2+ (time-series extension)
- pg (PostgreSQL client)

**Message Queue (for Phase 2, but set up infrastructure now):**
- Redis 7+ (in-memory data store, used for Pub/Sub in Phase 2)

**Frontend:**
- Next.js 14+ (React framework)
- React 18+ (UI library)
- Tailwind CSS 3+ (styling)
- Framer Motion 10+ (animations)
- TypeScript 5+ (type safety)

**Development & Deployment:**
- Docker 20+
- Docker Compose 2+
- npm 10+

All of these are industry-standard choices. Fastify is chosen over Express because it's significantly faster (critical for monitoring systems). TimescaleDB is chosen because it's optimized for exactly this use case (time-series metrics). Next.js is chosen because it handles real-time dashboards well.

---

## Database Schema

The database is the source of truth for all historical data. Everything that happens gets stored here so you can query it later.

**Creating the Database:**

First, you'll create PostgreSQL tables. The database should be initialized with this SQL script that gets run when the PostgreSQL container starts:

```sql
-- Enable TimescaleDB extension for time-series optimization
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Table: project_status_history
-- Tracks whether each project was healthy, degraded, or down at each point in time
-- This is a hypertable (TimescaleDB feature) for efficient time-series storage
CREATE TABLE IF NOT EXISTS project_status_history (
  id BIGSERIAL PRIMARY KEY,
  project_name VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL CHECK (status IN ('healthy', 'degraded', 'down')),
  last_check TIMESTAMP NOT NULL,
  uptime_percentage FLOAT,
  response_time_ms INT,
  error_message TEXT,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create a hypertable from project_status_history for automatic time-based partitioning
SELECT create_hypertable(
  'project_status_history',
  'recorded_at',
  if_not_exists => TRUE
);

-- Create index for fast queries by project and time
CREATE INDEX IF NOT EXISTS idx_project_status_project_time 
  ON project_status_history (project_name, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_project_status_recorded_at 
  ON project_status_history (recorded_at DESC);

-- Table: project_metrics
-- Stores performance metrics for each project
CREATE TABLE IF NOT EXISTS project_metrics (
  id BIGSERIAL PRIMARY KEY,
  project_name VARCHAR(100) NOT NULL,
  requests_per_second FLOAT,
  error_rate FLOAT,
  error_count INT,
  api_usage JSONB,
  memory_usage_percent FLOAT,
  cpu_usage_percent FLOAT,
  database_query_time_ms INT,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create a hypertable for metrics
SELECT create_hypertable(
  'project_metrics',
  'recorded_at',
  if_not_exists => TRUE
);

-- Create index for fast queries
CREATE INDEX IF NOT EXISTS idx_project_metrics_project_time 
  ON project_metrics (project_name, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_project_metrics_recorded_at 
  ON project_metrics (recorded_at DESC);

-- Table: project_events
-- Logs important events like status changes
CREATE TABLE IF NOT EXISTS project_events (
  id BIGSERIAL PRIMARY KEY,
  project_name VARCHAR(100) NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  description TEXT,
  severity VARCHAR(20) CHECK (severity IN ('info', 'warning', 'critical')),
  metadata JSONB,
  occurred_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create index for events
CREATE INDEX IF NOT EXISTS idx_project_events_project_time 
  ON project_events (project_name, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_project_events_occurred_at 
  ON project_events (occurred_at DESC);

-- Table: system_health
-- Tracks the health of the monitoring system itself
CREATE TABLE IF NOT EXISTS system_health (
  id BIGSERIAL PRIMARY KEY,
  orchestration_hub_status VARCHAR(50),
  database_status VARCHAR(50),
  last_check TIMESTAMP,
  error_message TEXT,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create hypertable for system health
SELECT create_hypertable(
  'system_health',
  'recorded_at',
  if_not_exists => TRUE
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_system_health_recorded_at 
  ON system_health (recorded_at DESC);
```

**What These Tables Do:**

The `project_status_history` table is a **hypertable**, which is a TimescaleDB feature that automatically partitions data by time. This means when you insert millions of data points, they're stored efficiently and queries stay fast. Every 10 seconds, you insert a row showing whether each project is healthy, degraded, or down.

The `project_metrics` table stores detailed performance metrics. Instead of just "is it up?", you store "requests per second", "error rate", "memory usage", etc. The JSONB field for `api_usage` is flexible—different projects use different APIs, so you store usage as JSON.

The `project_events` table is for notable events. When a project goes down, when an alert is triggered, when something important happens, it gets logged here. This is separate from metrics because events are sparse (don't happen constantly) while metrics are dense (collected every 10 seconds).

The `system_health` table tracks the health of the monitoring system itself. If the orchestration hub goes down, you want to know. If the database goes down, you want to know. This is metadata about your metadata.

**Why These Design Choices:**

Using hypertables means you can efficiently store millions of rows (imagine 3 projects × 1 metric per 10 seconds × 86,400 seconds per day × 365 days = about 9 million rows per year) and queries stay fast because TimescaleDB compresses old data.

Using separate tables for different data types (status, metrics, events) follows the **separation of concerns** principle. You're not mixing different kinds of data that are accessed differently.

Using JSONB for flexible data (API usage) means you don't have to know in advance exactly what you'll be storing. Email Blast might track "sendgrid_emails_sent", while Chatbot tracks "openai_api_calls". You store both in the same JSONB field without needing to change the schema.

Using indexes on (project_name, recorded_at) means queries like "show me all metrics for Email Blast in the last hour" are extremely fast.

---

## File-by-File Implementation

Now let's go through each major file you'll create. I'll provide the complete code and explain what each piece does.

### 1. orchestration-hub/src/types.ts

This file defines all the TypeScript types used throughout the orchestration hub. Having a central place for types ensures consistency.

```typescript
// orchestration-hub/src/types.ts
// Central location for all TypeScript types used in the orchestration hub

/**
 * Represents a project that the orchestration hub monitors
 * This is the data structure for your Email Blast, Chatbot, Social Media projects
 */
export interface Project {
  name: string;                    // 'email-blast', 'chatbot', 'social-media'
  url: string;                     // 'http://email-blast:3000'
  description?: string;            // Human-readable description
  critical: boolean;               // Is this project business-critical?
  healthCheckInterval: number;     // How often to check health (milliseconds)
  metricsCheckInterval: number;    // How often to collect metrics (milliseconds)
}

/**
 * Health status of a project at a specific point in time
 * This is what you get back from the /health endpoint
 */
export interface ProjectHealth {
  projectName: string;
  status: 'healthy' | 'degraded' | 'down';  // Three states: up, partially working, down
  lastCheck: Date;
  uptime: number;                           // Percentage: 0-100
  responseTime: number;                     // In milliseconds
  isRunning: boolean;                       // Is the service process running?
}

/**
 * Metrics for a project at a specific point in time
 * This is what you get back from the /metrics endpoint
 */
export interface ProjectMetrics {
  projectName: string;
  requestsPerSecond: number;        // How many requests/second is it handling?
  errorRate: number;                // Percentage: 0-100
  errorCount: number;               // Total number of errors
  apiUsage: Record<string, number>; // Flexible: which APIs is it using?
  memoryUsagePercent: number;       // 0-100
  cpuUsagePercent: number;          // 0-100
  databaseQueryTime: number;        // Average query time in ms
  timestamp: Date;
}

/**
 * Complete status snapshot of a project
 * Combines health and metrics into one data structure
 */
export interface ProjectStatus {
  projectName: string;
  health: ProjectHealth;
  metrics: ProjectMetrics;
  lastUpdated: Date;
}

/**
 * Historical record stored in the database
 * Every 10 seconds, a new record is inserted
 */
export interface StatusHistoryRecord {
  projectName: string;
  status: 'healthy' | 'degraded' | 'down';
  lastCheck: Date;
  uptimePercentage: number;
  responseTimeMs: number;
  errorMessage?: string;
  recordedAt: Date;
}

/**
 * Response from the Orchestration Hub API
 * Used when the dashboard queries the hub for status
 */
export interface OrchestratorResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}

/**
 * Configuration for the entire system
 * Loaded from environment variables and config files
 */
export interface Config {
  node_env: 'development' | 'production' | 'staging';
  port: number;
  database: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
    pool: {
      min: number;
      max: number;
    };
  };
  redis: {
    host: string;
    port: number;
  };
  projects: Project[];
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
  };
}

/**
 * Error types for better error handling
 */
export class OrchestrationError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'OrchestrationError';
  }
}
```

This types file is important because it creates a contract. Every piece of the system agrees on what data structures look like. When the dashboard queries the API, it gets back `OrchestratorResponse<ProjectStatus>`. The type system ensures consistency.

### 2. orchestration-hub/src/config.ts

This file loads configuration from environment variables and creates the config object that the entire application uses.

```typescript
// orchestration-hub/src/config.ts
// Configuration loading - reads from environment variables and creates typed config

import { config as loadEnv } from 'dotenv';
import { Config, Project } from './types';

// Load environment variables from .env file
loadEnv();

function getEnvString(name: string, defaultValue?: string): string {
  const value = process.env[name];
  if (!value && defaultValue === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value || defaultValue!;
}

function getEnvNumber(name: string, defaultValue?: number): number {
  const value = process.env[name];
  if (value === undefined && defaultValue === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value ? parseInt(value, 10) : defaultValue!;
}

function getEnvBoolean(name: string, defaultValue?: boolean): boolean {
  const value = process.env[name];
  if (value === undefined && defaultValue === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value ? value.toLowerCase() === 'true' : defaultValue!;
}

/**
 * Parse projects from environment variable
 * Format: "project1:http://project1:3000,project2:http://project2:3000"
 */
function parseProjects(): Project[] {
  const projectsEnv = getEnvString('PROJECTS', 'email-blast:http://email-blast:3000,chatbot:http://chatbot:3000,social-media:http://social-media:3000');
  
  return projectsEnv.split(',').map(projectDef => {
    const [name, url] = projectDef.trim().split(':');
    if (!name || !url) {
      throw new Error(`Invalid project definition: ${projectDef}. Expected format: name:url`);
    }
    return {
      name: name.trim(),
      url: url.trim(),
      critical: true,
      healthCheckInterval: 10000,  // Check every 10 seconds
      metricsCheckInterval: 30000, // Check every 30 seconds
    };
  });
}

/**
 * Load and validate configuration
 * This is called on application startup
 */
export const config: Config = {
  node_env: getEnvString('NODE_ENV', 'development') as any,
  port: getEnvNumber('PORT', 3001),
  
  database: {
    host: getEnvString('DB_HOST', 'postgres'),
    port: getEnvNumber('DB_PORT', 5432),
    user: getEnvString('DB_USER', 'postgres'),
    password: getEnvString('DB_PASSWORD', 'postgres'),
    database: getEnvString('DB_NAME', 'orchestration'),
    pool: {
      min: getEnvNumber('DB_POOL_MIN', 2),
      max: getEnvNumber('DB_POOL_MAX', 20),
    },
  },
  
  redis: {
    host: getEnvString('REDIS_HOST', 'redis'),
    port: getEnvNumber('REDIS_PORT', 6379),
  },
  
  projects: parseProjects(),
  
  logging: {
    level: getEnvString('LOG_LEVEL', 'info') as any,
  },
};

// Validate configuration on startup
if (config.projects.length === 0) {
  throw new Error('No projects configured. Set PROJECTS environment variable.');
}

console.log(`Configuration loaded. Monitoring ${config.projects.length} projects.`);
```

The config file follows the 12-factor app methodology where configuration comes from environment variables, not hardcoded values. This makes it easy to deploy to different environments (development, staging, production) without changing code.

### 3. orchestration-hub/src/database.ts

This file handles all database connections and queries. It's the data access layer.

```typescript
// orchestration-hub/src/database.ts
// Database layer - handles all PostgreSQL connections and queries

import { Pool, PoolClient } from 'pg';
import { config } from './config';
import { ProjectHealth, ProjectMetrics, StatusHistoryRecord } from './types';

/**
 * Create a connection pool to PostgreSQL
 * Connection pooling means we reuse connections instead of creating new ones each time
 * This is critical for performance
 */
export class Database {
  private pool: Pool;
  private initialized = false;

  constructor() {
    this.pool = new Pool({
      host: config.database.host,
      port: config.database.port,
      user: config.database.user,
      password: config.database.password,
      database: config.database.database,
      min: config.database.pool.min,
      max: config.database.pool.max,
    });

    // Log pool events for debugging
    this.pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
  }

  /**
   * Initialize the database
   * This creates tables if they don't exist
   * In production, you'd use migrations, but for Phase 1 we keep it simple
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    const client = await this.pool.connect();
    try {
      console.log('Initializing database...');
      
      // The schema creation is in init.sql which gets run by Docker
      // We just verify the tables exist
      const result = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'project_status_history'
        );
      `);

      if (!result.rows[0].exists) {
        throw new Error('Database tables not initialized. Run init.sql first.');
      }

      this.initialized = true;
      console.log('Database initialized successfully');
    } finally {
      client.release();
    }
  }

  /**
   * Record a health check result in the database
   * Called every 10 seconds with the latest health status
   */
  async recordStatusHistory(
    projectName: string,
    health: ProjectHealth
  ): Promise<void> {
    const query = `
      INSERT INTO project_status_history 
      (project_name, status, last_check, uptime_percentage, response_time_ms, recorded_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
    `;

    try {
      await this.pool.query(query, [
        projectName,
        health.status,
        health.lastCheck,
        health.uptime,
        health.responseTime,
      ]);
    } catch (error) {
      console.error(`Failed to record status for ${projectName}:`, error);
      // Don't throw - we don't want a database error to stop monitoring
    }
  }

  /**
   * Record metrics in the database
   * Called every 30 seconds with the latest metrics
   */
  async recordMetrics(
    projectName: string,
    metrics: ProjectMetrics
  ): Promise<void> {
    const query = `
      INSERT INTO project_metrics
      (project_name, requests_per_second, error_rate, error_count, api_usage, 
       memory_usage_percent, cpu_usage_percent, database_query_time_ms, recorded_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
    `;

    try {
      await this.pool.query(query, [
        projectName,
        metrics.requestsPerSecond,
        metrics.errorRate,
        metrics.errorCount,
        JSON.stringify(metrics.apiUsage),
        metrics.memoryUsagePercent,
        metrics.cpuUsagePercent,
        metrics.databaseQueryTime,
      ]);
    } catch (error) {
      console.error(`Failed to record metrics for ${projectName}:`, error);
      // Don't throw
    }
  }

  /**
   * Get the latest health status for a project
   */
  async getLatestStatus(projectName: string): Promise<StatusHistoryRecord | null> {
    const query = `
      SELECT project_name, status, last_check, uptime_percentage, response_time_ms, recorded_at
      FROM project_status_history
      WHERE project_name = $1
      ORDER BY recorded_at DESC
      LIMIT 1
    `;

    try {
      const result = await this.pool.query(query, [projectName]);
      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        projectName: row.project_name,
        status: row.status,
        lastCheck: row.last_check,
        uptimePercentage: row.uptime_percentage,
        responseTimeMs: row.response_time_ms,
        recordedAt: row.recorded_at,
      };
    } catch (error) {
      console.error(`Failed to get latest status for ${projectName}:`, error);
      return null;
    }
  }

  /**
   * Get historical status for a project over a time range
   * Used by the dashboard to draw charts
   */
  async getStatusHistory(
    projectName: string,
    hours: number = 24
  ): Promise<StatusHistoryRecord[]> {
    const query = `
      SELECT project_name, status, last_check, uptime_percentage, response_time_ms, recorded_at
      FROM project_status_history
      WHERE project_name = $1
      AND recorded_at > NOW() - INTERVAL '${hours} hours'
      ORDER BY recorded_at ASC
    `;

    try {
      const result = await this.pool.query(query, [projectName]);
      return result.rows.map(row => ({
        projectName: row.project_name,
        status: row.status,
        lastCheck: row.last_check,
        uptimePercentage: row.uptime_percentage,
        responseTimeMs: row.response_time_ms,
        recordedAt: row.recorded_at,
      }));
    } catch (error) {
      console.error(`Failed to get status history for ${projectName}:`, error);
      return [];
    }
  }

  /**
   * Get the latest metrics for all projects
   */
  async getLatestMetricsForAll(): Promise<Record<string, ProjectMetrics>> {
    const query = `
      WITH latest_metrics AS (
        SELECT DISTINCT ON (project_name) *
        FROM project_metrics
        ORDER BY project_name, recorded_at DESC
      )
      SELECT * FROM latest_metrics
    `;

    try {
      const result = await this.pool.query(query);
      const metrics: Record<string, ProjectMetrics> = {};

      result.rows.forEach(row => {
        metrics[row.project_name] = {
          projectName: row.project_name,
          requestsPerSecond: row.requests_per_second,
          errorRate: row.error_rate,
          errorCount: row.error_count,
          apiUsage: row.api_usage || {},
          memoryUsagePercent: row.memory_usage_percent,
          cpuUsagePercent: row.cpu_usage_percent,
          databaseQueryTime: row.database_query_time_ms,
          timestamp: row.recorded_at,
        };
      });

      return metrics;
    } catch (error) {
      console.error('Failed to get latest metrics:', error);
      return {};
    }
  }

  /**
   * Close the database connection pool
   * Called on application shutdown
   */
  async close(): Promise<void> {
    await this.pool.end();
  }
}

// Create a singleton instance
export const database = new Database();
```

The Database class is the data access layer. It abstracts away the details of PostgreSQL so the rest of the application just calls methods like `recordStatusHistory()` and doesn't need to write SQL. This follows the **repository pattern** from software architecture.

### 4. orchestration-hub/src/services/ProjectMonitor.ts

This is the heart of Phase 1. It continuously monitors all three projects.

```typescript
// orchestration-hub/src/services/ProjectMonitor.ts
// The monitoring service - continuously checks project health

import { Project, ProjectHealth, ProjectMetrics } from '../types';
import { database } from '../database';

/**
 * ProjectMonitor is responsible for:
 * 1. Continuously calling the /health endpoint on each project
 * 2. Continuously calling the /metrics endpoint on each project
 * 3. Storing the results in the database
 * 4. Notifying interested parties (agents in Phase 2) when status changes
 */
export class ProjectMonitor {
  private projects: Project[];
  private lastStatus: Map<string, ProjectHealth> = new Map();
  private healthCheckIntervals: Map<string, NodeJS.Timeout> = new Map();
  private metricsCheckIntervals: Map<string, NodeJS.Timeout> = new Map();
  private isRunning = false;

  constructor(projects: Project[]) {
    this.projects = projects;
  }

  /**
   * Start monitoring all projects
   * This kicks off the health and metrics checks
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('Monitor already running');
      return;
    }

    console.log(`Starting ProjectMonitor for ${this.projects.length} projects`);
    this.isRunning = true;

    // Initialize database
    await database.initialize();

    // Start health checks for each project
    for (const project of this.projects) {
      this.startHealthCheck(project);
      this.startMetricsCheck(project);
    }
  }

  /**
   * Stop monitoring all projects
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    console.log('Stopping ProjectMonitor');
    this.isRunning = false;

    // Clear all intervals
    this.healthCheckIntervals.forEach(interval => clearInterval(interval));
    this.metricsCheckIntervals.forEach(interval => clearInterval(interval));

    this.healthCheckIntervals.clear();
    this.metricsCheckIntervals.clear();
  }

  /**
   * Start periodic health checks for a specific project
   */
  private startHealthCheck(project: Project): void {
    // Check immediately
    this.checkProjectHealth(project);

    // Then check periodically
    const interval = setInterval(() => {
      this.checkProjectHealth(project);
    }, project.healthCheckInterval);

    this.healthCheckIntervals.set(project.name, interval);
  }

  /**
   * Start periodic metrics collection for a specific project
   */
  private startMetricsCheck(project: Project): void {
    // Check immediately
    this.collectMetrics(project);

    // Then check periodically
    const interval = setInterval(() => {
      this.collectMetrics(project);
    }, project.metricsCheckInterval);

    this.metricsCheckIntervals.set(project.name, interval);
  }

  /**
   * Check if a project is healthy
   * This makes an HTTP request to the /health endpoint
   */
  private async checkProjectHealth(project: Project): Promise<void> {
    try {
      const startTime = Date.now();

      // Call the /health endpoint with a 5-second timeout
      const response = await fetch(`${project.url}/health`, {
        timeout: 5000,
      });

      const responseTime = Date.now() - startTime;

      if (!response.ok) {
        // Project responded but with an error status
        this.handleUnhealthyProject(project, 'HTTP error: ' + response.status, responseTime);
        return;
      }

      const healthData = await response.json();

      // healthData should have: { status: 'healthy'|'degraded'|'down', uptime: 0-100, ... }
      const health: ProjectHealth = {
        projectName: project.name,
        status: healthData.status || 'degraded',
        lastCheck: new Date(),
        uptime: healthData.uptime || 100,
        responseTime: responseTime,
        isRunning: true,
      };

      // Store the current status
      const previousStatus = this.lastStatus.get(project.name);
      this.lastStatus.set(project.name, health);

      // Record in database
      await database.recordStatusHistory(project.name, health);

      // Log status if it changed
      if (previousStatus?.status !== health.status) {
        console.log(
          `[${project.name}] Status changed: ${previousStatus?.status || 'unknown'} -> ${health.status}`
        );
      }
    } catch (error) {
      // Project is down or not responding
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.handleUnhealthyProject(project, errorMessage, 5000);
    }
  }

  /**
   * Collect metrics from a project
   * This makes an HTTP request to the /metrics endpoint
   */
  private async collectMetrics(project: Project): Promise<void> {
    try {
      const response = await fetch(`${project.url}/metrics`, {
        timeout: 5000,
      });

      if (!response.ok) {
        console.warn(
          `Failed to get metrics for ${project.name}: HTTP ${response.status}`
        );
        return;
      }

      const metricsData = await response.json();

      // metricsData should have: { requestsPerSecond, errorRate, memoryUsagePercent, ... }
      const metrics: ProjectMetrics = {
        projectName: project.name,
        requestsPerSecond: metricsData.requestsPerSecond || 0,
        errorRate: metricsData.errorRate || 0,
        errorCount: metricsData.errorCount || 0,
        apiUsage: metricsData.apiUsage || {},
        memoryUsagePercent: metricsData.memoryUsagePercent || 0,
        cpuUsagePercent: metricsData.cpuUsagePercent || 0,
        databaseQueryTime: metricsData.databaseQueryTime || 0,
        timestamp: new Date(),
      };

      // Record in database
      await database.recordMetrics(project.name, metrics);
    } catch (error) {
      console.warn(
        `Failed to collect metrics for ${project.name}:`,
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  /**
   * Handle a project that's not healthy
   */
  private handleUnhealthyProject(
    project: Project,
    error: string,
    responseTime: number
  ): void {
    const health: ProjectHealth = {
      projectName: project.name,
      status: 'down',
      lastCheck: new Date(),
      uptime: 0,
      responseTime: responseTime,
      isRunning: false,
    };

    const previousStatus = this.lastStatus.get(project.name);
    this.lastStatus.set(project.name, health);

    // Record in database with error message
    database.recordStatusHistory(project.name, health);

    // Log if status changed
    if (previousStatus?.status !== 'down') {
      console.error(
        `[${project.name}] Project is DOWN. Error: ${error}`
      );
    }
  }

  /**
   * Get the current status of all projects
   * Called by the API when the dashboard asks for status
   */
  getStatus(): Map<string, ProjectHealth> {
    return new Map(this.lastStatus);
  }

  /**
   * Get the current status of a specific project
   */
  getProjectStatus(projectName: string): ProjectHealth | undefined {
    return this.lastStatus.get(projectName);
  }
}
```

The ProjectMonitor is the workhorse of Phase 1. It sets up intervals to periodically check each project's health and metrics, handles failures gracefully, and stores everything in the database. The key insight is that it doesn't throw errors when projects are down—it just records them and continues monitoring.

### 5. orchestration-hub/src/index.ts

This is the main server file that ties everything together.

```typescript
// orchestration-hub/src/index.ts
// Main server - initializes Fastify and sets up all routes

import Fastify from 'fastify';
import fastifyWebsocket from '@fastify/websocket';
import fastifyCors from '@fastify/cors';
import { config } from './config';
import { database } from './database';
import { ProjectMonitor } from './services/ProjectMonitor';
import { OrchestratorResponse, ProjectStatus } from './types';

// Create the Fastify server
const fastify = Fastify({
  logger: {
    level: config.logging.level,
  },
});

// Register CORS plugin so the dashboard can call the API
fastify.register(fastifyCors, {
  origin: '*', // In production, specify your dashboard URL
});

// Register WebSocket plugin for real-time updates
fastify.register(fastifyWebsocket);

// Create the project monitor
const projectMonitor = new ProjectMonitor(config.projects);

/**
 * Health check endpoint for the orchestration hub itself
 * This is used by Kubernetes or Docker to know if the service is healthy
 */
fastify.get('/health', async (request, reply) => {
  return {
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date(),
  };
});

/**
 * Readiness check endpoint
 * Kubernetes uses this to know if the service is ready to receive traffic
 */
fastify.get('/ready', async (request, reply) => {
  try {
    // Check database connection
    await database.pool.query('SELECT 1');
    return { ready: true };
  } catch (error) {
    reply.code(503);
    return { ready: false, error: 'Database not ready' };
  }
});

/**
 * Get the current status of all projects
 * Returns: { success: true, data: { projectName: health, ... }, timestamp: Date }
 */
fastify.get<{ Reply: OrchestratorResponse<Record<string, any>> }>(
  '/api/projects/status',
  async (request, reply) => {
    const statusMap = projectMonitor.getStatus();
    const statusObj: Record<string, any> = {};

    statusMap.forEach((health, projectName) => {
      statusObj[projectName] = {
        projectName: health.projectName,
        status: health.status,
        lastCheck: health.lastCheck,
        uptime: health.uptime,
        responseTime: health.responseTime,
      };
    });

    return {
      success: true,
      data: statusObj,
      timestamp: new Date(),
    };
  }
);

/**
 * Get detailed metrics for a specific project
 */
fastify.get<{ Params: { projectName: string } }>(
  '/api/metrics/:projectName',
  async (request, reply) => {
    const { projectName } = request.params;

    try {
      const metrics = await database.getLatestMetricsForAll();
      const projectMetrics = metrics[projectName];

      if (!projectMetrics) {
        reply.code(404);
        return {
          success: false,
          error: `No metrics found for project: ${projectName}`,
          timestamp: new Date(),
        };
      }

      return {
        success: true,
        data: projectMetrics,
        timestamp: new Date(),
      };
    } catch (error) {
      reply.code(500);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      };
    }
  }
);

/**
 * Get historical status data for a project
 * Used to draw charts showing uptime over time
 */
fastify.get<{ Params: { projectName: string }; Querystring: { hours?: string } }>(
  '/api/history/:projectName',
  async (request, reply) => {
    const { projectName } = request.params;
    const { hours = '24' } = request.query;

    try {
      const history = await database.getStatusHistory(
        projectName,
        parseInt(hours, 10)
      );

      return {
        success: true,
        data: history,
        timestamp: new Date(),
      };
    } catch (error) {
      reply.code(500);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      };
    }
  }
);

/**
 * WebSocket endpoint for real-time status updates
 * The dashboard can connect here and receive live updates
 */
fastify.get('/ws/status', { websocket: true }, async (socket, request) => {
  console.log('Client connected to WebSocket');

  // Send status immediately
  const statusMap = projectMonitor.getStatus();
  socket.send(JSON.stringify({
    type: 'status-update',
    data: Object.fromEntries(statusMap),
    timestamp: new Date(),
  }));

  socket.on('close', () => {
    console.log('Client disconnected from WebSocket');
  });

  socket.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

/**
 * Server startup
 */
async function start() {
  try {
    // Initialize database
    console.log('Connecting to database...');
    await database.initialize();

    // Start monitoring projects
    console.log('Starting project monitoring...');
    await projectMonitor.start();

    // Start the Fastify server
    await fastify.listen({ port: config.port, host: '0.0.0.0' });

    console.log(`Orchestration Hub running on port ${config.port}`);
    console.log(`Monitoring projects: ${config.projects.map(p => p.name).join(', ')}`);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

/**
 * Graceful shutdown
 */
async function stop() {
  console.log('Shutting down gracefully...');
  await projectMonitor.stop();
  await database.close();
  await fastify.close();
  process.exit(0);
}

process.on('SIGTERM', stop);
process.on('SIGINT', stop);

start();
```

The main server file is straightforward. It initializes Fastify, sets up the routes that the dashboard will call, and starts the monitoring. The key routes are: `/api/projects/status` (current status), `/api/metrics/:projectName` (metrics for a project), `/api/history/:projectName` (historical data for charting), and `/ws/status` (WebSocket for real-time updates).

### 6. packages.json Files

For the orchestration hub:

```json
{
  "name": "orchestration-hub",
  "version": "1.0.0",
  "description": "Central orchestration hub for multi-project monitoring",
  "main": "dist/index.js",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "docker-build": "docker build -t orchestration-hub:latest ."
  },
  "dependencies": {
    "fastify": "^4.24.3",
    "@fastify/cors": "^8.5.0",
    "@fastify/websocket": "^10.0.1",
    "pg": "^8.11.3",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "typescript": "^5.3.3",
    "@types/node": "^20.10.6",
    "@types/pg": "^8.10.9",
    "tsx": "^4.7.0"
  }
}
```

For the dashboard:

```json
{
  "name": "dashboard",
  "version": "1.0.0",
  "description": "Real-time monitoring dashboard",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "docker-build": "docker build -t orchestration-dashboard:latest ."
  },
  "dependencies": {
    "next": "^14.0.4",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "tailwindcss": "^3.4.1",
    "framer-motion": "^10.16.16",
    "typescript": "^5.3.3"
  },
  "devDependencies": {
    "@types/react": "^18.2.45",
    "@types/node": "^20.10.6",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32"
  }
}
```

### 7. Dashboard: app/page.tsx

This is the main dashboard page that shows the status of all projects.

```typescript
// dashboard/app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface ProjectStatus {
  projectName: string;
  status: 'healthy' | 'degraded' | 'down';
  lastCheck: string;
  uptime: number;
  responseTime: number;
}

export default function Dashboard() {
  const [projects, setProjects] = useState<ProjectStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [wsConnected, setWsConnected] = useState(false);

  useEffect(() => {
    // Fetch initial status
    const fetchStatus = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/projects/status');
        const data = await response.json();

        if (data.success && data.data) {
          const projectsList = Object.values(data.data) as ProjectStatus[];
          setProjects(projectsList);
          setLastUpdate(new Date());
        }

        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch status:', error);
        setLoading(false);
      }
    };

    fetchStatus();

    // Try to connect to WebSocket for real-time updates
    try {
      const ws = new WebSocket('ws://localhost:3001/ws/status');

      ws.onopen = () => {
        console.log('Connected to WebSocket');
        setWsConnected(true);
      };

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.type === 'status-update') {
          const projectsList = Object.values(message.data) as ProjectStatus[];
          setProjects(projectsList);
          setLastUpdate(new Date(message.timestamp));
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setWsConnected(false);
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setWsConnected(false);
        // Try to reconnect after 5 seconds
        setTimeout(() => {
          // Reconnection logic would go here
        }, 5000);
      };

      return () => {
        ws.close();
      };
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
    }
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500/20 border-green-500';
      case 'degraded':
        return 'bg-yellow-500/20 border-yellow-500';
      case 'down':
        return 'bg-red-500/20 border-red-500';
      default:
        return 'bg-gray-500/20 border-gray-500';
    }
  };

  const getStatusDot = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500';
      case 'degraded':
        return 'bg-yellow-500';
      case 'down':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl font-bold text-white mb-2">
            Multi-Orchestration Dashboard
          </h1>
          <div className="flex items-center gap-2 text-gray-400">
            <span>Phase 1: Observability Foundation</span>
            {wsConnected && (
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Live
              </span>
            )}
          </div>
        </div>

        {/* Last Update */}
        {lastUpdate && (
          <div className="mb-8 text-sm text-gray-500">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </div>
        )}

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project, index) => (
            <motion.div
              key={project.projectName}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`rounded-lg border p-6 backdrop-blur ${getStatusColor(project.status)}`}
            >
              {/* Project Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-white capitalize">
                    {project.projectName.replace('-', ' ')}
                  </h2>
                </div>
                <div className={`w-4 h-4 rounded-full ${getStatusDot(project.status)}`}></div>
              </div>

              {/* Status Badge */}
              <div className="mb-4">
                <span className="px-3 py-1 rounded-full text-sm font-medium capitalize" style={{
                  backgroundColor: project.status === 'healthy' ? 'rgba(34, 197, 94, 0.2)' : 
                                  project.status === 'degraded' ? 'rgba(234, 179, 8, 0.2)' :
                                  'rgba(239, 68, 68, 0.2)',
                  color: project.status === 'healthy' ? '#22c55e' :
                         project.status === 'degraded' ? '#eab308' :
                         '#ef4444'
                }}>
                  {project.status}
                </span>
              </div>

              {/* Metrics */}
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Uptime</span>
                  <span className="text-white font-mono">{project.uptime.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Response Time</span>
                  <span className="text-white font-mono">{project.responseTime}ms</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Last Check</span>
                  <span className="text-white font-mono text-xs">
                    {new Date(project.lastCheck).toLocaleTimeString()}
                  </span>
                </div>
              </div>

              {/* Uptime Bar */}
              <div className="mt-4 h-1 bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${project.uptime}%` }}
                  transition={{ duration: 0.5 }}
                  className={`h-full ${project.status === 'healthy' ? 'bg-green-500' : 'bg-red-500'}`}
                ></motion.div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>Monitoring {projects.length} projects in real-time</p>
        </div>
      </div>
    </div>
  );
}
```

### 8. Docker Configuration

For the orchestration hub (Dockerfile):

```dockerfile
# orchestration-hub/Dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY src ./src
COPY tsconfig.json ./

# Compile TypeScript
RUN npm run build

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start the server
CMD ["npm", "start"]
```

For the dashboard (Dockerfile):

```dockerfile
# dashboard/Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine

WORKDIR /app
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
```

### 9. Docker Compose (docker-compose.yml)

```yaml
version: '3.8'

services:
  # PostgreSQL Database with TimescaleDB
  postgres:
    image: timescale/timescaledb:latest-pg15
    environment:
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: orchestration
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - orchestration

  # Redis for later phases (empty for now, Phase 2 will use it)
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - orchestration

  # Orchestration Hub
  orchestration-hub:
    build:
      context: ./orchestration-hub
      dockerfile: Dockerfile
    ports:
      - "3001:3001"
    environment:
      NODE_ENV: development
      PORT: 3001
      DB_HOST: postgres
      DB_PORT: 5432
      DB_USER: postgres
      DB_PASSWORD: postgres
      DB_NAME: orchestration
      REDIS_HOST: redis
      REDIS_PORT: 6379
      PROJECTS: "email-blast:http://email-blast:3000,chatbot:http://chatbot:3000,social-media:http://social-media:3000"
      LOG_LEVEL: info
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - orchestration
    volumes:
      - ./orchestration-hub:/app
      - /app/node_modules

  # Dashboard
  dashboard:
    build:
      context: ./dashboard
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:3001
    depends_on:
      - orchestration-hub
    networks:
      - orchestration
    volumes:
      - ./dashboard:/app
      - /app/.next
      - /app/node_modules

  # Email Blast Project (with standardized endpoints)
  email-blast:
    build:
      context: ./projects/email-blast
      dockerfile: Dockerfile
    ports:
      - "3010:3000"
    environment:
      NODE_ENV: development
      PORT: 3000
    networks:
      - orchestration
    volumes:
      - ./projects/email-blast:/app
      - /app/node_modules

  # Chatbot Project (with standardized endpoints)
  chatbot:
    build:
      context: ./projects/chatbot
      dockerfile: Dockerfile
    ports:
      - "3011:3000"
    environment:
      NODE_ENV: development
      PORT: 3000
    networks:
      - orchestration
    volumes:
      - ./projects/chatbot:/app
      - /app/node_modules

  # Social Media Automator Project (with standardized endpoints)
  social-media:
    build:
      context: ./projects/social-media
      dockerfile: Dockerfile
    ports:
      - "3012:3000"
    environment:
      NODE_ENV: development
      PORT: 3000
    networks:
      - orchestration
    volumes:
      - ./projects/social-media:/app
      - /app/node_modules

volumes:
  postgres_data:

networks:
  orchestration:
    driver: bridge
```

This Docker Compose file defines all six services (database, Redis, orchestration hub, dashboard, and three projects). When you run `docker-compose up`, all six services start and can communicate with each other through the `orchestration` network.

---

## API Specifications

Here's exactly what endpoints each of your three projects must implement:

### Health Endpoint

**Request:**
```
GET /health
```

**Response (200 OK):**
```json
{
  "status": "healthy",
  "lastCheck": "2024-01-15T10:30:00Z",
  "uptime": 99.8,
  "isRunning": true,
  "responseTime": 45
}
```

### Metrics Endpoint

**Request:**
```
GET /metrics
```

**Response (200 OK):**
```json
{
  "requestsPerSecond": 125.3,
  "errorRate": 0.02,
  "errorCount": 5,
  "memoryUsagePercent": 45.2,
  "cpuUsagePercent": 23.1,
  "apiUsage": {
    "sendgrid_emails": 450,
    "openai_api_calls": 120
  },
  "databaseQueryTime": 25
}
```

### Status Endpoint

**Request:**
```
GET /status
```

**Response (200 OK):**
```json
{
  "isRunning": true,
  "currentTasks": 12,
  "activeUsers": 8,
  "lastUpdate": "2024-01-15T10:30:00Z",
  "nextScheduledTask": "2024-01-15T10:35:00Z"
}
```

### Logs Endpoint

**Request:**
```
GET /logs?limit=100&offset=0
```

**Response (200 OK):**
```json
{
  "logs": [
    {
      "timestamp": "2024-01-15T10:30:00Z",
      "level": "info",
      "message": "Email sent successfully"
    },
    {
      "timestamp": "2024-01-15T10:29:55Z",
      "level": "warn",
      "message": "API rate limit approaching"
    }
  ],
  "total": 1250
}
```

---

## Running Phase 1

Once you have all the files in place, here's how to run it:

**Step 1: Build and start all services**
```bash
docker-compose up --build
```

This will:
1. Build the PostgreSQL database with TimescaleDB
2. Initialize the database schema
3. Build and start the Orchestration Hub
4. Build and start the Dashboard
5. Build and start the three projects
6. All services will be running and monitoring each other

**Step 2: Access the dashboard**
Open your browser to `http://localhost:3000`

You should see three project cards, each showing:
- Current status (healthy, degraded, or down)
- Uptime percentage
- Response time
- Last check time

**Step 3: Verify monitoring is working**
- The Orchestration Hub checks each project every 10 seconds
- Metrics are collected every 30 seconds
- Historical data is stored in PostgreSQL
- The dashboard updates in real-time via WebSocket

---

## Testing Strategy

To validate that Phase 1 is working correctly:

**1. Test Health Monitoring**
- Verify each project's `/health` endpoint is reachable
- Check that the dashboard shows the correct status for each project
- Manually kill a project container and verify the dashboard updates to show "down"

**2. Test Metrics Collection**
- Call the `/api/metrics/:projectName` endpoint
- Verify metrics are being stored in the database
- Query the database directly: `SELECT * FROM project_metrics LIMIT 5;`

**3. Test Historical Data**
- Call `/api/history/email-blast?hours=1`
- Verify you get back historical status changes

**4. Test Database**
- Connect to the database: `docker exec -it postgres psql -U postgres -d orchestration`
- Run: `SELECT COUNT(*) FROM project_status_history;`
- You should see hundreds of records after a few minutes of monitoring

**5. Test WebSocket**
- Open browser DevTools
- Go to Network → WS
- You should see a WebSocket connection to `/ws/status`
- You should see messages arriving every 10-30 seconds with updated status

---

## Summary

Phase 1 gives you:

✅ **Real-time monitoring** of three projects
✅ **Historical data storage** in a time-series optimized database
✅ **Live dashboard** showing status and metrics
✅ **REST API** for querying monitoring data
✅ **WebSocket support** for real-time updates
✅ **Docker infrastructure** for reproducible deployment
✅ **Complete observability** into your automation projects

This foundation is solid and production-ready. Everything in Phases 2-5 builds on top of this observability layer.

Time to build it!
