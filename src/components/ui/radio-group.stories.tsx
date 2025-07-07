import type { Meta, StoryObj } from "@storybook/react";
import { RadioGroup, RadioGroupItem } from "./radio-group";

const meta: Meta<typeof RadioGroup> = {
  title: "UI/RadioGroup",
  component: RadioGroup,
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
type Story = StoryObj<typeof RadioGroup>;

export const Default: Story = {
  render: (args) => (
    <RadioGroup {...args} defaultValue="comfortable">
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="default" id="r1" />
        <label htmlFor="r1" className="text-white">Default</label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="comfortable" id="r2" />
        <label htmlFor="r2" className="text-white">Comfortable</label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="compact" id="r3" />
        <label htmlFor="r3" className-="text-white">Compact</label>
      </div>
    </RadioGroup>
  ),
};

export const Disabled: Story = {
    render: (args) => (
      <RadioGroup {...args} defaultValue="comfortable">
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="default" id="r1d" />
          <label htmlFor="r1d" className="text-white">Default</label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="comfortable" id="r2d" />
          <label htmlFor="r2d" className="text-white">Comfortable</label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="compact" id="r3d" />
          <label htmlFor="r3d" className="text-white">Compact</label>
        </div>
      </RadioGroup>
    ),
    args: {
        disabled: true
    }
  }; 