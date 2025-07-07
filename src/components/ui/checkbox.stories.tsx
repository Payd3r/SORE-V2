import type { Meta, StoryObj } from "@storybook/react";
import { Checkbox } from "./checkbox";

const meta: Meta<typeof Checkbox> = {
  title: "UI/Checkbox",
  component: Checkbox,
  tags: ["autodocs"],
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#1a1a1a' },
        { name: 'light', value: '#f0f0f0' },
      ],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Checkbox>;

export const Default: Story = {
    args: {}
};

export const WithLabel: Story = {
  render: (args) => (
    <div className="flex items-center space-x-2">
      <Checkbox id="terms" {...args} />
      <label
        htmlFor="terms"
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-white"
      >
        Accept terms and conditions
      </label>
    </div>
  ),
};

export const Disabled: Story = {
    render: (args) => (
      <div className="flex items-center space-x-2">
        <Checkbox id="terms-disabled" {...args} />
        <label
          htmlFor="terms-disabled"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-white"
        >
          Accept terms and conditions
        </label>
      </div>
    ),
    args: {
        disabled: true
    }
  };
  
export const DisabledChecked: Story = {
    render: (args) => (
        <div className="flex items-center space-x-2">
        <Checkbox id="terms-disabled-checked" {...args} />
        <label
            htmlFor="terms-disabled-checked"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-white"
        >
            Accept terms and conditions
        </label>
        </div>
    ),
    args: {
        disabled: true,
        checked: true
    }
}; 