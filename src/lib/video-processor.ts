import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';
import ffprobe from 'ffprobe';
import ffprobeStatic from 'ffprobe-static';
import { saveFile, saveDirectory, getPublicUrl } from './storage';
import { sendProgress } from './websocket-emitter';

const execFileAsync = promisify(execFile);

// Custom interfaces to avoid issues with @types/ffprobe
interface FfprobeStream {
  codec_type?: 'video' | 'audio';
  codec_name?: string;
  codec_tag_string?: string;
  width?: number;
  height?: number;
  avg_frame_rate?: string;
  r_frame_rate?: string;
  time_base?: string;
  duration?: string;
  [key: string]: any;
}

interface FfprobeData {
  streams: FfprobeStream[];
  format: {
    format_name?: string;
    duration?: string;
    size?: string;
    tags?: {
      [key: string]: string;
    };
    [key: string]: any;
  };
}

export interface ProcessedVideo {
  original: {
    path: string;
    filename: string;
    size: number;
    duration: number;
    width: number;
    height: number;
    format: string;
    video_codec: string;
    audio_codec: string;
  };
  formats: {
    [format: string]: {
      path: string;
      filename: string;
      size: number;
    }
  },
  thumbnails: {
    [key: string]: {
      path: string;
      filename: string;
    };
  };
  hls?: {
    path: string;
    filename: string;
  };
  isSlowMotion: boolean;
  isTimeLapse: boolean;
  isLivePhoto: boolean;
}

async function getProbeData(videoPath: string): Promise<FfprobeData> {
  try {
    const probeData = await ffprobe(videoPath, { path: ffprobeStatic.path });
    return probeData as FfprobeData;
  } catch (error) {
    console.error('Error getting probe data:', error);
    throw new Error(`Failed to probe video file: ${videoPath}`);
  }
}

