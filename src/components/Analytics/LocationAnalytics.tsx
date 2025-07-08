'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AnalyticsMap } from './AnalyticsMap';
import { MapPin, Hash } from 'lucide-react';

interface LocationStat {
    name: string | null;
    count: number;
    latitude: string | null;
    longitude: string | null;
}

interface Coordinate {
    lat: number;
    lng: number;
    title: string;
    date: Date;
}

interface LocationAnalyticsProps {
    data: {
        topLocations: LocationStat[];
        coordinates: Coordinate[];
    };
    className?: string;
}

export function LocationAnalytics({ data, className = '' }: LocationAnalyticsProps) {
    const { topLocations, coordinates } = data;

    return (
        <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 ${className}`}>
            {/* Top Locations List */}
            <Card className="lg:col-span-1">
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <MapPin className="w-5 h-5 text-blue-600" />
                        <span>Luoghi più Visitati</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-3">
                        {topLocations.map((location, index) => (
                            <li key={index} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                                <div className="flex items-center space-x-3">
                                    <span className="text-sm font-bold text-gray-500">{index + 1}.</span>
                                    <p className="font-medium text-gray-800">{location.name}</p>
                                </div>
                                <div className="flex items-center space-x-1 text-sm text-gray-600">
                                    <Hash className="w-3 h-3" />
                                    <span>{location.count}</span>
                                </div>
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>

            {/* Map */}
            <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <MapPin className="w-5 h-5 text-green-600" />
                        <span>Mappa dei Ricordi</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <AnalyticsMap coordinates={coordinates} />
                </CardContent>
            </Card>
        </div>
    );
} 