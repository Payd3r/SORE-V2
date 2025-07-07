import type { Meta, StoryObj } from "@storybook/react";
import BottomTabBar from "./BottomTabBar";

const meta: Meta<typeof BottomTabBar> = {
  title: "Layout/BottomTabBar",
  component: BottomTabBar,
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
type Story = StoryObj<typeof BottomTabBar>;

export const Default: Story = {
    parameters: {
        nextjs: {
          navigation: {
            pathname: '/',
          },
        },
        viewport: {
            defaultViewport: 'mobile1'
        }
      },
};

export const TimelineActive: Story = {
    parameters: {
        nextjs: {
          navigation: {
            pathname: '/timeline',
          },
        },
        viewport: {
            defaultViewport: 'mobile1'
        }
      },
}; 