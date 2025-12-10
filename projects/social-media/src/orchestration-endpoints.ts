import { Router } from 'express';

const router = Router();

// Mock data generator
function getMockMetrics() {
    return {
        requestsPerSecond: 10 + Math.random() * 50,
        errorRate: Math.random() * 0.05,
        errorCount: Math.floor(Math.random() * 10),
        memoryUsagePercent: 30 + Math.random() * 20,
        cpuUsagePercent: 10 + Math.random() * 30,
        apiUsage: {
            sendgrid_emails: Math.floor(Math.random() * 1000),
            openai_api_calls: Math.floor(Math.random() * 200),
        },
        databaseQueryTime: Math.floor(10 + Math.random() * 50),
    };
}

router.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        lastCheck: new Date(),
        uptime: 100, // simplified
        isRunning: true,
        responseTime: Math.floor(Math.random() * 50),
    });
});

router.get('/metrics', (req, res) => {
    res.json(getMockMetrics());
});

router.get('/status', (req, res) => {
    res.json({
        isRunning: true,
        currentTasks: Math.floor(Math.random() * 20),
        activeUsers: Math.floor(Math.random() * 50),
        lastUpdate: new Date(),
    });
});

router.get('/logs', (req, res) => {
    res.json({
        logs: [
            {
                timestamp: new Date(),
                level: 'info',
                message: 'Endpoint called successfully',
            },
        ],
        total: 100,
    });
});

export default router;
