// dashboard/app/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ProjectStatus {
    projectName: string;
    status: 'healthy' | 'degraded' | 'down';
    lastCheck: string;
    uptime: number;
    responseTime: number;
}

interface SystemEvent {
    id: string;
    type: string;
    source: string;
    timestamp: string;
    payload: any;
    metadata?: any;
}

export default function Dashboard() {
    const [projects, setProjects] = useState<ProjectStatus[]>([]);
    const [events, setEvents] = useState<SystemEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
    const [wsConnected, setWsConnected] = useState(false);
    const eventsEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Scroll to bottom of events
        if (eventsEndRef.current) {
            eventsEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [events]);

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
                } else if (message.type === 'event') {
                    // Add new event to the list (keep last 50)
                    setEvents(prev => [...prev.slice(-49), message.event]);
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
                return 'bg-green-500/10 border-green-500/50 hover:bg-green-500/20';
            case 'degraded':
                return 'bg-yellow-500/10 border-yellow-500/50 hover:bg-yellow-500/20';
            case 'down':
                return 'bg-red-500/10 border-red-500/50 hover:bg-red-500/20';
            default:
                return 'bg-gray-500/10 border-gray-500/50';
        }
    };

    const getStatusDot = (status: string) => {
        switch (status) {
            case 'healthy': return 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]';
            case 'degraded': return 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]';
            case 'down': return 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]';
            default: return 'bg-gray-500';
        }
    };

    const getEventColor = (type: string) => {
        if (type.includes('down') || type.includes('failed')) return 'text-red-400';
        if (type.includes('degraded') || type.includes('anomaly')) return 'text-yellow-400';
        if (type.includes('recovered') || type.includes('healthy')) return 'text-green-400';
        return 'text-blue-400';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-white text-xl animate-pulse">Loading System...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black p-8 font-sans">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex justify-between items-end border-b border-gray-800 pb-6">
                    <div>
                        <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600 mb-2">
                            Multi-Orchesttration
                        </h1>
                        <div className="flex items-center gap-2 text-gray-400">
                            <span className="px-2 py-0.5 rounded bg-blue-900/30 text-blue-400 text-sm border border-blue-800">
                                Phase 2: Distributed Intelligence
                            </span>
                            {wsConnected && (
                                <span className="flex items-center gap-1 text-green-500 text-sm animate-pulse">
                                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                                    Live Connected
                                </span>
                            )}
                        </div>
                    </div>
                    {lastUpdate && (
                        <div className="text-right text-xs text-gray-600 font-mono">
                            Last sync: {lastUpdate.toLocaleTimeString()}
                        </div>
                    )}
                </div>

                {/* Dashboard Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Projects Column (2/3 width) */}
                    <div className="lg:col-span-2 space-y-6">
                        <h2 className="text-xl font-semibold text-gray-300 flex items-center gap-2">
                            <span className="w-2 h-8 bg-blue-500 rounded-full"></span>
                            Active Projects
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {projects.map((project, index) => (
                                <motion.div
                                    key={project.projectName}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className={`rounded-xl border p-6 backdrop-blur transition-all duration-300 ${getStatusColor(project.status)}`}
                                >
                                    <div className="flex items-start justify-between mb-6">
                                        <div>
                                            <h3 className="text-xl font-bold text-white capitalize tracking-tight">
                                                {project.projectName.replace('-', ' ')}
                                            </h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <div className={`w-2 h-2 rounded-full ${getStatusDot(project.status)}`}></div>
                                                <span className="text-sm font-medium uppercase tracking-wider text-gray-400">
                                                    {project.status}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-2xl font-mono text-white">{project.uptime.toFixed(1)}%</div>
                                            <div className="text-xs text-gray-500 uppercase">Uptime</div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-800/50">
                                        <div>
                                            <div className="text-gray-500 text-xs uppercase mb-1">Response Time</div>
                                            <div className="text-white font-mono">{project.responseTime} ms</div>
                                        </div>
                                        <div>
                                            <div className="text-gray-500 text-xs uppercase mb-1">Last Check</div>
                                            <div className="text-gray-300 text-xs font-mono">
                                                {new Date(project.lastCheck).toLocaleTimeString()}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Activity Log Column (1/3 width) */}
                    <div className="lg:col-span-1 space-y-6">
                        <h2 className="text-xl font-semibold text-gray-300 flex items-center gap-2">
                            <span className="w-2 h-8 bg-purple-500 rounded-full"></span>
                            Agent Activity
                        </h2>

                        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 h-[500px] overflow-y-auto font-mono text-xs scrollbar-thin scrollbar-thumb-gray-800">
                            <AnimatePresence>
                                {events.length === 0 ? (
                                    <div className="text-gray-600 text-center py-10 mt-20">
                                        Waiting for agent verification...
                                    </div>
                                ) : (
                                    events.map((event) => (
                                        <motion.div
                                            key={event.id || Math.random()}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="mb-3 pb-3 border-b border-gray-800/50 last:border-0"
                                        >
                                            <div className="flex justify-between text-gray-500 mb-1">
                                                <span>{new Date(event.timestamp).toLocaleTimeString()}</span>
                                                <span className="text-gray-400 font-bold">{event.source}</span>
                                            </div>
                                            <div className={`${getEventColor(event.type)} font-semibold mb-1`}>
                                                {event.type}
                                            </div>
                                            {event.payload?.message && (
                                                <div className="text-gray-300 mb-1">
                                                    {event.payload.message}
                                                </div>
                                            )}
                                            {event.payload?.metrics && (
                                                <div className="text-gray-500 pl-2 border-l border-gray-700 mt-1">
                                                    Error Rate: {event.payload.metrics.errorRate}%
                                                </div>
                                            )}
                                            {event.payload?.anomalies && (
                                                <div className="text-red-400 pl-2 border-l border-red-900 mt-1">
                                                    {event.payload.anomalies.join(', ')}
                                                </div>
                                            )}
                                        </motion.div>
                                    ))
                                )}
                                <div ref={eventsEndRef} />
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
