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
                signal: AbortSignal.timeout(5000),
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
                signal: AbortSignal.timeout(5000),
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
