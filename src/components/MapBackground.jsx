import { useEffect, useRef, useCallback, useState } from "react";
import { APIProvider, Map, useMap, AdvancedMarker, useMapsLibrary } from "@vis.gl/react-google-maps";
import { GOOGLE_MAPS_API_KEY, MAP_CONFIG } from "../config";
import mapStyle from "../styles/map-style.json";
import { motion } from "framer-motion";

/**
 * Easing function for smooth animations
 */
function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Inner map component that handles camera movements and gestures
 */
const Polyline = ({ path, options }) => {
    const map = useMap();
    const mapsLibrary = useMapsLibrary('maps');
    const [polyline, setPolyline] = useState(null);

    useEffect(() => {
        if (!map || !mapsLibrary) return;

        const newPolyline = new mapsLibrary.Polyline({
            ...options
        });
        newPolyline.setMap(map);
        setPolyline(newPolyline);

        return () => {
            newPolyline.setMap(null);
        };
    }, [map, mapsLibrary]);

    useEffect(() => {
        if (polyline) {
            polyline.setOptions(options);
            polyline.setPath(path);
        }
    }, [polyline, options, path]);

    return null;
};

function MapController({ activeChapter, chapters, exploreMode, onMapReady, onUpdateFlightLine }) {
    const map = useMap();
    const currentChapterRef = useRef(null);
    const isAnimatingRef = useRef(false);

    // Report map ready
    useEffect(() => {
        if (map && onMapReady) {
            onMapReady(map);
        }
    }, [map, onMapReady]);

    const flyTo = useCallback(
        (toLocation, duration = 2000) => {
            if (!map || isAnimatingRef.current) return;
            isAnimatingRef.current = true;

            const startCenter = map.getCenter();
            const startZoom = map.getZoom();
            const startTime = performance.now();

            // Clear previous line
            onUpdateFlightLine(null);

            function tick(now) {
                const elapsed = now - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const eased = easeInOutCubic(progress);

                const lat = startCenter.lat() + (toLocation.lat - startCenter.lat()) * eased;
                const lng = startCenter.lng() + (toLocation.lng - startCenter.lng()) * eased;
                const zoom = startZoom + (toLocation.zoom - startZoom) * eased;

                // Update map view
                map.setCenter({ lat, lng });
                map.setZoom(zoom);

                // Update flight line (draw from start to current position)
                onUpdateFlightLine([
                    { lat: startCenter.lat(), lng: startCenter.lng() },
                    { lat, lng }
                ]);

                if (progress < 1) {
                    requestAnimationFrame(tick);
                } else {
                    isAnimatingRef.current = false;
                    // Keep the full line visible? Or fade it out?
                    // Let's keep it visible for a moment then maybe fade it out in a polish pass
                    // For now, it stays as the "path traveled"
                }
            }

            requestAnimationFrame(tick);
        },
        [map, onUpdateFlightLine]
    );

    // Handle chapter changes
    useEffect(() => {
        if (!map || !activeChapter) return;

        // In explore mode, don't auto-navigate
        if (exploreMode) return;

        const chapter = chapters.find((c) => c.id === activeChapter);
        if (!chapter) return;

        // Skip if same chapter
        if (currentChapterRef.current === activeChapter) return;
        currentChapterRef.current = activeChapter;

        const toLocation = chapter.location;

        // First chapter - set immediately
        if (!currentChapterRef.current || chapters.indexOf(chapter) === 0) {
            map.setCenter({ lat: toLocation.lat, lng: toLocation.lng });
            map.setZoom(toLocation.zoom);
            onUpdateFlightLine(null); // No line for first jump
        } else {
            // Animate to new location
            flyTo(toLocation, 2500); // Slightly slower for better line visualization
        }
    }, [activeChapter, chapters, map, flyTo, exploreMode, onUpdateFlightLine]);

    // Handle gesture mode changes
    useEffect(() => {
        if (!map) return;

        const options = {
            styles: mapStyle,
            disableDefaultUI: !exploreMode,
            zoomControl: exploreMode,
            scaleControl: exploreMode,
            gestureHandling: exploreMode ? "auto" : "none",
            keyboardShortcuts: exploreMode,
        };

        map.setOptions(options);
    }, [map, exploreMode]);

    return null;
}

/**
 * Custom marker pin component - rendered inside AdvancedMarker
 */
