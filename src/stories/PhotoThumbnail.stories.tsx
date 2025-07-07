import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { PhotoThumbnail } from '@/components/ui/PhotoThumbnail';
import { action } from '@storybook/test';

const meta: Meta<typeof PhotoThumbnail> = {
  title: 'UI/PhotoThumbnail',
  component: PhotoThumbnail,
  tags: ['autodocs'],
  argTypes: {
    src: { control: 'text' },
    alt: { control: 'text' },
    isSelected: { control: 'boolean' },
    isSelectable: { control: 'boolean' },
  },
  args: {
    src: 'https://picsum.photos/id/237/200/200',
    alt: 'A cute dog',
    onSelect: action('onSelect'),
    onDeselect: action('onDeselect'),
    onRemove: action('onRemove'),
  },
  decorators: [
    (Story) => (
      <div className="w-40 h-40">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    isSelectable: false,
  },
};

export const Selectable: Story = {
  render: (args) => {
    const [isSelected, setIsSelected] = useState(false);
    return (
      <PhotoThumbnail
        {...args}
        isSelected={isSelected}
        onSelect={() => setIsSelected(true)}
        onDeselect={() => setIsSelected(false)}
      />
    );
  },
};


export const WithRemoveAction: Story = {
    args: {
        isSelectable: false,
    },
    render: (args) => (
        <PhotoThumbnail {...args} onRemove={action('remove clicked')} />
    )
};

export const WithChildren: Story = {
    args: {
        isSelectable: false,
    },
    render: (args) => (
        <PhotoThumbnail {...args}>
            <p className="text-white text-xs font-bold truncate">A Beautiful Landscape</p>
        </PhotoThumbnail>
    )
}; 