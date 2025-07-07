import type { Meta, StoryObj } from "@storybook/react";
import Header from "./Header";

const meta: Meta<typeof Header> = {
  title: "Layout/Header",
  component: Header,
  tags: ["autodocs"],
  parameters: {
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/',
        query: {
            
        },
        asPath: '/',
      },
    },
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof Header>;

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