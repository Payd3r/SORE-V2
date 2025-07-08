import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import PDFDocument from 'pdfkit';
import blobStream from 'blob-stream';
import path from 'path';
import fs from 'fs';

// Helper function to generate the PDF
async function generateMemoryPdf(memory: any): Promise<Buffer> {
    const doc = new PDFDocument({ margin: 50 });
    const stream = doc.pipe(blobStream());

    // Titolo
    doc.fontSize(24).font('Helvetica-Bold').text(memory.title, { align: 'center' });
    doc.moveDown();

    // Data e Autore
    doc.fontSize(12).font('Helvetica').text(`Un ricordo di ${memory.author.name} del ${new Date(memory.date).toLocaleDateString()}`, { align: 'center' });
    doc.moveDown(2);

    // Descrizione
    if (memory.description) {
        doc.fontSize(14).font('Helvetica-Oblique').text(memory.description, { align: 'justify' });
        doc.moveDown(2);
    }
    
    // Immagini
    for (const image of memory.images) {
        try {
            const imagePath = path.join(process.cwd(), 'public', image.path);
            if (fs.existsSync(imagePath)) {
                doc.addPage().image(imagePath, {
                    fit: [doc.page.width - 100, doc.page.height - 100],
                    align: 'center',
                    valign: 'center'
                });
            }
        } catch (error) {
            console.error(`Impossibile caricare l'immagine: ${image.path}`, error);
        }
    }

    return new Promise((resolve, reject) => {
        const buffers: Buffer[] = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
            const pdfData = Buffer.concat(buffers);
            resolve(pdfData);
        });
        doc.on('error', reject);
        doc.end();
    });
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const memory = await prisma.memory.findUnique({
    where: { id: params.id, authorId: session.user.id },
    include: {
      images: true,
      author: { select: { name: true } },
    },
  });

  if (!memory) {
    return new NextResponse('Memory not found', { status: 404 });
  }

  try {
    const pdfBuffer = await generateMemoryPdf(memory);
    
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${memory.title.replace(/\s+/g, '_')}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Failed to generate PDF:', error);
    return new NextResponse('Failed to generate PDF', { status: 500 });
  }
} 