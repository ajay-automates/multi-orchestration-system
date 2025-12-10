/**
 * Supported action types for the system
 */
export enum ActionType {
    RESTART_SERVICE = 'restart_service',
    CLEAR_CACHE = 'clear_cache',
    PAUSE_SERVICE = 'pause_service',
    ROLLBACK_DEPLOYMENT = 'rollback_deployment',
    ESCALATE_TO_HUMAN = 'escalate_to_human'
}

/**
 * Status of an action execution
 */
export enum ActionStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    EXECUTING = 'executing',
    COMPLETED = 'completed',
    FAILED = 'failed'
}

/**
 * Metadata for an action
 */
export interface ActionMetadata {
    projectId: string;
    projectName: string;
    reason: string;
    triggeredBy: 'system' | 'human' | 'auto-fixer';
    params?: Record<string, any>;
}

/**
 * Structure of an Action in the database
 */
export interface ActionRecord {
    id?: string;
    project_name: string;
    action_type: ActionType;
    status: ActionStatus;
    triggered_by: string;
    result?: string;
    executed_at?: Date;
    created_at: Date;
    metadata: ActionMetadata;
}
