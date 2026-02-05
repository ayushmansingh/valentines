import exifr from 'exifr';

/**
 * Extract GPS coordinates and timestamp from an image file's EXIF data
 * @param {File} file - The image file to extract from
 * @returns {Promise<{lat: number, lng: number, timestamp: string} | null>}
 */
export async function extractGpsFromFile(file) {
    try {
        // First, try to get ALL EXIF data for debugging
        const fullExif = await exifr.parse(file, true);

        if (!fullExif) {
            console.log(`📷 No EXIF data found in: ${file.name}`);
            console.log(`   ℹ️ This photo may have been downloaded from web (metadata stripped)`);
            return null;
        }

        // Log available EXIF keys for debugging
        const availableKeys = Object.keys(fullExif);
        console.log(`📷 EXIF tags in ${file.name}:`, availableKeys.slice(0, 15).join(', ') + (availableKeys.length > 15 ? '...' : ''));

        // Get coordinates (exifr automatically converts to decimal degrees)
        const lat = fullExif.latitude;
        const lng = fullExif.longitude;

        // Get timestamp (prefer DateTimeOriginal, fallback to CreateDate/ModifyDate)
        const timestamp = fullExif.DateTimeOriginal || fullExif.CreateDate || fullExif.ModifyDate || null;

        if (lat && lng) {
            console.log(`📍 GPS FOUND in ${file.name}: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
            return {
                lat,
                lng,
                timestamp: timestamp ? new Date(timestamp).toISOString() : null
            };
        }

        // GPS not found - provide helpful debug info
        console.log(`📷 No GPS in: ${file.name}`);
        console.log(`   ℹ️ Available location tags:`,
            ['GPSLatitude', 'GPSLongitude', 'GPSLatitudeRef', 'GPSLongitudeRef']
                .filter(key => fullExif[key])
                .join(', ') || 'NONE'
        );
        console.log(`   ℹ️ GPS may have been stripped when downloading from Google Photos web`);
        console.log(`   ℹ️ Try: Upload directly from phone, or use Google Takeout`);

        return null;

    } catch (error) {
        console.error(`❌ EXIF extraction error for ${file.name}:`, error);
        return null;
    }
}

/**
 * Generate a clustered random location near existing photos or city center
 * @param {number} cityLat - City center latitude
 * @param {number} cityLng - City center longitude
 * @param {Array} existingPhotos - Photos with GPS data to cluster near
 * @returns {{lat: number, lng: number}}
 */
export function generateClusteredLocation(cityLat, cityLng, existingPhotos = []) {
    // If there are existing photos with GPS, cluster near one of them
    const photosWithGps = existingPhotos.filter(p => p.hasGps && p.lat && p.lng);

    let baseLat, baseLng, radius;

    if (photosWithGps.length > 0) {
        // Pick a random existing photo to cluster near
        const reference = photosWithGps[Math.floor(Math.random() * photosWithGps.length)];
        baseLat = reference.lat;
        baseLng = reference.lng;
        radius = 0.005; // ~500m near existing photos
    } else {
        // Fall back to city center
        baseLat = cityLat;
        baseLng = cityLng;
        radius = 0.009; // ~1km from city center
    }

    // Generate random offset within radius (circular distribution)
    const angle = Math.random() * 2 * Math.PI;
    const r = Math.sqrt(Math.random()) * radius; // sqrt for uniform circular distribution

    return {
        lat: baseLat + r * Math.cos(angle),
        lng: baseLng + r * Math.sin(angle)
    };
}

/**
 * Process multiple files and extract GPS from each
 * @param {File[]} files - Array of image files
 * @param {number} cityLat - City center latitude for fallback
 * @param {number} cityLng - City center longitude for fallback
 * @returns {Promise<Array<{url: string, lat: number, lng: number, timestamp: string|null, hasGps: boolean}>>}
 */
export async function processFilesForGps(files, cityLat, cityLng) {
    const results = [];
    const photosWithGps = [];

    for (const file of files) {
        const gpsData = await extractGpsFromFile(file);

        if (gpsData) {
            results.push({
                file,
                lat: gpsData.lat,
                lng: gpsData.lng,
                timestamp: gpsData.timestamp,
                hasGps: true
            });
            photosWithGps.push({ lat: gpsData.lat, lng: gpsData.lng, hasGps: true });
        } else {
            // Will generate clustered location after all files processed
            results.push({
                file,
                lat: null,
                lng: null,
                timestamp: null,
                hasGps: false
            });
        }
    }

    // Second pass: Generate clustered locations for photos without GPS
    for (const result of results) {
        if (!result.hasGps) {
            const clusteredLoc = generateClusteredLocation(cityLat, cityLng, photosWithGps);
            result.lat = clusteredLoc.lat;
            result.lng = clusteredLoc.lng;
            console.log(`🎲 Generated clustered location for ${result.file.name}: ${clusteredLoc.lat.toFixed(4)}, ${clusteredLoc.lng.toFixed(4)}`);
        }
    }

    return results;
}
