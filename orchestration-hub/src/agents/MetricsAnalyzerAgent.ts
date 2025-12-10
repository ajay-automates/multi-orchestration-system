import { BaseAgent } from './BaseAgent';
import { EventType, SystemEvent, ProjectMetrics } from '../types';

export class MetricsAnalyzerAgent extends BaseAgent {
    constructor() {
        super('MetricsAnalyzerAgent');
    }

    protected async onStart(): Promise<void> {
        await this.subscribe(EventType.METRICS_COLLECTED, this.analyzeMetrics.bind(this));
        console.log(`[${this.name}] Analyzing metrics stream...`);
    }

    protected async onStop(): Promise<void> {
        // Cleanup
    }

    private async analyzeMetrics(event: SystemEvent): Promise<void> {
        const { projectName, metrics } = event.payload as { projectName: string; metrics: ProjectMetrics };

        const anomalies = [];

        // Check CPU
        if (metrics.cpuUsagePercent > 80) {
            anomalies.push(`High CPU usage: ${metrics.cpuUsagePercent.toFixed(1)}%`);
        }

        // Check Memory
        if (metrics.memoryUsagePercent > 85) {
            anomalies.push(`High Memory usage: ${metrics.memoryUsagePercent.toFixed(1)}%`);
        }

        // Check Error Rate
        if (metrics.errorRate > 5) {
            anomalies.push(`High Error rate: ${metrics.errorRate.toFixed(1)}%`);
        }

        if (anomalies.length > 0) {
            console.warn(`[${this.name}] Detected anomalies for ${projectName}:`, anomalies);

            await this.publish(EventType.ANOMALY_DETECTED, {
                projectName,
                metrics,
                anomalies,
                severity: 'warning'
            });
        }
    }
}
