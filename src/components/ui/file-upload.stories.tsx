import type { Meta, StoryObj } from "@storybook/react";
import { FileUpload } from "./file-upload";
import { useState } from "react";

const meta: Meta<typeof FileUpload> = {
  title: "UI/FileUpload",
  component: FileUpload,
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
type Story = StoryObj<typeof FileUpload>;

const FileUploadWithState = (args: any) => {
    const [files, setFiles] = useState<File[]>([]);
    const handleFilesAccepted = (acceptedFiles: File[]) => {
      setFiles(acceptedFiles);
      console.log('Accepted files:', acceptedFiles);
    };
  
    return <FileUpload {...args} onFilesAccepted={handleFilesAccepted} />;
};

export const Default: Story = {
  render: (args) => <FileUploadWithState {...args} />,
  args: {
    accept: {
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
    },
  },
};

export const Multiple: Story = {
    render: (args) => <FileUploadWithState {...args} />,
    args: {
      multiple: true,
      accept: {
        'image/*': [],
        'video/*': [],
      },
    },
};

export const DragActive: Story = {
    render: (args) => <FileUploadWithState {...args} />,
    args: {
        ...Multiple.args,
    },
    parameters: {
        pseudo: {
            drag: true
        }
    }
}; 