export async function processVideo(sourcePath: string, originalFilename: string, clientId: string, fileId: string): Promise<ProcessedVideo> {
  const probeData = await getProbeData(sourcePath);
  
  const videoStream = probeData.streams.find((s: FfprobeStream) => s.codec_type === 'video');
  const audioStream = probeData.streams.find((s: FfprobeStream) => s.codec_type === 'audio');

  if (!videoStream) {
    throw new Error('No video stream found in the input file.');
  }

  // Save the original file
  const originalBuffer = await fs.readFile(sourcePath);
  const originalStoragePath = await saveFile(`videos/originals/${originalFilename}`, originalBuffer, videoStream.codec_tag_string || 'bin');

  const frameRateString = videoStream.r_frame_rate || videoStream.avg_frame_rate || "0/0";
  const [num, den] = frameRateString.split('/').map(Number);
  const frameRate = den > 0 ? num / den : 0;
  
  // More reliable detection for slow-motion and time-lapse
  const isSlowMotion = detectSlowMotion(probeData, frameRate);
  const isTimeLapse = detectTimeLapse(probeData);
  const isLivePhoto = detectLivePhoto(probeData);

  const baseName = path.basename(originalFilename, path.extname(originalFilename));

  // Create a temporary directory for all processing
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sore-video-'));
  
  try {
    const duration = videoStream.duration ? parseFloat(videoStream.duration) : 0;

    // Generate HLS Stream
    const hlsPlaylistPath = await createHlsStream(sourcePath, tempDir, baseName, clientId, fileId, duration > 10);

    // Generate Thumbnails
    const thumbnails = await generateThumbnails(sourcePath, tempDir, baseName, clientId, fileId, duration);

    // At this point, you might want to save paths to DB or return them.
    // For this example, we'll just log and clean up.
    console.log('HLS Playlist:', hlsPlaylistPath);
    console.log('Thumbnails:', thumbnails);

    const processedData: ProcessedVideo = {
        original: {
            path: originalStoragePath,
            filename: originalFilename,
            size: probeData.format.size ? Number(probeData.format.size) : 0,
            duration: duration,
            width: videoStream.width || 0,
            height: videoStream.height || 0,
            format: probeData.format.format_name || 'unknown',
            video_codec: videoStream.codec_name || 'unknown',
            audio_codec: audioStream ? audioStream.codec_name : 'none',
        },
        formats: {}, // MP4/WebM generation removed for focus on HLS
        thumbnails: thumbnails,
        hls: hlsPlaylistPath ? {
            path: hlsPlaylistPath,
            filename: 'master.m3u8'
        } : undefined,
        isSlowMotion,
        isTimeLapse,
        isLivePhoto,
    };
    
    return processedData;

  } finally {
    // Cleanup the temporary directory
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

function detectSlowMotion(probeData: FfprobeData, frameRate: number): boolean {
  // Heuristic: High frame rate is a strong indicator.
  if (frameRate > 100) {
    return true;
  }
  
  // Check for specific metadata from Apple devices
  if (probeData.format.tags?.['com.apple.quicktime.camera.fps']) {
      const appleFps = parseFloat(probeData.format.tags['com.apple.quicktime.camera.fps']);
      if (appleFps > 100) return true;
  }

  return false;
}

function detectTimeLapse(probeData: FfprobeData): boolean {
    // Check for specific Apple metadata tag for time-lapse
    if (probeData.format.tags?.['com.apple.quicktime.capture.mode'] === 'Time-lapse') {
        return true;
    }
    // Heuristic for other devices: check timebase. Time-lapse often has a very high timebase.
    const videoStream = probeData.streams.find(s => s.codec_type === 'video');
    if (videoStream && typeof videoStream.time_base === 'string') {
        const [num, den] = videoStream.time_base.split('/').map(Number);
        if (den && den > 30000) { // e.g., 1/90000 is common for time-lapses
            return true;
        }
    }
    return false;
}

function detectLivePhoto(probeData: FfprobeData): boolean {
    // Live Photos have a content identifier that pairs the photo and video.
    return !!probeData.format.tags?.['com.apple.quicktime.content.identifier'];
}

async function createHlsStream(sourcePath: string, tempDir: string, baseName: string, clientId: string, fileId: string, generate: boolean): Promise<string | undefined> {
  if (!generate) {
    return undefined;
  }
  
  await sendProgress(clientId, {
    type: 'processing_progress',
    fileId,
    filename: baseName,
    progress: 50,
    status: 'processing',
    message: 'Generating HLS stream...',
  });
  
  const hlsDir = path.join(tempDir, 'hls');
  await fs.mkdir(hlsDir, { recursive: true });

  // Improved, more readable FFMPEG command for HLS
  const resolutions = [
    { name: '1080p', scale: '1920:1080', vb: '5000k', maxr: '5350k', bufs: '7500k', ab: '192k' },
    { name: '720p',  scale: '1280:720', vb: '2800k', maxr: '2996k', bufs: '4200k', ab: '128k' },
    { name: '480p',  scale: '854:480',  vb: '1400k', maxr: '1498k', bufs: '2100k', ab: '128k' },
    { name: '360p',  scale: '640:360',  vb: '800k',  maxr: '856k',  bufs: '1200k', ab: '96k' },
  ];
  
  const filterComplex: string[] = ["[0:v]split=4"];
  const streamMap: string[] = [];
  const hlsCommands: any[] = [];
  
  resolutions.forEach((res, i) => {
    filterComplex.push(`[v${i+1}]`);
    streamMap.push(`v:${i},a:${i}`);
  });
  
  filterComplex.push(';');
  resolutions.forEach((res, i) => {
    filterComplex.push(`[v${i+1}]scale=w=${res.scale.split(':')[0]}:h=${res.scale.split(':')[1]}[v${i+1}out];`);
  });
  
  resolutions.forEach((res, i) => {
    hlsCommands.push(
      '-map', `[v${i+1}out]`, `-c:v:${i}`, 'libx264', `-b:v:${i}`, res.vb, `-maxrate:v:${i}`, res.maxr, `-bufsize:v:${i}`, res.bufs,
      '-map', `a:0`, `-c:a:${i}`, 'aac', `-b:a:${i}`, res.ab
    );
  });

  const command = [
    '-i', sourcePath,
    '-filter_complex', filterComplex.join('').slice(0, -1), // remove trailing semicolon
    ...hlsCommands.flat(),
    '-f', 'hls',
    '-hls_time', '4',
    '-hls_playlist_type', 'vod',
    '-hls_flags', 'independent_segments',
    '-master_pl_name', 'master.m3u8',
    '-hls_segment_filename', `${hlsDir}/stream_%v/data%03d.ts`,
    '-var_stream_map', streamMap.join(' '),
    `${hlsDir}/stream_%v.m3u8`
  ];

  await execFileAsync('ffmpeg', command);

  const hlsStoragePath = `videos/hls/${baseName}`;
  await saveDirectory(hlsDir, hlsStoragePath);
  
  return getPublicUrl(`${hlsStoragePath}/master.m3u8`);
}

async function generateThumbnails(sourcePath: string, tempDir: string, baseName: string, clientId: string, fileId: string, duration: number): Promise<{[key: string]: {path: string, filename: string}}> {
 await sendProgress(clientId, {
    type: 'processing_progress',
    fileId,
    filename: baseName,
    progress: 90,
    status: 'processing',
    message: 'Generating thumbnails...',
  });

  const midpoint = duration / 2;
  
  const thumbnailSizes = {
    'large': '1280',
    'medium': '720',
    'small': '320'
  };

  const generatedThumbnails: {[key:string]: {path: string, filename: string}} = {};
  const tempThumbPaths: string[] = [];

  const filterComplex = Object.values(thumbnailSizes).map((size, i) => `[0:v]scale=${size}:-1[t${i}]`).join(';');
  
  const ffmpegArgs = [
    '-i', sourcePath,
    '-ss', midpoint.toString(),
    '-vf', filterComplex,
    '-vframes', '1',
  ];

  for(const name in thumbnailSizes){
    const thumbPath = path.join(tempDir, `${baseName}-thumb-${name}.jpg`);
    tempThumbPaths.push(thumbPath);
    ffmpegArgs.push('-map', `[t${Object.keys(thumbnailSizes).indexOf(name)}]`, thumbPath);
  }

  await execFileAsync('ffmpeg', ffmpegArgs);

  for (const name of Object.keys(thumbnailSizes)) {
    const thumbPath = path.join(tempDir, `${baseName}-thumb-${name}.jpg`);
    const thumbBuffer = await fs.readFile(thumbPath);
    const storagePath = await saveFile(`videos/thumbnails/${baseName}-thumb-${name}.jpg`, thumbBuffer, 'image/jpeg');
    generatedThumbnails[name] = { path: storagePath, filename: `${baseName}-thumb-${name}.jpg` };
  }
  
  return generatedThumbnails;
}

export function isVideoFile(mimetype: string): boolean {
  return mimetype.startsWith('video/');
} 