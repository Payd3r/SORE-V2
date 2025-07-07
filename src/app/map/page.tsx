'use client';

import dynamic from 'next/dynamic';

const InteractiveMap = dynamic(() => import('@/components/map/InteractiveMap'), {
    ssr: false,
});

export default function MapPage() {
    return (
        <div style={{ height: '100vh', width: '100%' }}>
            <InteractiveMap />
        </div>
    );
} 