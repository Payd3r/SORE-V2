'use client';

import React from 'react';
import Lightbox, { type LightboxExternalProps } from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import 'yet-another-react-lightbox/plugins/thumbnails.css';
import 'yet-another-react-lightbox/plugins/captions.css';
import 'yet-another-react-lightbox/plugins/zoom.css';

// You can import optional plugins
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import Thumbnails from 'yet-another-react-lightbox/plugins/thumbnails';
import Captions from 'yet-another-react-lightbox/plugins/captions';
import Fullscreen from 'yet-another-react-lightbox/plugins/fullscreen';

interface CustomLightboxProps extends LightboxExternalProps {
    // You can add any custom props here if needed
}

const CustomLightbox: React.FC<CustomLightboxProps> = (props) => {
    return (
        <Lightbox
            plugins={[Zoom, Thumbnails, Captions, Fullscreen]}
            zoom={{
                maxZoomPixelRatio: 2,
                zoomInMultiplier: 1.5,
                doubleTapDelay: 300,
                doubleClickDelay: 500,
                doubleClickMaxStops: 2,
                keyboardMoveDistance: 50,
                wheelZoomDistanceFactor: 100,
                pinchZoomDistanceFactor: 100,
                scrollToZoom: true,
            }}
            thumbnails={{
                position: "bottom",
                width: 120,
                height: 80,
                border: 1,
                borderRadius: 4,
                padding: 4,
                gap: 16,
                imageFit: "cover",
            }}
            captions={{
                showToggle: true,
                descriptionTextAlign: "center",
            }}
            styles={{
                container: { backgroundColor: 'rgba(10, 10, 10, 0.9)' },
                thumbnail: { backgroundColor: 'rgba(255, 255, 255, 0.1)' },
                thumbnailsContainer: { backgroundColor: 'rgba(0, 0, 0, 0.5)' }
            }}
            {...props}
        />
    );
};

export default CustomLightbox; 