function MarkerPin({ title, isActive, onClick }) {
    return (
        <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
                e.stopPropagation();
                onClick();
            }}
            className="cursor-pointer flex flex-col items-center"
            style={{ transform: "translateY(-50%)" }}
        >
            {/* Pulse ring for active marker */}
            {isActive && (
                <motion.div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                    initial={{ scale: 1, opacity: 0.6 }}
                    animate={{ scale: 2.5, opacity: 0 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
                >
                    <div className="w-10 h-10 rounded-full bg-white/40" />
                </motion.div>
            )}

            {/* Marker pin */}
            <div
                className={`
                    w-12 h-12 rounded-full flex items-center justify-center
                    shadow-xl transition-all duration-300
                    ${isActive
                        ? "bg-white text-slate-900 scale-110"
                        : "bg-slate-800 text-white border-2 border-white/40 hover:bg-slate-700"
                    }
                `}
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                </svg>
            </div>
            <div className={`w-1 h-4 ${isActive ? "bg-white" : "bg-slate-600"}`} />

            {/* Label */}
            <div
                className={`
                    mt-1 px-3 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap shadow-lg
                    ${isActive
                        ? "bg-white text-slate-900"
                        : "bg-slate-800 text-white border border-white/20"
                    }
                `}
            >
                {title}
            </div>
        </motion.div>
    );
}

/**
 * Main MapBackground component - simplified with AdvancedMarker
 */
export default function MapBackground({
    activeChapter,
    chapters,
    exploreMode = false,
    onMarkerClick,
}) {
    const defaultCenter = chapters[0]?.location || MAP_CONFIG.defaultCenter;
    const [mapReady, setMapReady] = useState(false);
    const [flightPath, setFlightPath] = useState(null);

    const handleMapReady = useCallback(() => {
        setMapReady(true);
    }, []);

    const handleUpdateFlightLine = useCallback((path) => {
        setFlightPath(path);
    }, []);

    // Use a demo mapId for AdvancedMarker (replace with your own for production)
    const mapId = MAP_CONFIG.mapId || "DEMO_MAP_ID";

    return (
        <div className="fixed inset-0 w-full h-full z-0">
            <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
                <Map
                    defaultCenter={{ lat: defaultCenter.lat, lng: defaultCenter.lng }}
                    defaultZoom={defaultCenter.zoom || 10}
                    mapId={mapId}
                    disableDefaultUI={!exploreMode}
                    zoomControl={exploreMode}
                    gestureHandling={exploreMode ? "greedy" : "none"}
                    className="w-full h-full"
                    style={{ width: "100%", height: "100%" }}
                >
                    <MapController
                        activeChapter={activeChapter}
                        chapters={chapters}
                        exploreMode={exploreMode}
                        onMapReady={handleMapReady}
                        onUpdateFlightLine={handleUpdateFlightLine}
                    />

                    {/* Halo Line Effect - Dark outer stroke */}
                    {flightPath && (
                        <Polyline
                            path={flightPath}
                            options={{
                                strokeColor: "#1e293b",
                                strokeOpacity: 0.8,
                                strokeWeight: 6,
                            }}
                        />
                    )}

                    {/* Halo Line Effect - Light inner stroke */}
                    {flightPath && (
                        <Polyline
                            path={flightPath}
                            options={{
                                strokeColor: "#ffffff",
                                strokeOpacity: 0.9,
                                strokeWeight: 2,
                            }}
                        />
                    )}

                    {/* Markers rendered INSIDE the Map - native positioning */}
                    {chapters.map((chapter) => (
                        <AdvancedMarker
                            key={chapter.id}
                            position={{
                                lat: chapter.location.lat,
                                lng: chapter.location.lng,
                            }}
                            zIndex={activeChapter === chapter.id ? 100 : 50}
                            onClick={() => onMarkerClick(chapter.id)}
                        >
                            <MarkerPin
                                title={chapter.title}
                                isActive={activeChapter === chapter.id}
                                onClick={() => onMarkerClick(chapter.id)}
                            />
                        </AdvancedMarker>
                    ))}
                </Map>
            </APIProvider>

            {/* Explore mode indicator */}
            {exploreMode && (
                <div className="absolute bottom-4 left-4 z-30">
                    <div className="glass-dark px-4 py-2 rounded-full flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                        <span className="text-sm font-sans text-white/80">Explore Mode - Pan & Zoom enabled</span>
                    </div>
                </div>
            )}
        </div>
    );
}
