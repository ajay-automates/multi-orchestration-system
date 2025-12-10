// orchestration-hub/src/database.ts
// Database layer - handles all PostgreSQL connections and queries

// orchestration-hub/src/database.ts
// Database layer - handles all Supabase connections and queries

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from './config';
import { ProjectHealth, ProjectMetrics, StatusHistoryRecord } from './types';

/**
 * Database wrapper for Supabase
 */
export class Database {
    public client: SupabaseClient;
    private initialized = false;

    constructor() {
        if (!config.supabase.url || !config.supabase.key) {
            console.warn('⚠️ Supabase credentials not found. Database features will fail.');
        }

        this.client = createClient(config.supabase.url, config.supabase.key, {
            auth: {
                persistSession: false,
            }
        });
    }

    /**
     * Initialize the database
     * Verifies connection to Supabase
     */
    async initialize(): Promise<void> {
        if (this.initialized) return;

        try {
            console.log('Connecting to Supabase...');

            // Simple check to see if we can connect
            // We'll try to select from project_status_history, limit 1
            const { error } = await this.client
                .from('project_status_history')
                .select('id')
                .limit(1);

            if (error) {
                // Ignore "relation does not exist" if tables aren't there yet, but warn
                if (error.code === '42P01') {
                    console.warn('⚠️ Database tables not found. Please run the SQL schema in Supabase Dashboard SQL Editor.');
                    console.warn('See init.sql or the 10-Week Plan for the schema.');
                } else {
                    throw new Error(`Supabase connection failed: ${error.message}`);
                }
            }

            this.initialized = true;
            console.log('✅ Supabase connected successfully');
        } catch (error) {
            console.error('Failed to initialize database:', error);
            // Don't throw, allow hub to run even if DB is flaky (Phase 2 resilience)
        }
    }

    /**
     * Record a health check result in the database
     */
    async recordStatusHistory(
        projectName: string,
        health: ProjectHealth
    ): Promise<void> {
        const { error } = await this.client
            .from('project_status_history')
            .insert({
                project_name: projectName,
                status: health.status,
                last_check: health.lastCheck.toISOString(),
                uptime_percentage: health.uptime,
                response_time_ms: health.responseTime,
                recorded_at: new Date().toISOString()
            });

        if (error) {
            console.error(`Failed to record status for ${projectName}:`, error);
        }
    }

    /**
     * Record metrics in the database
     */
    async recordMetrics(
        projectName: string,
        metrics: ProjectMetrics
    ): Promise<void> {
        const { error } = await this.client
            .from('project_metrics')
            .insert({
                project_name: projectName,
                requests_per_second: metrics.requestsPerSecond,
                error_rate: metrics.errorRate,
                error_count: metrics.errorCount,
                api_usage: metrics.apiUsage,
                memory_usage_percent: metrics.memoryUsagePercent,
                cpu_usage_percent: metrics.cpuUsagePercent,
                database_query_time_ms: metrics.databaseQueryTime,
                recorded_at: new Date().toISOString()
            });

        if (error) {
            console.error(`Failed to record metrics for ${projectName}:`, error);
        }
    }

    /**
     * Get the latest health status for a project
     */
    async getLatestStatus(projectName: string): Promise<StatusHistoryRecord | null> {
        const { data, error } = await this.client
            .from('project_status_history')
            .select('*')
            .eq('project_name', projectName)
            .order('recorded_at', { ascending: false })
            .limit(1)
            .single();

        if (error || !data) {
            return null;
        }

        return {
            projectName: data.project_name,
            status: data.status,
            lastCheck: new Date(data.last_check),
            uptimePercentage: data.uptime_percentage,
            responseTimeMs: data.response_time_ms,
            recordedAt: new Date(data.recorded_at),
        };
    }

    /**
     * Get historical status for a project over a time range
     */
    async getStatusHistory(
        projectName: string,
        hours: number = 24
    ): Promise<StatusHistoryRecord[]> {
        const timeThreshold = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

        const { data, error } = await this.client
            .from('project_status_history')
            .select('*')
            .eq('project_name', projectName)
            .gt('recorded_at', timeThreshold)
            .order('recorded_at', { ascending: true });

        if (error) {
            console.error(`Failed to get status history for ${projectName}:`, error);
            return [];
        }

        return (data || []).map(row => ({
            projectName: row.project_name,
            status: row.status,
            lastCheck: new Date(row.last_check),
            uptimePercentage: row.uptime_percentage,
            responseTimeMs: row.response_time_ms,
            recordedAt: new Date(row.recorded_at),
        }));
    }

    /**
     * Get the latest metrics for all projects
     * Note: Supabase doesn't support distinct on easily via JS client for this specific query pattern efficiently without RPC, 
     * but we'll use a simplified approach for Phase 1/2.
     */
    async getLatestMetricsForAll(): Promise<Record<string, ProjectMetrics>> {
        // Fetch last 100 records and categorize in memory (simple for small scale)
        const { data, error } = await this.client
            .from('project_metrics')
            .select('*')
            .order('recorded_at', { ascending: false })
            .limit(100);

        if (error) {
            console.error('Failed to get latest metrics:', error);
            return {};
        }

        const metrics: Record<string, ProjectMetrics> = {};
        const processingSet = new Set<string>();

        for (const row of (data || [])) {
            if (!processingSet.has(row.project_name)) {
                metrics[row.project_name] = {
                    projectName: row.project_name,
                    requestsPerSecond: row.requests_per_second,
                    errorRate: row.error_rate,
                    errorCount: row.error_count,
                    apiUsage: row.api_usage || {},
                    memoryUsagePercent: row.memory_usage_percent,
                    cpuUsagePercent: row.cpu_usage_percent,
                    databaseQueryTime: row.database_query_time_ms,
                    timestamp: new Date(row.recorded_at),
                };
                processingSet.add(row.project_name);
            }
        }

        return metrics;
    }

    /**
     * Close the database connection
     */
    async close(): Promise<void> {
        // Supabase client doesn't need explicit closing in the same way as a pg pool
    }
}

// Create a singleton instance
export const database = new Database();
