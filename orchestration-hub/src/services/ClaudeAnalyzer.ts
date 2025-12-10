// orchestration-hub/src/services/ClaudeAnalyzer.ts

import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config';
import { ProjectMetrics } from '../types';
import { ActionType } from '../types/actions';

/**
 * Structure of the decision returned by Claude
 */
export interface AIDecision {
    action: ActionType | null; // null if no action needed
    confidence: number; // 0 to 1
    reasoning: string;
    alternatives: string[];
}

/**
 * Service that interfaces with Anthropic's Claude API
 * Analyzes system context and recommends actions
 */
export class ClaudeAnalyzer {
    private client: Anthropic;
    private model: string;

    constructor() {
        if (!config.ai.apiKey) {
            console.warn('⚠️ No Anthropic API Key found. AI features will be disabled.');
        }

        this.client = new Anthropic({
            apiKey: config.ai.apiKey,
        });
        this.model = config.ai.model;
    }

    /**
     * Ask Claude to analyze the current system state
     */
    async analyzeSituation(
        projectName: string,
        anomalies: string[],
        metrics: ProjectMetrics
    ): Promise<AIDecision> {
        console.log(`[ClaudeAnalyzer] 🧠 Asking Claude to analyze ${projectName}...`);

        try {
            const prompt = this.buildPrompt(projectName, anomalies, metrics);

            const message = await this.client.messages.create({
                model: this.model,
                max_tokens: 1024,
                system: `You are an expert Site Reliability Engineer (SRE) managing a critical system. 
                Analyze the provided system metrics and anomalies.
                Recommend the single best remediation action from the available tools.
                Your response must be valid JSON in the specified format.`,
                messages: [
                    { role: 'user', content: prompt }
                ]
            });

            // Parse valid JSON from Claude's response
            // We use a simple regex to extract the JSON block if Claude adds extra text
            const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);

            if (!jsonMatch) {
                throw new Error('Could not parse JSON from Claude response');
            }

            const decision = JSON.parse(jsonMatch[0]) as AIDecision;

            console.log(`[ClaudeAnalyzer] 💡 Analysis complete. Recommendation: ${decision.action} (${decision.confidence * 100}% confidence)`);
            return decision;

        } catch (error) {
            console.error('[ClaudeAnalyzer] analysis failed:', error);
            // Fallback to safe default
            return {
                action: null,
                confidence: 0,
                reasoning: 'AI Analysis failed due to error: ' + (error instanceof Error ? error.message : 'Unknown'),
                alternatives: []
            };
        }
    }

    /**
     * Construct the prompt for Claude
     */
    private buildPrompt(projectName: string, anomalies: string[], metrics: ProjectMetrics): string {
        return `
        Project: ${projectName}
        Status: ANOMALY DETECTED
        
        Current Anomalies:
        ${anomalies.map(a => `- ${a}`).join('\n')}
        
        Detailed Metrics:
        - CPU Usage: ${metrics.cpuUsagePercent.toFixed(1)}%
        - Memory Usage: ${metrics.memoryUsagePercent.toFixed(1)}%
        - Error Rate: ${metrics.errorRate.toFixed(2)}%
        - Requests/Sec: ${metrics.requestsPerSecond.toFixed(1)}
        
        Available Actions:
        1. "restart_service" (Use for high error rates, unresponsiveness, or fatal crashes)
        2. "clear_cache" (Use for high memory usage)
        3. "pause_service" (Use for extreme CPU load to prevent cascade failure)
        4. "escalate_to_human" (Use if unsure or if multiple metrics are weird/conflicting)
        5. null (Do nothing if it looks like a temporary spike)
        
        Respond with this JSON structure ONLY:
        {
          "action": "restart_service" | "clear_cache" | "pause_service" | "escalate_to_human" | null,
          "confidence": number, // 0.0 to 1.0
          "reasoning": "string explanation of why you chose this action",
          "alternatives": ["string", "string"] // other actions considered
        }
        `;
    }
}

export const claudeAnalyzer = new ClaudeAnalyzer();
