import type { Meta, StoryObj } from "@storybook/react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const meta: Meta<typeof Switch> = {
  title: "UI/Switch",
  component: Switch,
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
    checked: {
      control: "boolean",
      description: "The controlled state of the switch.",
    },
    disabled: {
      control: "boolean",
      description: "Prevents the user from interacting with the switch.",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    checked: false,
    disabled: false,
  },
};

export const Checked: Story = {
    args: {
      checked: true,
      disabled: false,
    },
  };

export const Disabled: Story = {
  args: {
    checked: false,
    disabled: true,
  },
};

export const CheckedDisabled: Story = {
    args: {
      checked: true,
      disabled: true,
    },
  };

export const WithLabel: Story = {
    render: (args) => (
        <div className="flex items-center space-x-2">
          <Switch id="airplane-mode" {...args} />
          <Label htmlFor="airplane-mode" className="text-white">Airplane Mode</Label>
        </div>
      ),
    args: {
      checked: false,
      disabled: false,
    },
  }; 