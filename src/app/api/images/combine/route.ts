import { NextResponse } from 'next/server';
import { combineImages } from '@/lib/image-processing';
import { z } from 'zod';

const combineSchema = z.object({
  imagePath1: z.string().min(1, 'Path for image 1 is required'),
  imagePath2: z.string().min(1, 'Path for image 2 is required'),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validatedData = combineSchema.parse(body);

    const { imagePath1, imagePath2 } = validatedData;

    // Nota: per questo test, ci aspettiamo percorsi relativi alla directory `public`
    // es. /uploads/image1.jpg
    const combinedPath = await combineImages(imagePath1, imagePath2);

    return NextResponse.json({
      success: true,
      combinedImagePath: combinedPath,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify({ error: 'Invalid input', details: error.issues }), { status: 400 });
    }
    console.error('API Error combining images:', error);
    return new NextResponse(JSON.stringify({ error: 'Failed to combine images' }), { status: 500 });
  }
} 