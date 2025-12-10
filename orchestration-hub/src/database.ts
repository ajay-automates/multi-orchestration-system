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
    public pool: Pool;
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
