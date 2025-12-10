// orchestration-hub/src/agents/AutoFixerAgent.ts

import { BaseAgent } from './BaseAgent';
import { EventType, SystemEvent, ProjectMetrics } from '../types';
import { ActionType } from '../types/actions';
import { actionExecutor } from '../services/ActionExecutor';
import { claudeAnalyzer } from '../services/ClaudeAnalyzer';

/**
 * Auto-Fixer Agent
 * Subscribes to anomalies and automatically fixes simple problems.
 * This is the core of Phase 3: Autonomous Action.
 */
export class AutoFixerAgent extends BaseAgent {
    constructor() {
        super('AutoFixerAgent');
    }

    protected async onStart(): Promise<void> {
        // Subscribe to anomalies
        await this.subscribe(EventType.ANOMALY_DETECTED, this.handleAnomaly.bind(this));

        // Subscribe to critical failures
        await this.subscribe(EventType.PROJECT_DOWN, this.handleProjectDown.bind(this));
    }

    protected async onStop(): Promise<void> {
        // Cleanup if needed
    }

    /**
     * Handle metric anomalies (High CPU, Memory, etc.)
     */
    private async handleAnomaly(event: SystemEvent): Promise<void> {
        const { projectName, anomalies, metrics } = event.payload as {
            projectName: string;
            anomalies: string[];
            metrics: ProjectMetrics;
        };

        console.log(`[${this.name}] Analyzing anomalies for ${projectName}...`);

        // Phase 4: AI Reasoning
        // We now ask Claude what to do instead of using simple if/else rules

        // 1. Ask Claude
        const decision = await claudeAnalyzer.analyzeSituation(projectName, anomalies, metrics);

        // 2. Publish AI Decision event (for dashboard visibility)
        await this.publish(EventType.AI_DECISION, {
            projectName,
            decision
        });

        // 3. Execute recommended action if confidence is high enough
        if (decision.action && decision.confidence > 0.7) {
            console.log(`[${this.name}] 🤖 Executing AI recommendation: ${decision.action}`);

            await actionExecutor.executeAction(decision.action, {
                projectId: projectName,
                projectName,
                reason: `AI Recommendation: ${decision.reasoning}`,
                triggeredBy: 'auto-fixer'
            });
        } else {
            console.log(`[${this.name}] ✋ AI confidence too low (${decision.confidence}). Escalating or doing nothing.`);
            // Optionally escalate here
        }
    }

    /**
     * Handle project down events
     */
    private async handleProjectDown(event: SystemEvent): Promise<void> {
        const { projectName } = event.payload;
        console.log(`[${this.name}] 🚨 Project ${projectName} is DOWN. Initiating emergency restart.`);

        await this.executeFix(projectName, ActionType.RESTART_SERVICE, 'Project is down');
    }

    /**
     * Execute the chosen fix via ActionExecutor
     */
    private async executeFix(projectName: string, action: ActionType, reason: string): Promise<void> {
        await actionExecutor.executeAction(action, {
            projectId: projectName, // utilizing name as ID for now
            projectName,
            reason,
            triggeredBy: 'auto-fixer'
        });
    }
}
