import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';
import { PhotoPicker } from '@/components/ui/PhotoPicker';
import { toast } from 'sonner';

const mockPhotos = Array.from({ length: 15 }, (_, i) => ({
  id: `${i + 1}`,
  src: `https://picsum.photos/id/${10 + i}/300/300`,
  alt: `A random photo with ID ${10 + i}`,
}));

const meta: Meta<typeof PhotoPicker> = {
  title: 'UI/PhotoPicker',
  component: PhotoPicker,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  render: (args) => {
    const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

    const handleSelect = (photo: { id: string; src: string; alt: string } | File) => {
        if (photo instanceof File) {
            toast.success(`New file selected: ${photo.name}`);
            setSelectedPhoto(URL.createObjectURL(photo));
        } else {
            toast.success(`Existing photo selected: ${photo.alt}`);
            setSelectedPhoto(photo.src);
        }
    }

    return (
      <div className="flex flex-col items-center gap-4">
        <PhotoPicker {...args} onSelect={handleSelect} />
        {selectedPhoto && (
            <div className='mt-4 text-center'>
                <p className='font-semibold mb-2'>Selected Photo:</p>
                <img src={selectedPhoto} alt="Selected" className="w-40 h-40 rounded-lg object-cover border-2 border-primary" />
            </div>
        )}
      </div>
    );
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    existingPhotos: mockPhotos,
  },
}; 