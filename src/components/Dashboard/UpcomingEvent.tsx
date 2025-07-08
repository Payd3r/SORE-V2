import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import CountdownTimer from '@/components/Countdown/CountdownTimer';
import { PartyPopper } from 'lucide-react';
import Link from 'next/link';

interface Countdown {
  id: string;
  title: string;
  date: string;
  createdAt: string;
}

interface UpcomingEventProps {
  countdown: Countdown | null;
}

export function UpcomingEvent({ countdown }: UpcomingEventProps) {
  if (!countdown) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <PartyPopper />
                    Prossimo Evento
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">Nessun evento in programma. <Link href="/countdowns" className="text-primary hover:underline">Aggiungine uno!</Link></p>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card>
        <CardHeader>
            <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <PartyPopper />
                    <span>{countdown.title}</span>
                </div>
                <Link href="/countdowns" className="text-sm font-medium text-primary hover:underline">
                    Vedi tutto
                </Link>
            </CardTitle>
        </CardHeader>
      <CardContent>
        <CountdownTimer targetDate={countdown.date} startDate={countdown.createdAt} />
      </CardContent>
    </Card>
  );
} 