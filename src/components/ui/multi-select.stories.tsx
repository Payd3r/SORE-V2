import type { Meta, StoryObj } from "@storybook/react";
import { MultiSelect } from "./multi-select";
import { useState } from "react";
import { Globe, Mail, Phone } from "lucide-react";

const meta: Meta<typeof MultiSelect> = {
  title: "UI/MultiSelect",
  component: MultiSelect,
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
type Story = StoryObj<typeof MultiSelect>;

const options = [
    { label: "Website", value: "website", icon: Globe },
    { label: "Email", value: "email", icon: Mail },
    { label: "Phone", value: "phone", icon: Phone },
];

const MultiSelectWithState = (args: any) => {
    const [selected, setSelected] = useState<string[]>([]);
    
    return (
        <MultiSelect
            {...args}
            options={options}
            onValueChange={setSelected}
            defaultValue={selected}
        />
    );
}

export const Default: Story = {
  render: (args) => <MultiSelectWithState {...args} />,
  args: {
    placeholder: "Select contact methods...",
  },
};

export const WithDefaultValues: Story = {
    render: (args) => <MultiSelectWithState {...args} />,
    args: {
      ...Default.args,
      defaultValue: ["website", "email"],
    },
};

export const Destructive: Story = {
    render: (args) => <MultiSelectWithState {...args} />,
    args: {
      ...Default.args,
      variant: "destructive",
      defaultValue: ["phone"],
    },
}; 