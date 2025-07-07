import type { Meta, StoryObj } from '@storybook/react';
import {
  AreaChart,
  BarChart,
  CartesianGrid,
  Legend,
  PieChart,
  XAxis,
  YAxis,
} from 'recharts';

import {
  ChartArea,
  ChartBar,
  ChartContainer,
  ChartPie,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

const chartData = [
  { month: 'January', desktop: 186, mobile: 80 },
  { month: 'February', desktop: 305, mobile: 200 },
  { month: 'March', desktop: 237, mobile: 120 },
  { month: 'April', desktop: 73, mobile: 190 },
  { month: 'May', desktop: 209, mobile: 130 },
  { month: 'June', desktop: 214, mobile: 140 },
];

const pieChartData = [
  { browser: 'chrome', visitors: 275, fill: 'var(--color-chrome)' },
  { browser: 'safari', visitors: 200, fill: 'var(--color-safari)' },
  { browser: 'firefox', visitors: 187, fill: 'var(--color-firefox)' },
  { browser: 'edge', visitors: 173, fill: 'var(--color-edge)' },
  { browser: 'other', visitors: 90, fill: 'var(--color-other)' },
];

const meta: Meta = {
  title: 'UI/Charts',
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-2xl p-4 bg-background rounded-lg">
        <style>{`
          :root {
            --color-chrome: #4285F4;
            --color-safari: #5A9CF8;
            --color-firefox: #FF7139;
            --color-edge: #0078D7;
            --color-other: #999999;
          }
        `}</style>
        <Story />
      </div>
    ),
  ],
};

export default meta;

export const Area: StoryObj = {
  render: () => (
    <ChartContainer config={{}} className="min-h-[200px] w-full">
      <AreaChart data={chartData}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartArea
          dataKey="desktop"
          type="natural"
          fill="rgba(56, 189, 248, 0.4)"
          stroke="rgba(56, 189, 248, 1)"
          stackId="a"
        />
         <ChartArea
          dataKey="mobile"
          type="natural"
          fill="rgba(16, 185, 129, 0.4)"
          stroke="rgba(16, 185, 129, 1)"
          stackId="a"
        />
      </AreaChart>
    </ChartContainer>
  ),
};

export const Bar: StoryObj = {
  render: () => (
    <ChartContainer config={{}} className="min-h-[200px] w-full">
      <BarChart data={chartData}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Legend />
        <ChartBar dataKey="desktop" fill="rgba(56, 189, 248, 0.7)" radius={4} />
        <ChartBar dataKey="mobile" fill="rgba(16, 185, 129, 0.7)" radius={4} />
      </BarChart>
    </ChartContainer>
  ),
};

export const Pie: StoryObj = {
  render: () => (
    <ChartContainer config={{}} className="mx-auto aspect-square max-h-[250px]">
      <PieChart>
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartPie
          data={pieChartData}
          dataKey="visitors"
          nameKey="browser"
          innerRadius={60}
          strokeWidth={5}
        />
      </PieChart>
    </ChartContainer>
  ),
}; 