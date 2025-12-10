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
        const [name, url] = projectDef.trim().split(':');
        if (!name || !url) {
            throw new Error(`Invalid project definition: ${projectDef}. Expected format: name:url`);
        }
        return {
            name: name.trim(),
            url: url.trim(),
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

    database: {
        host: getEnvString('DB_HOST', 'postgres'),
        port: getEnvNumber('DB_PORT', 5432),
        user: getEnvString('DB_USER', 'postgres'),
        password: getEnvString('DB_PASSWORD', 'postgres'),
        database: getEnvString('DB_NAME', 'orchestration'),
        pool: {
            min: getEnvNumber('DB_POOL_MIN', 2),
            max: getEnvNumber('DB_POOL_MAX', 20),
        },
    },

    redis: {
        host: getEnvString('REDIS_HOST', 'redis'),
        port: getEnvNumber('REDIS_PORT', 6379),
    },

    projects: parseProjects(),

    logging: {
        level: getEnvString('LOG_LEVEL', 'info') as any,
    },
};

// Validate configuration on startup
if (config.projects.length === 0) {
    throw new Error('No projects configured. Set PROJECTS environment variable.');
}

console.log(`Configuration loaded. Monitoring ${config.projects.length} projects.`);
