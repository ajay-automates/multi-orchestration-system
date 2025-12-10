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
