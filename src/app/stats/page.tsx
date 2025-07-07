'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, ImageIcon, Heart, Music } from 'lucide-react';

// Funzione per recuperare i dati
const fetchStats = async () => {
  const res = await fetch('/api/stats');
  if (!res.ok) {
    throw new Error('Network response was not ok');
  }
  return res.json();
};

// Colori per il grafico a torta
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF1919'];

const StatsPage = () => {
  const { data: stats, isLoading, isError } = useQuery({
    queryKey: ['stats'],
    queryFn: fetchStats,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-8">
        <h1 className="text-3xl font-bold mb-6">Le nostre Statistiche</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <div className="grid gap-8 md:grid-cols-2 mt-8">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  if (isError || !stats) {
    return (
      <div className="container mx-auto p-4 md:p-8">
        <h1 className="text-3xl font-bold mb-6">Le nostre Statistiche</h1>
        <p>Impossibile caricare le statistiche. Riprova più tardi.</p>
      </div>
    );
  }
  
  const memoriesByYearData = Object.entries(stats.memoriesByYear).map(([year, count]) => ({
    name: year,
    Ricordi: count,
  }));

  const moodsDistributionData = Object.entries(stats.moodsDistribution).map(([name, value]) => ({
    name,
    value,
  }));

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Le Nostre Statistiche</h1>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ricordi Totali</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMemories}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Immagini Totali</CardTitle>
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalImages}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Primo Ricordo</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold truncate">{stats.oldestMemory?.title || '-'}</div>
            <p className="text-xs text-muted-foreground">
              {stats.oldestMemory ? new Date(stats.oldestMemory.date).toLocaleDateString() : ''}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ultimo Ricordo</CardTitle>
             <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             <div className="text-lg font-bold truncate">{stats.newestMemory?.title || '-'}</div>
             <p className="text-xs text-muted-foreground">
              {stats.newestMemory ? new Date(stats.newestMemory.date).toLocaleDateString() : ''}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-8 md:grid-cols-2 mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Ricordi per Anno</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={memoriesByYearData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Ricordi" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribuzione Stati d'Animo</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={moodsDistributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={(entry) => `${entry.name} (${entry.value})`}
                >
                  {moodsDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

       {/* Top Artists */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Artisti</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2">
              {stats.topArtists.map((artist: { name: string; count: number }, index: number) => (
                <li key={artist.name} className="flex items-center justify-between text-sm">
                  <span>{index + 1}. {artist.name}</span>
                  <span className="font-semibold">{artist.count} {artist.count > 1 ? 'volte' : 'volta'}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>

    </div>
  );
};

export default StatsPage; 