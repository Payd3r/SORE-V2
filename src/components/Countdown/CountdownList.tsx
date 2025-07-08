'use client';

import { Countdown } from '@prisma/client';
import CountdownTimer from './CountdownTimer';
import { Button } from '@/components/ui/button';

interface CountdownListProps {
  countdowns: Countdown[];
  onEdit: (countdown: Countdown) => void;
  onDelete: (id: string) => void;
}

const CountdownList = ({ countdowns, onEdit, onDelete }: CountdownListProps) => {
  if (countdowns.length === 0) {
    return <p className="text-center text-gray-500 mt-8">Nessun conto alla rovescia ancora creato.</p>;
  }

  return (
    <div className="space-y-8">
      {countdowns.map((countdown) => (
        <div key={countdown.id} className="p-6 border rounded-lg shadow-md bg-white dark:bg-gray-800">
          <h3 className="text-2xl font-bold mb-2">{countdown.title}</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">{countdown.description}</p>
          <div className="flex justify-center my-4">
              <CountdownTimer 
                targetDate={countdown.date.toISOString()} 
                startDate={countdown.createdAt.toISOString()}
              />
          </div>
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={() => onEdit(countdown)}>Modifica</Button>
            <Button variant="destructive" onClick={() => onDelete(countdown.id)}>Elimina</Button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CountdownList; 