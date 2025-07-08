'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, CheckCircle, Clock } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface ChallengeAnalyticsProps {
    data: {
        totalChallenges: number;
        completedChallenges: number;
        activeChallenges: number;
        averageCompletion: number;
    };
    className?: string;
}

export function ChallengeAnalytics({ data, className = '' }: ChallengeAnalyticsProps) {
    const { totalChallenges, completedChallenges, activeChallenges, averageCompletion } = data;

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                    <Target className="w-5 h-5 text-green-600" />
                    <span>Analisi Sfide & Obiettivi</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">Obiettivi Totali</p>
                        <p className="text-2xl font-bold">{totalChallenges}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                        <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Completati</p>
                        <p className="text-2xl font-bold">{completedChallenges}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                        <Clock className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">In Corso</p>
                        <p className="text-2xl font-bold">{activeChallenges}</p>
                    </div>
                </div>

                {/* Progress Bar */}
                <div>
                    <h4 className="text-lg font-medium mb-2">Tasso di Completamento Medio</h4>
                    <div className="flex items-center space-x-4">
                        <Progress value={averageCompletion} className="w-full" />
                        <span className="text-xl font-bold text-green-600">{Math.round(averageCompletion)}%</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
} 