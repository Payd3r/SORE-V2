import type { Meta, StoryObj } from "@storybook/react";
import Sidebar from "./Sidebar";

const meta: Meta<typeof Sidebar> = {
  title: "Layout/Sidebar",
  component: Sidebar,
  tags: ["autodocs"],
  parameters: {
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/',
      },
    },
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof Sidebar>;

export const Default: Story = {
    parameters: {
        nextjs: {
          navigation: {
            pathname: '/',
          },
        },
      },
};

export const TimelineActive: Story = {
    parameters: {
        nextjs: {
          navigation: {
            pathname: '/timeline',
          },
        },
      },
}; 