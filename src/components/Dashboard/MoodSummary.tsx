import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Smile, Frown, Meh, Angry, Laugh } from 'lucide-react';
import Link from 'next/link';

interface MoodStat {
  mood: string;
  _count: {
    mood: number;
  };
}

interface MoodSummaryProps {
  topMood: MoodStat | null;
}

const moodIcons: { [key: string]: React.ElementType } = {
  felice: Smile,
  triste: Frown,
  neutrale: Meh,
  arrabbiato: Angry,
  eccitato: Laugh,
};

export function MoodSummary({ topMood }: MoodSummaryProps) {
    const MoodIcon = topMood ? moodIcons[topMood.mood.toLowerCase()] || Meh : Meh;
  
    return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
            <div className='flex items-center gap-2'>
                <MoodIcon />
                <span>Riepilogo Umore</span>
            </div>
            <Link href="/stats" className="text-sm font-medium text-primary hover:underline">
                Dettagli
            </Link>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {topMood ? (
            <p>
                L'umore predominante negli ultimi 30 giorni è stato <span className="font-semibold">{topMood.mood}</span>.
            </p>
        ) : (
            <p className="text-muted-foreground">Nessun dato sull'umore registrato di recente.</p>
        )}
      </CardContent>
    </Card>
  );
} 