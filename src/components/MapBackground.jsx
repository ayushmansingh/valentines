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
        (toLocation, duration = 2000, skipLine = false) => {
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

                // Update flight line (draw from start to current position) - skip if coming from intro
                if (!skipLine) {
                    onUpdateFlightLine([
                        { lat: startCenter.lat(), lng: startCenter.lng() },
                        { lat, lng }
                    ]);
                }

                if (progress < 1) {
                    requestAnimationFrame(tick);
                } else {
                    isAnimatingRef.current = false;
                }
            }

            requestAnimationFrame(tick);
        },
        [map, onUpdateFlightLine]
    );

    // Handle chapter changes
    useEffect(() => {
        if (!map) return;

        // In explore mode, don't auto-navigate
        if (exploreMode) return;

        // Handle intro view (when no chapter or 'intro')
        if (!activeChapter || activeChapter === 'intro') {
            if (currentChapterRef.current !== 'intro') {
                currentChapterRef.current = 'intro';
                map.setCenter({ lat: MAP_CONFIG.introView.lat, lng: MAP_CONFIG.introView.lng });
                map.setZoom(MAP_CONFIG.introView.zoom);
                onUpdateFlightLine(null);
            }
            return;
        }

        const chapter = chapters.find((c) => c.id === activeChapter);
        if (!chapter) return;

        // Skip if same chapter
        if (currentChapterRef.current === activeChapter) return;

        // Check if coming from intro - don't draw line
        const comingFromIntro = currentChapterRef.current === 'intro';
        currentChapterRef.current = activeChapter;

        const toLocation = chapter.location;

        // Animate to new location (skip line if coming from intro)
        flyTo(toLocation, 2500, comingFromIntro);
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
 * Custom marker pin component - Glassmorphism floating label design
 */
function MarkerPin({ title, isActive, onClick }) {
    return (
        <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
                e.stopPropagation();
                onClick();
            }}
            className="cursor-pointer relative"
            style={{ transform: "translateY(-50%)" }}
        >
            {/* Pulse ring for active marker */}
            {isActive && (
                <motion.div
                    className="absolute inset-0 flex items-center justify-center"
                    initial={{ scale: 1, opacity: 0.6 }}
                    animate={{ scale: 2, opacity: 0 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
                >
                    <div className="w-full h-full rounded-xl bg-cyan-400/40" />
                </motion.div>
            )}

            {/* Floating label with strong visibility */}
            <div
                className={`
                    relative px-4 py-2.5 rounded-xl
                    shadow-xl transition-all duration-300
                    ${isActive
                        ? "bg-gradient-to-r from-sky-400 to-cyan-300 shadow-cyan-400/50"
                        : "bg-slate-800/80 border border-white/20 hover:bg-slate-700/90"
                    }
                `}
                style={{
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                    boxShadow: isActive
                        ? "0 8px 32px rgba(0, 200, 255, 0.3)"
                        : "0 4px 20px rgba(0, 0, 0, 0.4)",
                }}
            >
                {/* City name */}
                <span
                    className={`
                        font-serif text-sm font-semibold tracking-wide
                        transition-colors duration-300
                        ${isActive ? "text-slate-900" : "text-white"}
                    `}
                >
                    {title}
                </span>

                {/* Location dot */}
                <div
                    className={`
                        absolute -bottom-1.5 left-1/2 -translate-x-1/2
                        w-2.5 h-2.5 rounded-full
                        transition-all duration-300
                        ${isActive
                            ? "bg-cyan-500 shadow-lg shadow-cyan-500/50"
                            : "bg-white shadow-md"
                        }
                    `}
                />
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
    children,
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

                    {/* Flight Path - Bottom layer: Soft shadow */}
                    {flightPath && (
                        <Polyline
                            path={flightPath}
                            options={{
                                strokeColor: "#000000",
                                strokeOpacity: 0.3,
                                strokeWeight: 6,
                                zIndex: 1,
                            }}
                        />
                    )}

                    {/* Flight Path - Top layer: Dashed white line */}
                    {flightPath && (
                        <Polyline
                            path={flightPath}
                            options={{
                                strokeColor: "#ffffff",
                                strokeOpacity: 0,  // Hide solid line, only show icons
                                strokeWeight: 3,
                                zIndex: 2,
                                icons: [{
                                    icon: {
                                        path: 'M 0,-1 0,1',
                                        strokeColor: '#ffffff',
                                        strokeOpacity: 1,
                                        strokeWeight: 3,
                                        scale: 4,
                                    },
                                    offset: '0',
                                    repeat: '20px',
                                }],
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

                {/* Children rendered inside APIProvider - for AddCityModal etc */}
                {children}
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
