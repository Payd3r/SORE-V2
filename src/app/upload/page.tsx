'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { X, UploadCloud, File as FileIcon } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Toaster, toast } from "sonner";


export default function UploadPage() {
    const [files, setFiles] = useState<File[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const { data: session } = useSession();
    const router = useRouter();

    const onDrop = useCallback((acceptedFiles: File[]) => {
        setFiles(prevFiles => [...prevFiles, ...acceptedFiles]);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp', '.heic', '.heif'],
            'video/quicktime': ['.mov']
        },
    });

    const removeFile = (fileToRemove: File) => {
        setFiles(prevFiles => prevFiles.filter(file => file !== fileToRemove));
    };

    const handleUpload = async () => {
        if (files.length === 0 || !session) {
            toast.error("Please select files to upload and make sure you are logged in.");
            return;
        }

        setIsUploading(true);
        toast.info("Starting upload...");

        const formData = new FormData();
        files.forEach(file => {
            formData.append('files', file);
        });

        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();

            if (response.ok) {
                toast.success(result.message || "Files uploaded successfully!");
                setFiles([]);
                // Optionally, redirect or update UI
            } else {
                toast.error(result.error || "Upload failed.");
            }
        } catch (error) {
            toast.error("An unexpected error occurred during upload.");
            console.error("Upload error:", error);
        } finally {
            setIsUploading(false);
        }
    };
    
    if (!session) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <p className="text-lg mb-4">Please log in to upload files.</p>
                <Button onClick={() => router.push('/api/auth/signin')}>Login</Button>
            </div>
        )
    }

    return (
        <div className="container mx-auto p-4 md:p-8">
            <Toaster />
            <h1 className="text-3xl font-bold mb-6">Upload Files</h1>
            <div
                {...getRootProps()}
                className={`flex flex-col items-center justify-center p-10 border-2 border-dashed rounded-lg cursor-pointer transition-colors
                ${isDragActive ? 'border-indigo-600 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400'}`}
            >
                <input {...getInputProps()} />
                <UploadCloud className="w-12 h-12 text-gray-500 mb-4" />
                {isDragActive ? (
                    <p className="text-lg text-indigo-700">Drop the files here ...</p>
                ) : (
                    <p className="text-lg text-gray-600">Drag 'n' drop some files here, or click to select files</p>
                )}
                <p className="text-sm text-gray-500 mt-2">Supports images and Live Photos</p>
            </div>

            {files.length > 0 && (
                <div className="mt-8">
                    <h2 className="text-2xl font-semibold mb-4">Selected Files ({files.length})</h2>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {files.map((file, index) => (
                            <li key={index} className="flex items-center p-2 border rounded-lg bg-gray-50">
                                <FileIcon className="w-6 h-6 text-gray-500 mr-3 shrink-0" />
                                <span className="flex-grow text-sm truncate" title={file.name}>{file.name}</span>
                                <button
                                    onClick={() => removeFile(file)}
                                    className="ml-2 p-1 rounded-full hover:bg-gray-200"
                                    aria-label="Remove file"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </li>
                        ))}
                    </ul>
                    <div className="mt-6 flex justify-end">
                        <Button onClick={handleUpload} disabled={isUploading}>
                            {isUploading ? 'Uploading...' : `Upload ${files.length} File(s)`}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
} 