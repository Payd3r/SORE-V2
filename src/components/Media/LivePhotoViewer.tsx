import React, { useEffect, useRef } from 'react';
import LivePhotos from 'laphs';

interface LivePhotoViewerProps {
  imageUrl: string;
  videoUrl: string;
  stillImageTime?: number; // Time in seconds
}

const LivePhotoViewer: React.FC<LivePhotoViewerProps> = ({
  imageUrl,
  videoUrl,
  stillImageTime = 0, // Default to 0 if not provided
}) => {
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    // Ensure laphs has loaded and the ref is attached.
    if (imgRef.current) {
      // The library scans for elements with the specific data attributes.
      // We call initialize and can optionally pass the element to it.
      const livePhoto = LivePhotos.initialize(imgRef.current);
      
      // The viewer can be controlled programmatically, for example, on mouse enter/leave
      const handleMouseEnter = () => {
        livePhoto[0]?.play();
      };

      const handleMouseLeave = () => {
        livePhoto[0]?.stop();
      };

      const element = imgRef.current;
      element.addEventListener('mouseenter', handleMouseEnter);
      element.addEventListener('mouseleave', handleMouseLeave);
      
      // Cleanup function to remove event listeners
      return () => {
        element.removeEventListener('mouseenter', handleMouseEnter);
        element.removeEventListener('mouseleave', handleMouseLeave);
        // Laphs also has a cleanup method if it injected styles
        LivePhotos.cleanup();
      };
    }
  }, [imageUrl, videoUrl]);

  return (
    <img
      ref={imgRef}
      src={imageUrl}
      data-live-photo={videoUrl}
      data-live-photo-still-image-time={stillImageTime}
      alt="Live Photo"
      style={{ cursor: 'pointer', maxWidth: '100%' }}
    />
  );
};

export default LivePhotoViewer; 