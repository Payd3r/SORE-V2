import type { Meta, StoryObj } from "@storybook/react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

const meta: Meta<typeof Carousel> = {
  title: "UI/Carousel",
  component: Carousel,
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
};

export default meta;
type Story = StoryObj<typeof meta>;

const renderCarousel = (args: any) => (
  <Carousel className="w-full max-w-xs" {...args}>
    <CarouselContent>
      {Array.from({ length: 5 }).map((_, index) => (
        <CarouselItem key={index}>
          <div className="p-1">
            <Card className="bg-white/10 border-white/20">
              <CardContent className="flex aspect-square items-center justify-center p-6">
                <span className="text-4xl font-semibold text-white">{index + 1}</span>
              </CardContent>
            </Card>
          </div>
        </CarouselItem>
      ))}
    </CarouselContent>
    <CarouselPrevious className="text-white bg-transparent border-white/30 hover:bg-white/20 hover:text-white" />
    <CarouselNext className="text-white bg-transparent border-white/30 hover:bg-white/20 hover:text-white" />
  </Carousel>
);

export const Default: Story = {
  render: renderCarousel,
};

export const AutoplayPlugin: Story = {
    render: (args) => (
      <Carousel
        className="w-full max-w-xs"
        plugins={[
          Autoplay({
            delay: 2000,
          }),
        ]}
        {...args}
      >
        <CarouselContent>
          {Array.from({ length: 5 }).map((_, index) => (
            <CarouselItem key={index}>
              <div className="p-1">
                <Card className="bg-white/10 border-white/20">
                  <CardContent className="flex aspect-square items-center justify-center p-6">
                    <span className="text-4xl font-semibold text-white">{index + 1}</span>
                  </CardContent>
                </Card>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="text-white bg-transparent border-white/30 hover:bg-white/20 hover:text-white" />
        <CarouselNext className="text-white bg-transparent border-white/30 hover:bg-white/20 hover:text-white" />
      </Carousel>
    ),
  };
  
  export const Vertical: Story = {
    render: (args) => (
      <Carousel className="w-full max-w-xs" orientation="vertical" {...args}>
        <CarouselContent className="h-[250px]">
          {Array.from({ length: 5 }).map((_, index) => (
            <CarouselItem key={index} className="pt-1">
              <div className="p-1">
                <Card className="bg-white/10 border-white/20">
                  <CardContent className="flex aspect-square items-center justify-center p-6">
                    <span className="text-4xl font-semibold text-white">{index + 1}</span>
                  </CardContent>
                </Card>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="text-white bg-transparent border-white/30 hover:bg-white/20 hover:text-white" />
        <CarouselNext className="text-white bg-transparent border-white/30 hover:bg-white/20 hover:text-white" />
      </Carousel>
    ),
  }; 