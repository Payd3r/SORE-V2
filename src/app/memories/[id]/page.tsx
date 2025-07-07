'use client'

import { useState, useEffect } from 'react';
import { notFound, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { getMemoryById } from '@/lib/api';
import { Memory } from '@/types/memory';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MemoryGallery from '@/components/Gallery/MemoryGallery';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Music, Thermometer, Cloud, ArrowUp, Edit } from 'lucide-react';
import { MemoryHistoryTimeline } from '@/components/Timeline/MemoryHistoryTimeline';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getArtistNames } from '@/lib/spotify';
import { MemoryOverviewTab } from '@/components/Memory/MemoryOverviewTab';

export default function MemoryPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [memory, setMemory] = useState<Memory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const toggleVisibility = () => {
    if (window.scrollY > 300) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  useEffect(() => {
    async function fetchMemory() {
      try {
        setLoading(true);
        const fetchedMemory = await getMemoryById(params.id);
        if (!fetchedMemory) {
          notFound();
          return;
        }
        setMemory(fetchedMemory);
      } catch (err) {
        setError('Failed to load memory.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchMemory();
    
    window.addEventListener('scroll', toggleVisibility);

    return () => {
      window.removeEventListener('scroll', toggleVisibility);
    };
  }, [params.id]);

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <header className="mb-8">
          <Skeleton className="h-12 w-3/4 mb-2" />
          <Skeleton className="h-6 w-1/4" />
        </header>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Skeleton className="h-[400px] w-full" />
          </div>
          <div>
            <Skeleton className="h-20 w-full mb-4" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-500 py-10">{error}</div>;
  }

  if (!memory) {
    return notFound();
  }

  const canEdit = session?.user?.id === memory.authorId || session?.user?.role === 'admin';

  return (
    <>
      <div className="container mx-auto p-4">
        <header className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold">{memory.title}</h1>
            <p className="text-lg text-muted-foreground">{new Date(memory.date).toLocaleDateString('it-IT', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          {canEdit && (
            <Button onClick={() => router.push(`/memories/${params.id}/edit`)} variant="outline" size="icon">
              <Edit className="h-4 w-4" />
            </Button>
          )}
        </header>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Dettagli</TabsTrigger>
            <TabsTrigger value="history">Cronologia</TabsTrigger>
            <TabsTrigger value="gallery">Galleria</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details">
            <MemoryOverviewTab memory={memory} />
          </TabsContent>
          
          <TabsContent value="history">
            <MemoryHistoryTimeline images={memory.images} moments={memory.moments} />
          </TabsContent>
          
          <TabsContent value="gallery">
            <MemoryGallery memoryId={params.id} images={memory.images} />
          </TabsContent>
        </Tabs>
      </div>

      {isVisible && (
          <Button
              onClick={scrollToTop}
              className="fixed bottom-20 right-4 sm:bottom-4 h-12 w-12 rounded-full shadow-lg z-50"
              size="icon"
          >
              <ArrowUp className="h-6 w-6" />
          </Button>
      )}
    </>
  );
} 