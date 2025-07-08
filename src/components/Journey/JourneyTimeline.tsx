'use client';

interface Memory {
    id: string;
    title: string;
    date: string;
}

interface JourneyTimelineProps {
  memories: Memory[];
  onMemorySelect: (memoryId: string) => void; // Callback to highlight map marker
}

export default function JourneyTimeline({ memories, onMemorySelect }: JourneyTimelineProps) {
  return (
    <div className="space-y-4">
        <h2 className="text-xl font-semibold">Tappe del Viaggio</h2>
        <ul className="border-l-2 border-gray-200 dark:border-gray-700 pl-4">
            {memories.map((memory) => (
                <li 
                    key={memory.id} 
                    className="mb-4 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                    onClick={() => onMemorySelect(memory.id)}
                >
                    <p className="font-bold">{memory.title}</p>
                    <p className="text-sm text-gray-500">{new Date(memory.date).toLocaleDateString()}</p>
                </li>
            ))}
        </ul>
    </div>
  );
} 