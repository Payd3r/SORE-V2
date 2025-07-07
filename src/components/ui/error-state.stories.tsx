import type { Meta, StoryObj } from "@storybook/react";
import { ErrorState } from "@/components/ui/error-state";
import { WifiOff, ServerCrash } from "lucide-react";
import { action } from "@storybook/addon-actions";

const meta: Meta<typeof ErrorState> = {
  title: "UI/ErrorState",
  component: ErrorState,
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
      description: "The icon component to display. Defaults to AlertTriangle.",
    },
    title: {
      control: "text",
      description: "The main title text. Defaults to 'An Error Occurred'.",
    },
    message: {
        control: "text",
        description: "The descriptive error message.",
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
    message: "Something went wrong. Please try again later.",
  },
};

export const WithAction: Story = {
    args: {
        title: "Connection Failed",
        message: "Could not connect to the server. Please check your internet connection.",
        icon: WifiOff,
        action: {
            text: "Retry",
            onClick: action("retry-clicked"),
        }
    },
  };

export const CustomError: Story = {
    args: {
      icon: ServerCrash,
      title: "500 - Internal Server Error",
      message: "Our servers are currently experiencing issues. We are working on it!",
    },
  }; 