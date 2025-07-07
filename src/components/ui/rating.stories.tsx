import type { Meta, StoryObj } from "@storybook/react";
import { Rating } from "@/components/ui/rating";
import { action } from "@storybook/addon-actions";

const meta: Meta<typeof Rating> = {
  title: "UI/Rating",
  component: Rating,
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
    count: {
      control: "number",
      description: "The total number of stars.",
    },
    initialValue: {
      control: "number",
      description: "The initial selected rating.",
    },
    size: {
      control: "number",
      description: "The size of the star icons.",
    },
    readonly: {
      control: "boolean",
      description: "Makes the component read-only.",
    },
    onChange: {
      action: "changed",
      description: "Callback function when the rating changes.",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    count: 5,
    initialValue: 3,
    onChange: action("rating-changed"),
  },
};

export const TenStars: Story = {
  args: {
    count: 10,
    initialValue: 7,
    size: 32,
    onChange: action("rating-changed"),
  },
};

export const Readonly: Story = {
  args: {
    count: 5,
    initialValue: 4,
    readonly: true,
  },
};

export const NoInitialValue: Story = {
    args: {
      count: 5,
      initialValue: 0,
      onChange: action("rating-changed"),
    },
  };

export const WithCustomStyling: Story = {
    args: {
      count: 5,
      initialValue: 2,
      onChange: action("rating-changed"),
      className: "p-4 bg-gray-800 rounded-lg",
      iconClassName: "mx-1"
    },
  }; 