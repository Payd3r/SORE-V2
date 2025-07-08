'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Activity, Star } from 'lucide-react';

interface ActivityStat {
    name: string | null;
    count: number;
    percentage: number;
}

interface ActivityAnalyticsProps {
    data: {
        distribution: ActivityStat[];
        totalActivities: number;
        diversity: number;
    };
    className?: string;
}

export function ActivityAnalytics({ data, className = '' }: ActivityAnalyticsProps) {
    const { distribution, totalActivities, diversity } = data;

    const mostCommonActivity = distribution[0]?.name || 'N/A';

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                    <Activity className="w-5 h-5 text-indigo-600" />
                    <span>Analisi delle Attività</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">Attività Totali</p>
                        <p className="text-2xl font-bold">{totalActivities}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">Attività più Comune</p>
                        <p className="text-2xl font-bold truncate" title={mostCommonActivity}>{mostCommonActivity}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">Diversità Attività</p>
                        <p className="text-2xl font-bold">{diversity}</p>
                    </div>
                </div>

                {/* Bar Chart */}
                <div>
                    <h4 className="text-lg font-medium mb-4">Distribuzione per Categoria</h4>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                            data={distribution}
                            layout="vertical"
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12 }} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }}
                                labelStyle={{ fontWeight: 'bold' }}
                                formatter={(value: number) => [`${value} Ricordi`, 'Conteggio']}
                            />
                            <Bar dataKey="count" fill="#8884d8" barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
} 