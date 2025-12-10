// dashboard/app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface ProjectStatus {
    projectName: string;
    status: 'healthy' | 'degraded' | 'down';
    lastCheck: string;
    uptime: number;
    responseTime: number;
}

export default function Dashboard() {
    const [projects, setProjects] = useState<ProjectStatus[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
    const [wsConnected, setWsConnected] = useState(false);

    useEffect(() => {
        // Fetch initial status
        const fetchStatus = async () => {
            try {
                const response = await fetch('http://localhost:4001/api/projects/status');
                const data = await response.json();

                if (data.success && data.data) {
                    const projectsList = Object.values(data.data) as ProjectStatus[];
                    setProjects(projectsList);
                    setLastUpdate(new Date());
                }

                setLoading(false);
            } catch (error) {
                console.error('Failed to fetch status:', error);
                setLoading(false);
            }
        };

        fetchStatus();

        // Try to connect to WebSocket for real-time updates
        try {
            const ws = new WebSocket('ws://localhost:4001/ws/status');

            ws.onopen = () => {
                console.log('Connected to WebSocket');
                setWsConnected(true);
            };

            ws.onmessage = (event) => {
                const message = JSON.parse(event.data);
                if (message.type === 'status-update') {
                    const projectsList = Object.values(message.data) as ProjectStatus[];
                    setProjects(projectsList);
                    setLastUpdate(new Date(message.timestamp));
                }
            };

            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                setWsConnected(false);
            };

            ws.onclose = () => {
                console.log('WebSocket disconnected');
                setWsConnected(false);
                // Try to reconnect after 5 seconds
                setTimeout(() => {
                    // Reconnection logic would go here
                }, 5000);
            };

            return () => {
                ws.close();
            };
        } catch (error) {
            console.error('Failed to connect to WebSocket:', error);
        }
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'healthy':
                return 'bg-green-500/20 border-green-500';
            case 'degraded':
                return 'bg-yellow-500/20 border-yellow-500';
            case 'down':
                return 'bg-red-500/20 border-red-500';
            default:
                return 'bg-gray-500/20 border-gray-500';
        }
    };

    const getStatusDot = (status: string) => {
        switch (status) {
            case 'healthy':
                return 'bg-green-500';
            case 'degraded':
                return 'bg-yellow-500';
            case 'down':
                return 'bg-red-500';
            default:
                return 'bg-gray-500';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-white text-xl">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-12">
                    <h1 className="text-5xl font-bold text-white mb-2">
                        Multi-Orchestration Dashboard
                    </h1>
                    <div className="flex items-center gap-2 text-gray-400">
                        <span>Phase 1: Observability Foundation</span>
                        {wsConnected && (
                            <span className="flex items-center gap-1">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                Live
                            </span>
                        )}
                    </div>
                </div>

                {/* Last Update */}
                {lastUpdate && (
                    <div className="mb-8 text-sm text-gray-500">
                        Last updated: {lastUpdate.toLocaleTimeString()}
                    </div>
                )}

                {/* Projects Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map((project, index) => (
                        <motion.div
                            key={project.projectName}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`rounded-lg border p-6 backdrop-blur ${getStatusColor(project.status)}`}
                        >
                            {/* Project Header */}
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h2 className="text-xl font-bold text-white capitalize">
                                        {project.projectName.replace('-', ' ')}
                                    </h2>
                                </div>
                                <div className={`w-4 h-4 rounded-full ${getStatusDot(project.status)}`}></div>
                            </div>

                            {/* Status Badge */}
                            <div className="mb-4">
                                <span className="px-3 py-1 rounded-full text-sm font-medium capitalize" style={{
                                    backgroundColor: project.status === 'healthy' ? 'rgba(34, 197, 94, 0.2)' :
                                        project.status === 'degraded' ? 'rgba(234, 179, 8, 0.2)' :
                                            'rgba(239, 68, 68, 0.2)',
                                    color: project.status === 'healthy' ? '#22c55e' :
                                        project.status === 'degraded' ? '#eab308' :
                                            '#ef4444'
                                }}>
                                    {project.status}
                                </span>
                            </div>

                            {/* Metrics */}
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Uptime</span>
                                    <span className="text-white font-mono">{project.uptime.toFixed(1)}%</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Response Time</span>
                                    <span className="text-white font-mono">{project.responseTime}ms</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Last Check</span>
                                    <span className="text-white font-mono text-xs">
                                        {new Date(project.lastCheck).toLocaleTimeString()}
                                    </span>
                                </div>
                            </div>

                            {/* Uptime Bar */}
                            <div className="mt-4 h-1 bg-gray-700 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${project.uptime}%` }}
                                    transition={{ duration: 0.5 }}
                                    className={`h-full ${project.status === 'healthy' ? 'bg-green-500' : 'bg-red-500'}`}
                                ></motion.div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Footer */}
                <div className="mt-12 text-center text-gray-500 text-sm">
                    <p>Monitoring {projects.length} projects in real-time</p>
                </div>
            </div>
        </div>
    );
}
