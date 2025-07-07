"use client"

import React, { useCallback } from 'react';
import { useDropzone, FileRejection, DropzoneOptions } from 'react-dropzone';
import { cn } from '@/lib/utils';
import { UploadCloud, File as FileIcon, X } from 'lucide-react';
import { toast } from 'sonner';

interface FileUploadProps extends DropzoneOptions {
  onFilesSelected: (files: File[]) => void;
  className?: string;
}

export function FileUpload({ onFilesSelected, className, ...props }: FileUploadProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      if (fileRejections.length > 0) {
        fileRejections.forEach(({ errors }) => {
          errors.forEach((error) => {
            toast.error(error.message);
          });
        });
        return;
      }
      onFilesSelected(acceptedFiles);
    },
    [onFilesSelected]
  );

  const { getRootProps, getInputProps, isDragActive, acceptedFiles } = useDropzone({
    onDrop,
    ...props,
  });

  return (
    <div className="grid gap-4">
      <div
        {...getRootProps()}
        className={cn(
          'group relative grid h-48 w-full cursor-pointer place-items-center rounded-lg border-2 border-dashed border-muted-foreground/25 px-5 py-2.5 text-center transition-all duration-300',
          'bg-background/80 backdrop-blur-sm',
          'dark:border-white/10 dark:bg-zinc-900/50',
          isDragActive ? 'border-primary dark:border-cyan-500' : '',
          className
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <UploadCloud className={cn("h-10 w-10", isDragActive ? "text-primary dark:text-cyan-400" : "")} />
            <p className="text-sm">
            <span className={cn("font-semibold", isDragActive ? "text-primary dark:text-cyan-400" : "")}>Click to upload</span> or drag and drop
            </p>
            {props.accept && (
                <p className="text-xs">
                    {Object.keys(props.accept).map(key => props.accept![key as keyof typeof props.accept]!.join(', ')).join(', ')}
                </p>
            )}
        </div>
      </div>
      {acceptedFiles.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-white mb-2">Accepted files:</h4>
          <ul className="space-y-2">
            {acceptedFiles.map(file => (
              <li key={file.name} className="flex items-center justify-between rounded-md bg-background/80 dark:bg-zinc-900/50 p-2">
                <div className="flex items-center gap-2">
                    <FileIcon className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm text-white">{file.name}</span>
                </div>
                {/* TODO: Add a remove button */}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
} 