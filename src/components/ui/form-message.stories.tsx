import type { Meta, StoryObj } from "@storybook/react";
import { FormMessage } from "./form-message";

const meta: Meta<typeof FormMessage> = {
  title: "UI/FormMessage",
  component: FormMessage,
  tags: ["autodocs"],
  argTypes: {
    children: { control: "text" },
    variant: {
      control: { type: "select" },
      options: ["error", "success", "warning"],
    },
  },
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
type Story = StoryObj<typeof FormMessage>;

export const Error: Story = {
  args: {
    variant: "error",
    children: "Your password must be at least 8 characters.",
  },
};

export const Success: Story = {
    args: {
      variant: "success",
      children: "Your profile has been updated successfully.",
    },
};

export const Warning: Story = {
    args: {
      variant: "warning",
      children: "Your session is about to expire.",
    },
}; 