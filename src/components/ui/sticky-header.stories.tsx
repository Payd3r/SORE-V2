import type { Meta, StoryObj } from "@storybook/react";
import { StickyHeader } from "@/components/ui/sticky-header";

const meta: Meta<typeof StickyHeader> = {
  title: "UI/StickyHeader",
  component: StickyHeader,
  parameters: {
    layout: "fullscreen",
    backgrounds: {
        default: 'dark',
        values: [
            { name: 'dark', value: '#1a1a1a' },
            { name: 'light', value: '#ffffff' },
        ]
      },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    render: () => (
        <div className="h-[200vh] text-white">
            <StickyHeader>
                <h1 className="text-xl font-bold">Sticky Header</h1>
            </StickyHeader>
            <div className="p-4">
                <p>Scroll down to see the header stick to the top.</p>
                <p className="mt-[100vh]">More content further down.</p>
            </div>
        </div>
    )
};

export const WithCustomContent: Story = {
    render: () => (
        <div className="h-[200vh] text-white">
            <StickyHeader className="flex justify-between items-center">
                <h1 className="text-lg font-semibold">My App</h1>
                <div className="flex items-center space-x-4">
                    <a href="#" className="hover:underline">Home</a>
                    <a href="#" className="hover:underline">About</a>
                    <a href="#" className="hover:underline">Contact</a>
                </div>
            </StickyHeader>
            <div className="p-4">
                <p>Scroll down to see the header stick to the top.</p>
            </div>
        </div>
    )
}; 