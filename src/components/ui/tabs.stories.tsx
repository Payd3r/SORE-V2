import type { Meta, StoryObj } from "@storybook/react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const meta: Meta<typeof Tabs> = {
  title: "UI/Tabs",
  component: Tabs,
  parameters: {
    layout: "centered",
    backgrounds: {
      default: "dark",
      values: [
        { name: "dark", value: "#1a1a1a" },
        { name: "light", value: "#ffffff" },
      ],
    },
  },
  tags: ["autodocs"],
  argTypes: {
    defaultValue: {
      control: "text",
      description: "The value of the tab that should be active by default.",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <Tabs {...args} className="w-[400px] text-white">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="password">Password</TabsTrigger>
      </TabsList>
      <TabsContent value="account">
        <Card className="bg-transparent border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Account</CardTitle>
            <CardDescription className="text-white/70">
              Make changes to your account here. Click save when you're done.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="space-y-1">
              <Label htmlFor="name" className="text-white">Name</Label>
              <Input id="name" defaultValue="Pedro Duarte" className="text-white" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="username" className="text-white">Username</Label>
              <Input id="username" defaultValue="@peduarte" className="text-white" />
            </div>
          </CardContent>
          <CardFooter>
            <Button>Save changes</Button>
          </CardFooter>
        </Card>
      </TabsContent>
      <TabsContent value="password">
        <Card className="bg-transparent border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Password</CardTitle>
            <CardDescription className="text-white/70">
              Change your password here. After saving, you'll be logged out.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="space-y-1">
              <Label htmlFor="current" className="text-white">Current password</Label>
              <Input id="current" type="password" className="text-white" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="new" className="text-white">New password</Label>
              <Input id="new" type="password" className="text-white" />
            </div>
          </CardContent>
          <CardFooter>
            <Button>Save password</Button>
          </CardFooter>
        </Card>
      </TabsContent>
    </Tabs>
  ),
  args: {
    defaultValue: "account",
  },
}; 