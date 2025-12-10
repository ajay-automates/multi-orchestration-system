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
