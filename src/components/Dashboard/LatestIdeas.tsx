import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lightbulb } from 'lucide-react';

interface Idea {
  id: string;
  title: string;
  category: string;
}

interface LatestIdeasProps {
  ideas: Idea[];
}

export function LatestIdeas({ ideas }: LatestIdeasProps) {
  return (
    <section>
       <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Ultime Idee</h2>
        <Link href="/ideas" className="text-sm font-medium text-primary hover:underline">
          Vedi tutto
        </Link>
      </div>
      {ideas.length > 0 ? (
        <div className="space-y-3">
          {ideas.map((idea) => (
            <Link href={`/ideas`} key={idea.id}>
                 <Card className="hover:bg-muted/50 transition-colors">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Lightbulb className="text-yellow-400" />
                            <p className="font-semibold">{idea.title}</p>
                        </div>
                        <Badge variant="outline">{idea.category}</Badge>
                    </CardContent>
                 </Card>
            </Link>
          ))}
        </div>
      ) : (
         <p className="text-muted-foreground">Nessuna idea in sospeso. Aggiungine una nuova!</p>
      )}
    </section>
  );
} 