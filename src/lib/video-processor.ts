import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';
import { saveFile } from './storage';
import { sendProgress } from './websocket-emitter';

const execFileAsync = promisify(execFile);

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
  }
}

async function getProbeData(videoPath: string) {
  const { stdout } = await execFileAsync('ffprobe', [
    '-v', 'error',
    '-show_format',
    '-show_streams',
    '-of', 'json',
    videoPath
  ]);
  return JSON.parse(stdout);
}

export async function processVideo(sourcePath: string, originalFilename: string, clientId: string, fileId: string): Promise<any> {
  const probeData = await getProbeData(sourcePath);
  
  const videoStream = probeData.streams.find((s: any) => s.codec_type === 'video');
  const audioStream = probeData.streams.find((s: any) => s.codec_type === 'audio');

  if (!videoStream) {
    throw new Error('No video stream found in the input file.');
  }

  const baseName = path.basename(originalFilename, path.extname(originalFilename));
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sore-video-'));
  
  const mp4Path = path.join(tempDir, `${baseName}.mp4`);
  const webmPath = path.join(tempDir, `${baseName}.webm`);
  const hlsPath = path.join(tempDir, 'hls');
  await fs.mkdir(hlsPath);
  
  const thumb1280Path = path.join(tempDir, `${baseName}-thumb-1280p.jpg`);
  const thumb720Path = path.join(tempDir, `${baseName}-thumb-720p.jpg`);
  const thumb320Path = path.join(tempDir, `${baseName}-thumb-320p.jpg`);

  const nullOutput = os.platform() === 'win32' ? 'NUL' : '/dev/null';

  await sendProgress(clientId, {
    type: 'processing_progress',
    fileId,
    filename: originalFilename,
    progress: 10,
    status: 'processing',
    message: 'Transcoding to MP4...',
  });

  // Transcode to MP4 (2-pass)
  await execFileAsync('ffmpeg', [
    '-i', sourcePath, '-y',
    '-c:v', 'libx264', '-preset', 'medium', '-b:v', '2000k', '-pass', '1', '-an', '-f', 'mp4', nullOutput
  ]);
  await execFileAsync('ffmpeg', [
    '-i', sourcePath,
    '-c:v', 'libx264', '-preset', 'medium', '-b:v', '2000k', '-pass', '2',
    '-c:a', 'aac', '-b:a', '128k',
    mp4Path
  ]);

  await sendProgress(clientId, {
    type: 'processing_progress',
    fileId,
    filename: originalFilename,
    progress: 40,
    status: 'processing',
    message: 'Transcoding to WebM...',
  });

  // Transcode to WebM (2-pass)
  await execFileAsync('ffmpeg', [
    '-i', sourcePath, '-y',
    '-c:v', 'libvpx-vp9', '-b:v', '1500k', '-pass', '1', '-an', '-f', 'webm', nullOutput
  ]);
  await execFileAsync('ffmpeg', [
    '-i', sourcePath,
    '-c:v', 'libvpx-vp9', '-b:v', '1500k', '-pass', '2',
    '-c:a', 'libopus', '-b:a', '128k',
    webmPath
  ]);

  await sendProgress(clientId, {
    type: 'processing_progress',
    fileId,
    filename: originalFilename,
    progress: 70,
    status: 'processing',
    message: 'Generating HLS stream...',
  });

  // Generate Thumbnails
  const midpoint = parseFloat(probeData.format.duration) / 2;
  await Promise.all([
    execFileAsync('ffmpeg', [
      '-i', sourcePath,
      '-ss', midpoint.toString(),
      '-vframes', '1',
      '-vf', 'scale=1280:-1',
      thumb1280Path
    ]),
    execFileAsync('ffmpeg', [
      '-i', sourcePath,
      '-ss', midpoint.toString(),
      '-vframes', '1',
      '-vf', 'scale=720:-1',
      thumb720Path
    ]),
    execFileAsync('ffmpeg', [
      '-i', sourcePath,
      '-ss', midpoint.toString(),
      '-vframes', '1',
      '-vf', 'scale=320:-1',
      thumb320Path
    ]),
  ]);
  
  const mp4Buffer = await fs.readFile(mp4Path);
  const webmBuffer = await fs.readFile(webmPath);
  const thumb1280Buffer = await fs.readFile(thumb1280Path);
  const thumb720Buffer = await fs.readFile(thumb720Path);
  const thumb320Buffer = await fs.readFile(thumb320Path);

  const [mp4StoragePath, webmStoragePath, thumb1280StoragePath, thumb720StoragePath, thumb320StoragePath] = await Promise.all([
    saveFile(`videos/processed/${baseName}.mp4`, mp4Buffer, 'video/mp4'),
    saveFile(`videos/processed/${baseName}.webm`, webmBuffer, 'video/webm'),
    saveFile(`videos/processed/${baseName}-thumb-1280p.jpg`, thumb1280Buffer, 'image/jpeg'),
    saveFile(`videos/processed/${baseName}-thumb-720p.jpg`, thumb720Buffer, 'image/jpeg'),
    saveFile(`videos/processed/${baseName}-thumb-320p.jpg`, thumb320Buffer, 'image/jpeg')
  ]);

  // HLS processing
  const hls720pPath = path.join(hlsPath, '720p.m3u8');
  const hls360pPath = path.join(hlsPath, '360p.m3u8');

  await Promise.all([
    execFileAsync('ffmpeg', [
      '-i', sourcePath,
      '-vf', 'scale=-2:720',
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '23',
      '-c:a', 'aac', '-q:a', '4',
      '-hls_time', '10',
      '-hls_playlist_type', 'vod',
      '-hls_segment_filename', path.join(hlsPath, '720p_%03d.ts'),
      hls720pPath
    ]),
    execFileAsync('ffmpeg', [
      '-i', sourcePath,
      '-vf', 'scale=-2:360',
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '25',
      '-c:a', 'aac', '-q:a', '5',
      '-hls_time', '10',
      '-hls_playlist_type', 'vod',
      '-hls_segment_filename', path.join(hlsPath, '360p_%03d.ts'),
      hls360pPath
    ])
  ]);

  const masterPlaylistContent = `#EXTM3U
#EXT-X-STREAM-INF:BANDWIDTH=2000000,RESOLUTION=1280x720
720p.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=640x360
360p.m3u8`;

  const masterPlaylistPath = path.join(hlsPath, 'master.m3u8');
  await fs.writeFile(masterPlaylistPath, masterPlaylistContent);

  const hlsFiles = await fs.readdir(hlsPath);
  const hlsStoragePaths = await Promise.all(
    hlsFiles.map(file => {
      const localPath = path.join(hlsPath, file);
      const storagePath = `videos/hls/${baseName}/${file}`;
      return fs.readFile(localPath).then(buffer => saveFile(storagePath, buffer, file.endsWith('.m3u8') ? 'application/vnd.apple.mpegurl' : 'video/mp2t'));
    })
  );
  
  const masterHlsUrl = hlsStoragePaths.find(p => p.endsWith('master.m3u8'));

  await fs.rm(tempDir, { recursive: true, force: true });

  const result = {
    original: {
      path: sourcePath,
      filename: originalFilename,
      size: probeData.format.size,
      duration: parseFloat(probeData.format.duration),
      width: videoStream.width,
      height: videoStream.height,
      format: probeData.format.format_name,
      video_codec: videoStream.codec_name,
      audio_codec: audioStream ? audioStream.codec_name : 'none',
    },
    formats: {
      mp4: {
        path: mp4StoragePath,
        filename: `${baseName}.mp4`,
        size: mp4Buffer.length
      },
      webm: {
        path: webmStoragePath,
        filename: `${baseName}.webm`,
        size: webmBuffer.length
      }
    },
    thumbnails: {
      '1280p': {
        path: thumb1280StoragePath,
        filename: `${baseName}-thumb-1280p.jpg`,
      },
      '720p': {
        path: thumb720StoragePath,
        filename: `${baseName}-thumb-720p.jpg`,
      },
      '320p': {
        path: thumb320StoragePath,
        filename: `${baseName}-thumb-320p.jpg`,
      }
    },
    hls: {
      path: masterHlsUrl,
      filename: 'master.m3u8'
    }
  };

  await sendProgress(clientId, {
    type: 'processing_progress',
    fileId,
    filename: originalFilename,
    progress: 90,
    status: 'processing',
    message: 'Generating thumbnails...',
  });

  return result;
}

export function isVideoFile(mimetype: string): boolean {
  return mimetype.startsWith('video/');
} 