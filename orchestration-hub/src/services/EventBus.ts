import { EventEmitter } from 'events';
import { database } from '../database';
import { SystemEvent, EventType } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';

/**
 * EventBus handles internal communication between agents using Node.js EventEmitter (In-Memory)
 * Also persists events to Supabase for history/audit.
 */
export class EventBus {
    private emitter: EventEmitter;

    constructor() {
        this.emitter = new EventEmitter();
        this.emitter.setMaxListeners(50); // Increase limit for many agents
    }

    /**
     * Publish an event to the bus
     */
    async publish(type: EventType, source: string, payload: any, metadata?: Record<string, any>): Promise<void> {
        const event: SystemEvent = {
            id: uuidv4(),
            type,
            source,
            timestamp: new Date(),
            payload,
            metadata
        };

        // 1. Emit locally (sync/fast)
        this.emitter.emit(type, event);
        this.emitter.emit('*', event); // Wildcard for logging

        if (config.logging.level === 'debug') {
            console.log(`[EventBus] Published ${type} from ${source}`);
        }

        // 2. Persist to Supabase (async)
        // We don't await this to avoid blocking critical path, but we log errors
        this.persistEvent(event).catch(err =>
            console.error('[EventBus] Failed to persist event to Supabase:', err)
        );
    }

    /**
     * Subscribe to an event type
     */
    async subscribe(type: EventType, handler: (event: SystemEvent) => void): Promise<void> {
        this.emitter.on(type, handler);
    }

    /**
     * Persist event to Supabase agent_events table
     */
    private async persistEvent(event: SystemEvent): Promise<void> {
        const { error } = await database.client
            .from('agent_events')
            .insert({
                project_name: event.payload?.projectName || 'system',
                event_type: event.type,
                description: this.getEventDescription(event),
                severity: this.getEventSeverity(event),
                metadata: event,
                occurred_at: event.timestamp.toISOString()
            });

        if (error) {
            // Only log if it's a real error, not just missing table (which is common in early dev)
            if (error.code !== '42P01') {
                console.warn('[EventBus] Supabase insert error:', error.message);
            }
        }
    }

    private getEventDescription(event: SystemEvent): string {
        if (event.payload?.message) return event.payload.message;
        if (event.type === EventType.METRICS_COLLECTED) return 'Metrics collected';
        return `Event ${event.type} from ${event.source}`;
    }

    private getEventSeverity(event: SystemEvent): string {
        if (event.payload?.severity) return event.payload.severity;
        if (event.type.includes('down') || event.type.includes('failed')) return 'critical';
        if (event.type.includes('degraded') || event.type.includes('anomaly')) return 'warning';
        return 'info';
    }

    async close(): Promise<void> {
        this.emitter.removeAllListeners();
    }
}

// Singleton instance
export const eventBus = new EventBus();
