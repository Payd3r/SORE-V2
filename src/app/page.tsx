'use client';

import useSWR from 'swr';
import { RecentMemories } from '@/components/Dashboard/RecentMemories';
import { LatestIdeas } from '@/components/Dashboard/LatestIdeas';
import { QuickActions } from '@/components/Dashboard/QuickActions';
import { UpcomingEvent } from '@/components/Dashboard/UpcomingEvent';
import { MoodSummary } from '@/components/Dashboard/MoodSummary';
import { DashboardSkeleton } from '@/components/Dashboard/DashboardSkeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function DashboardPage() {
  const { data, error, isLoading } = useSWR('/api/dashboard', fetcher);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error || !data) {
    return (
        <div className="container mx-auto p-4">
            <Alert variant="destructive">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Errore</AlertTitle>
                <AlertDescription>
                Impossibile caricare i dati della dashboard. Riprova più tardi.
                </AlertDescription>
            </Alert>
        </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <div className="lg:col-span-4">
                 <UpcomingEvent countdown={data.upcomingCountdown} />
            </div>
            <div className="lg:col-span-3">
                <MoodSummary topMood={data.topMood} />
            </div>
        </div>

      <QuickActions />
      <RecentMemories memories={data.recentMemories} />
      <LatestIdeas ideas={data.latestIdeas} />
    </div>
  );
} 