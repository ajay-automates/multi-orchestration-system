
// orchestration-hub/scripts/test-ai-anomaly.ts
import { eventBus } from '../src/services/EventBus';
import { EventType } from '../src/types';
import { database } from '../src/database';

async function simulateAnomaly() {
    console.log('--- Simulating Critical Anomaly ---');

    // Connect to specific eventBus impl if needed, or just publish
    // Note: We need to initialize things first to ensure connections
    await database.initialize();

    const payload = {
        projectName: 'email-blast',
        anomalies: [
            'High Memory Usage (92%)',
            'Slightly Elevated Error Rate (2.1%)'
        ],
        metrics: {
            projectName: 'email-blast',
            cpuUsagePercent: 45,
            memoryUsagePercent: 92, // High memory
            errorRate: 2.1,
            requestsPerSecond: 150,
            timestamp: new Date()
        }
    };

    console.log('Publishing ANOMALY_DETECTED event...');

    // We can't import the runtime/active eventBus instance easily from a separate script
    // unless we start the app. 
    // Instead, we will perform a POST request to the /health or a test endpoint if we had one.
    // OR, we can just run this script which imports the EventBus class. 
    // Since EventBus uses "in-memory" events in the running process, running this script 
    // LOCALLY won't trigger the RUNNING server's event bus unless we use Redis (which we removed).

    // Wait! Since we removed Redis, *isolated scripts cannot trigger events in the main server process*.
    // This is a downside of removing Redis.

    // To test this easily, I should expose an API startpoint in the Hub to Trigger Severity.
    console.log('Cannot emit to running server without Redis or HTTP endpoint.');
    console.log('Please call the HTTP endpoint instead.');
}

simulateAnomaly();
