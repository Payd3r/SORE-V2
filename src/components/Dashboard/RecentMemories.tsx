import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import Image from 'next/image';

interface Memory {
  id: string;
  title: string;
  images: { path: string }[];
}

interface RecentMemoriesProps {
  memories: Memory[];
}

export function RecentMemories({ memories }: RecentMemoriesProps) {
  return (
    <section>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Ricordi Recenti</h2>
        <Link href="/timeline" className="text-sm font-medium text-primary hover:underline">
          Vedi tutto
        </Link>
      </div>
      {memories.length > 0 ? (
        <Carousel
          opts={{
            align: 'start',
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent>
            {memories.map((memory) => (
              <CarouselItem key={memory.id} className="md:basis-1/3 lg:basis-1/5">
                <Link href={`/memories/${memory.id}`}>
                  <div className="p-1">
                    <Card>
                      <CardContent className="relative aspect-square flex items-center justify-center p-0 overflow-hidden rounded-lg">
                        {memory.images?.[0]?.path ? (
                          <Image
                            src={`/uploads/images/${memory.images[0].path}`}
                            alt={memory.title}
                            fill
                            className="object-cover transition-transform hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full bg-secondary flex items-center justify-center">
                            <span className="text-muted-foreground text-xs">No image</span>
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                            <h3 className="text-white text-sm font-semibold truncate">{memory.title}</h3>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </Link>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden sm:flex" />
          <CarouselNext className="hidden sm:flex" />
        </Carousel>
      ) : (
        <p className="text-muted-foreground">Nessun ricordo recente da mostrare. Inizia a crearne uno!</p>
      )}
    </section>
  );
} 