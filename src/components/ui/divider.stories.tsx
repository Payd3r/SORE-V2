import type { Meta, StoryObj } from "@storybook/react";
import { Divider } from "@/components/ui/divider";

const meta: Meta<typeof Divider> = {
  title: "UI/Divider",
  component: Divider,
  parameters: {
    layout: "centered",
    backgrounds: {
        default: 'dark',
        values: [
            { name: 'dark', value: '#1a1a1a' },
            { name: 'light', value: '#ffffff' },
        ]
      },
  },
  tags: ["autodocs"],
  argTypes: {
    orientation: {
      control: "select",
      options: ["horizontal", "vertical"],
      description: "The orientation of the divider.",
    },
    label: {
      control: "text",
      description: "An optional label to display in the middle of the divider.",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Horizontal: Story = {
  args: {
    orientation: "horizontal",
    className: "w-48"
  },
};

export const HorizontalWithLabel: Story = {
    args: {
      orientation: "horizontal",
      label: "Today",
      className: "w-48"
    },
  };

export const Vertical: Story = {
  render: (args) => (
    <div className="h-48">
      <Divider {...args} />
    </div>
  ),
  args: {
    orientation: "vertical",
  },
}; 