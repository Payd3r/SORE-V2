import type { Meta, StoryObj } from "@storybook/react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const meta: Meta<typeof Accordion> = {
  title: "UI/Accordion",
  component: Accordion,
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
    type: {
      control: "select",
      options: ["single", "multiple"],
      description: "Determines whether one or multiple items can be open at the same time.",
    },
    collapsible: {
      control: "boolean",
      description: "When type is 'single', allows closing the currently open item.",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const AccordionContentText = "Yes. It adheres to the WAI-ARIA design pattern."

const renderAccordion = (args: any) => (
    <Accordion type="single" collapsible className="w-full max-w-md text-white" {...args}>
      <AccordionItem value="item-1">
        <AccordionTrigger>Is it accessible?</AccordionTrigger>
        <AccordionContent>{AccordionContentText}</AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Is it styled?</AccordionTrigger>
        <AccordionContent>{AccordionContentText}</AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>Is it animated?</AccordionTrigger>
        <AccordionContent>{AccordionContentText}</AccordionContent>
      </AccordionItem>
    </Accordion>
  );


export const Default: Story = {
    render: renderAccordion,
    args: {
        type: "single",
        collapsible: true,
    }
};

export const Multiple: Story = {
    render: renderAccordion,
    args: {
        type: "multiple",
    }
};

export const NonCollapsible: Story = {
    render: renderAccordion,
    args: {
        type: "single",
        collapsible: false,
        defaultValue: "item-1"
    }
}; 