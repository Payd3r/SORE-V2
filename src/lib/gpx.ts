interface TrackPoint {
    lat: number;
    lon: number;
    time: Date;
}

interface GpxData {
    trackName: string;
    points: TrackPoint[];
}

export function createGpx(data: GpxData): string {
    const { trackName, points } = data;

    const gpxPoints = points.map(p => 
        `
        <trkpt lat="${p.lat}" lon="${p.lon}">
            <time>${p.time.toISOString()}</time>
        </trkpt>
        `
    ).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="SORE-V2" xmlns="http://www.topografix.com/GPX/1/1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">
    <metadata>
        <name>${trackName}</name>
        <time>${new Date().toISOString()}</time>
    </metadata>
    <trk>
        <name>${trackName}</name>
        <trkseg>${gpxPoints}</trkseg>
    </trk>
</gpx>`;
} 