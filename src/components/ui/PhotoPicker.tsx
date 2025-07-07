'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileUpload } from './file-upload';
import OptimizedImage from '@/components/utils/OptimizedImage';

interface Photo {
  id: string;
  src: string;
  alt: string;
}

interface PhotoPickerProps {
  existingPhotos: Photo[];
  onSelect: (photo: Photo | File) => void;
  trigger?: React.ReactNode;
}

export function PhotoPicker({ existingPhotos, onSelect, trigger }: PhotoPickerProps) {
  const [open, setOpen] = useState(false);

  const handleSelectPhoto = (photo: Photo) => {
    onSelect(photo);
    setOpen(false);
  };

  const handleFileUpload = (files: File[]) => {
    if (files.length > 0) {
      onSelect(files[0]);
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button variant="outline">Choose Photo</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Choose a Photo</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <h3 className="font-semibold">Upload New Photo</h3>
          <FileUpload onFilesSelected={handleFileUpload} />

          <hr className="my-4" />

          <h3 className="font-semibold">Or Choose Existing</h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 max-h-[40vh] overflow-y-auto">
            {existingPhotos.map((photo) => (
              <div
                key={photo.id}
                className="cursor-pointer aspect-square relative group"
                onClick={() => handleSelectPhoto(photo)}
              >
                <OptimizedImage
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  className="rounded-md object-cover"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-md">
                  <span className="text-white text-sm">Select</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 