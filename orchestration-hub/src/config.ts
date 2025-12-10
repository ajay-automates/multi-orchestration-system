// orchestration-hub/src/config.ts
// Configuration loading - reads from environment variables and creates typed config

import { config as loadEnv } from 'dotenv';
import { Config, Project } from './types';

// Load environment variables from .env file
loadEnv();

function getEnvString(name: string, defaultValue?: string): string {
    const value = process.env[name];
    if (!value && defaultValue === undefined) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value || defaultValue!;
}

function getEnvNumber(name: string, defaultValue?: number): number {
    const value = process.env[name];
    if (value === undefined && defaultValue === undefined) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value ? parseInt(value, 10) : defaultValue!;
}

function getEnvBoolean(name: string, defaultValue?: boolean): boolean {
    const value = process.env[name];
    if (value === undefined && defaultValue === undefined) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value ? value.toLowerCase() === 'true' : defaultValue!;
}

/**
 * Parse projects from environment variable
 * Format: "project1:http://project1:3000,project2:http://project2:3000"
 */
function parseProjects(): Project[] {
    const projectsEnv = getEnvString('PROJECTS', 'email-blast:http://email-blast:3000,chatbot:http://chatbot:3000,social-media:http://social-media:3000');

    return projectsEnv.split(',').map(projectDef => {
        const firstColonIndex = projectDef.indexOf(':');
        if (firstColonIndex === -1) {
            throw new Error(`Invalid project definition: ${projectDef}. Expected format: name:url`);
        }

        const name = projectDef.substring(0, firstColonIndex).trim();
        const url = projectDef.substring(firstColonIndex + 1).trim();

        if (!name || !url) {
            throw new Error(`Invalid project definition: ${projectDef}. Expected format: name:url`);
        }
        return {
            name: name,
            url: url,
            critical: true,
            healthCheckInterval: 10000,  // Check every 10 seconds
            metricsCheckInterval: 30000, // Check every 30 seconds
        };
    });
}

/**
 * Load and validate configuration
 * This is called on application startup
 */
export const config: Config = {
    node_env: getEnvString('NODE_ENV', 'development') as any,
    port: getEnvNumber('PORT', 3001),

    supabase: {
        url: getEnvString('NEXT_PUBLIC_SUPABASE_URL'),
        key: process.env.SUPABASE_SERVICE_KEY || getEnvString('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    },

    projects: parseProjects(),

    ai: {
        apiKey: getEnvString('ANTHROPIC_API_KEY'),
        model: 'claude-3-5-sonnet-20240620', // Faster and likely available
    },
    logging: {
        level: getEnvString('LOG_LEVEL', 'info') as any,
    },
};

// Validate configuration on startup
if (config.projects.length === 0) {
    throw new Error('No projects configured. Set PROJECTS environment variable.');
}

console.log(`Configuration loaded. Monitoring ${config.projects.length} projects.`);
