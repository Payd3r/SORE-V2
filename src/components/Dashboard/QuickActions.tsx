import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlusCircle, Lightbulb, Camera, Map } from 'lucide-react';

const actions = [
  { href: '/memories/create', label: 'Nuovo Ricordo', icon: PlusCircle },
  { href: '/ideas/create', label: 'Nuova Idea', icon: Lightbulb },
  { href: '/moments/capture', label: 'Cattura Momento', icon: Camera },
  { href: '/map', label: 'Vedi Mappa', icon: Map },
];

export function QuickActions() {
  return (
    <section>
        <h2 className="text-2xl font-bold mb-4">Azioni Rapide</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {actions.map((action) => (
                <Link href={action.href} key={action.href}>
                    <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center gap-2">
                        <action.icon className="w-6 h-6" />
                        <span>{action.label}</span>
                    </Button>
                </Link>
            ))}
        </div>
    </section>
  );
} 