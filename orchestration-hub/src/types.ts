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
  supabase: {
    url: string;
    key: string;
  };
  projects: Project[];
  ai: {
    apiKey: string;
    model: string;
  };
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

/**
 * Event types for the event bus
 */
export enum EventType {
  PROJECT_HEALTH_CHANGED = 'project.health.changed',
  PROJECT_DOWN = 'project.down',
  PROJECT_DEGRADED = 'project.degraded',
  PROJECT_RECOVERED = 'project.recovered',
  METRICS_COLLECTED = 'metrics.collected',
  ANOMALY_DETECTED = 'anomaly_detected',
  ACTION_TRIGGERED = 'action.triggered',
  ACTION_COMPLETED = 'action.completed',
  ACTION_FAILED = 'action.failed',
  ACTION_EXECUTED = 'action_executed',
  AI_DECISION = 'ai_decision'
}

/**
 * Standard event structure
 */
export interface SystemEvent {
  id: string;
  type: EventType;
  source: string;        // Which agent/service generated this?
  timestamp: Date;
  payload: any;          // Flexible payload depending on event type
  metadata?: Record<string, any>;
}
