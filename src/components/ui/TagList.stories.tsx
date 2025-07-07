import type { Meta, StoryObj } from "@storybook/react";
import { TagList } from "@/components/ui/tag-list";

const meta: Meta<typeof TagList> = {
  title: "UI/TagList",
  component: TagList,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    tags: {
      control: "object",
      description: "An array of strings to be displayed as tags.",
    },
    className: {
      control: "text",
      description: "Custom CSS class for the container.",
    },
    badgeClassName: {
        control: "text",
        description: "Custom CSS class for the badge.",
    }
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    tags: ["Nature", "Travel", "Photography", "Adventure", "Mountains"],
  },
};

export const WithCustomStyling: Story = {
    args: {
      tags: ["React", "TypeScript", "Storybook"],
      className: "p-4 bg-gray-800 rounded-lg",
      badgeClassName: "bg-blue-500/20 border-blue-500/30 text-blue-300"
    },
  };

export const Empty: Story = {
  args: {
    tags: [],
  },
};

export const SingleTag: Story = {
    args: {
      tags: ["Urgent"],
    },
  }; 