export interface FileGroup {
    fileBuffer: Buffer;
    fileType: string;
    originalFilename: string;
    clientId: string;
}

export interface ProcessedFile {
    success: boolean;
    processed: boolean;
    id?: string;
    url?: string;
    reason?: string;
    originalFilename: string;
} 