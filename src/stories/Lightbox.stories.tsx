import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';
import Lightbox from '@/components/ui/Lightbox';
import { Button } from '@/components/ui/button';

const slides = [
    { src: 'https://picsum.photos/id/1018/1920/1080', title: 'Mountain Landscape', description: 'A beautiful view of mountains and a lake.' },
    { src: 'https://picsum.photos/id/1015/1920/1080', title: 'River and Forest', description: 'A winding river through a lush green forest.' },
    { src: 'https://picsum.photos/id/1025/1920/1080', title: 'Pug', description: 'A cute pug dog sitting on the ground.' },
    { src: 'https://picsum.photos/id/1040/1920/1080', title: 'Castle', description: 'An old castle on a hill overlooking the sea.' },
    { src: 'https://picsum.photos/id/1050/1920/1080', title: 'City at Night', description: 'A vibrant cityscape illuminated at night.' },
    { src: 'https://picsum.photos/id/106/1920/1080', title: 'Winter Forest', description: 'A snow-covered forest path.' },
];

const meta: Meta<typeof Lightbox> = {
    title: 'UI/Lightbox',
    component: Lightbox,
    tags: ['autodocs'],
    parameters: {
        layout: 'centered',
    },
    render: (args) => {
        const [index, setIndex] = useState(-1);

        return (
            <div className="p-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                    {slides.map((slide, i) => (
                        <img
                            key={slide.src}
                            src={slide.src.replace('/1920/1080', '/400/300')}
                            alt={slide.title}
                            className="cursor-pointer rounded-lg object-cover w-full h-32 hover:opacity-80 transition-opacity"
                            onClick={() => setIndex(i)}
                        />
                    ))}
                </div>
                <Button onClick={() => setIndex(0)}>Open Lightbox</Button>
                <Lightbox
                    {...args}
                    slides={slides}
                    open={index >= 0}
                    index={index}
                    close={() => setIndex(-1)}
                />
            </div>
        );
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {}; 