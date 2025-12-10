import { eventBus } from '../services/EventBus';
import { SystemEvent, EventType } from '../types';

/**
 * Abstract base class for all intelligent agents
 */
export abstract class BaseAgent {
    protected name: string;
    protected isRunning: boolean = false;

    constructor(name: string) {
        this.name = name;
    }

    /**
     * Start the agent's main loop or listeners
     */
    async start(): Promise<void> {
        if (this.isRunning) return;

        console.log(`[Agent] Starting ${this.name}...`);
        this.isRunning = true;
        await this.onStart();
        console.log(`[Agent] ${this.name} started`);
    }

    /**
     * Stop the agent
     */
    async stop(): Promise<void> {
        if (!this.isRunning) return;

        console.log(`[Agent] Stopping ${this.name}...`);
        this.isRunning = false;
        await this.onStop();
        console.log(`[Agent] ${this.name} stopped`);
    }

    /**
     * Publish an event to the system
     */
    protected async publish(type: EventType, payload: any, metadata?: Record<string, any>): Promise<void> {
        await eventBus.publish(type, this.name, payload, metadata);
    }

    /**
     * Subscribe to an event
     */
    protected async subscribe(type: EventType, handler: (event: SystemEvent) => void): Promise<void> {
        await eventBus.subscribe(type, handler);
    }

    /**
     * Lifecycle method: Called when agent starts
     */
    protected abstract onStart(): Promise<void>;

    /**
     * Lifecycle method: Called when agent stops
     */
    protected abstract onStop(): Promise<void>;
}
