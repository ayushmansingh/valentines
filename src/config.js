/**
 * Configuration file for the Map Scrollytelling Engine
 * Set VITE_GOOGLE_MAPS_API_KEY in .env.local for local dev
 * Set in Vercel environment variables for production
 */

export const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

// Map configuration
export const MAP_CONFIG = {
    // Default map settings
    defaultZoom: 4,
    defaultCenter: { lat: 35, lng: 40 },

    // Camera animation settings
    animation: {
        // Duration in milliseconds for camera transitions
        flyDuration: 3000,
        // Zoom level when flying between distant locations
        cruiseAltitude: 3,
        // Distance threshold (in km) to trigger "long flight" animation
        longFlightThreshold: 500,
    },

    // Map style ID for cloud-based styling (optional)
    // Create one at: https://console.cloud.google.com/google/maps-apis/studio/styles
    mapId: "be30acdfffdfc6e9acf25e94",
};
