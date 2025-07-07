import type { Meta, StoryObj } from "@storybook/react";
import { EmptyState } from "@/components/ui/empty-state";
import { Inbox, PlusCircle } from "lucide-react";
import { action } from "@storybook/addon-actions";

const meta: Meta<typeof EmptyState> = {
  title: "UI/EmptyState",
  component: EmptyState,
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
    icon: {
      control: false, // Icons are passed as components
      description: "The icon component to display.",
    },
    title: {
      control: "text",
      description: "The main title text.",
    },
    description: {
        control: "text",
        description: "The descriptive text.",
      },
    action: {
        control: "object",
        description: "An action object with text, onClick handler, and button props.",
      },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    icon: Inbox,
    title: "No Messages",
    description: "You have no new messages. Start a conversation to see it here.",
  },
};

export const WithAction: Story = {
    args: {
      icon: PlusCircle,
      title: "Create Your First Memory",
      description: "Get started by creating a new memory. It's quick and easy!",
      action: {
        text: "Create Memory",
        onClick: action("create-memory-clicked"),
        buttonProps: {
            variant: "default",
        }
      },
    },
  };

export const Minimal: Story = {
    args: {
      title: "Nothing to see here",
      description: "This space is currently empty.",
    },
  }; 