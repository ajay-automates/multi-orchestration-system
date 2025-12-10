import { BaseAgent } from './BaseAgent';
import { EventType, SystemEvent } from '../types';

export class HealthMonitorAgent extends BaseAgent {
    constructor() {
        super('HealthMonitorAgent');
    }

    protected async onStart(): Promise<void> {
        // Subscribe to health changes
        await this.subscribe(EventType.PROJECT_HEALTH_CHANGED, this.handleHealthChange.bind(this));
        console.log(`[${this.name}] Listening for health changes...`);
    }

    protected async onStop(): Promise<void> {
        // Cleanup if needed
    }

    private async handleHealthChange(event: SystemEvent): Promise<void> {
        const { projectName, newStatus, oldStatus } = event.payload;

        console.log(`[${this.name}] Analyzing health change for ${projectName}: ${oldStatus} -> ${newStatus}`);

        if (newStatus === 'down') {
            await this.publish(EventType.PROJECT_DOWN, {
                projectName,
                severity: 'critical',
                message: `Project ${projectName} is DOWN! Immediate attention required.`
            });
            console.log(`[${this.name}] 🚨 TRIGGERED PROJECT_DOWN ALERT for ${projectName}`);
        } else if (newStatus === 'degraded') {
            await this.publish(EventType.PROJECT_DEGRADED, {
                projectName,
                severity: 'warning',
                message: `Project ${projectName} is degraded.`
            });
        } else if (newStatus === 'healthy' && oldStatus !== 'healthy') {
            await this.publish(EventType.PROJECT_RECOVERED, {
                projectName,
                severity: 'info',
                message: `Project ${projectName} has recovered.`
            });
        }
    }
}
