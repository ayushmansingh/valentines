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

    /**
     * Generate a curved arc path between two points
     * Uses a quadratic Bezier curve with elevated control point
     */
    const generateArcPath = useCallback((start, end, numPoints = 50) => {
        const points = [];

        // Calculate midpoint
        const midLat = (start.lat + end.lat) / 2;
        const midLng = (start.lng + end.lng) / 2;

        // Calculate distance between points (rough approximation)
        const distance = Math.sqrt(
            Math.pow(end.lat - start.lat, 2) +
            Math.pow(end.lng - start.lng, 2)
        );

        // Control point - offset perpendicular to the line
        // The arc curves "up" (towards north for horizontal lines)
        const arcHeight = distance * 0.3; // 30% of distance as arc height

        // Calculate perpendicular offset direction
        const dx = end.lng - start.lng;
        const dy = end.lat - start.lat;
        const length = Math.sqrt(dx * dx + dy * dy);

        // Perpendicular unit vector (rotated 90 degrees)
        const perpX = -dy / length;
        const perpY = dx / length;

        // Control point elevated above midpoint
        const controlLat = midLat + perpY * arcHeight;
        const controlLng = midLng + perpX * arcHeight;

        // Generate quadratic Bezier curve points
        for (let i = 0; i <= numPoints; i++) {
            const t = i / numPoints;
            const oneMinusT = 1 - t;

            // Quadratic Bezier formula: B(t) = (1-t)²P0 + 2(1-t)tP1 + t²P2
            const lat = oneMinusT * oneMinusT * start.lat +
                2 * oneMinusT * t * controlLat +
                t * t * end.lat;
            const lng = oneMinusT * oneMinusT * start.lng +
                2 * oneMinusT * t * controlLng +
                t * t * end.lng;

            points.push({ lat, lng });
        }

        return points;
    }, []);

    /**
     * Calculate zoom level to fit both points with padding
     */
    const calculateFitZoom = useCallback((start, end) => {
        const latDiff = Math.abs(end.lat - start.lat);
        const lngDiff = Math.abs(end.lng - start.lng);
        const maxDiff = Math.max(latDiff, lngDiff);

        // Approximate zoom levels for different distances
        if (maxDiff > 60) return 2;   // Continental
        if (maxDiff > 30) return 3;   // Large region
        if (maxDiff > 15) return 4;   // Country
        if (maxDiff > 8) return 5;    // Region
        if (maxDiff > 4) return 6;    // State
        if (maxDiff > 2) return 7;    // Metro area
        if (maxDiff > 1) return 8;    // City
        return 9;                      // Neighborhood
    }, []);

    /**
     * Multi-phase fly animation:
     * Phase 1: Zoom out to show both cities
     * Phase 2: Draw curved arc while panning
     * Phase 3: Zoom into destination
     */
    const flyTo = useCallback(
        (toLocation, totalDuration = 3500, skipLine = false) => {
            if (!map || isAnimatingRef.current) return;
            isAnimatingRef.current = true;

            const startCenter = map.getCenter();
            const startZoom = map.getZoom();
            const startLat = startCenter.lat();
            const startLng = startCenter.lng();

            // Calculate midpoint between start and end
            const midLat = (startLat + toLocation.lat) / 2;
            const midLng = (startLng + toLocation.lng) / 2;

            // Calculate zoom level to fit both points - zoom out MORE for long distances
            let fitZoom = calculateFitZoom(
                { lat: startLat, lng: startLng },
                { lat: toLocation.lat, lng: toLocation.lng }
            );
            // Zoom out 1-2 levels more to ensure the whole arc is visible
            fitZoom = Math.max(fitZoom - 1, 1);

            // Generate the curved arc path
            const arcPath = generateArcPath(
                { lat: startLat, lng: startLng },
                { lat: toLocation.lat, lng: toLocation.lng }
            );

            // Clear previous line
            onUpdateFlightLine(null);

            // Animation phases timing - longer middle phase for smoothness
            const phase1Duration = totalDuration * 0.20;  // Zoom out
            const phase2Duration = totalDuration * 0.60;  // Arc drawing (longer for smoothness)
            const phase3Duration = totalDuration * 0.20;  // Zoom in

            const startTime = performance.now();

            function tick(now) {
                const elapsed = now - startTime;
                const totalProgress = Math.min(elapsed / totalDuration, 1);

                let lat, lng, zoom;
                let arcProgress = 0;

                if (elapsed < phase1Duration) {
                    // Phase 1: Zoom out and move towards midpoint
                    const phaseProgress = elapsed / phase1Duration;
                    const eased = easeInOutCubic(phaseProgress);

                    // Move camera towards the midpoint of the arc
                    lat = startLat + (midLat - startLat) * eased;
                    lng = startLng + (midLng - startLng) * eased;
                    zoom = startZoom + (fitZoom - startZoom) * eased;
                    arcProgress = 0;

                } else if (elapsed < phase1Duration + phase2Duration) {
                    // Phase 2: Stay centered on midpoint while arc draws
                    const phaseElapsed = elapsed - phase1Duration;
                    const phaseProgress = phaseElapsed / phase2Duration;
                    const eased = easeInOutCubic(phaseProgress);

                    // Camera stays at midpoint - this keeps the whole arc visible
                    lat = midLat;
                    lng = midLng;
                    zoom = fitZoom;

                    // Arc draws progressively
                    arcProgress = eased;

                } else {
                    // Phase 3: Move from midpoint to destination and zoom in
                    const phaseElapsed = elapsed - phase1Duration - phase2Duration;
                    const phaseProgress = phaseElapsed / phase3Duration;
                    const eased = easeInOutCubic(phaseProgress);

                    // Move from midpoint to destination
                    lat = midLat + (toLocation.lat - midLat) * eased;
                    lng = midLng + (toLocation.lng - midLng) * eased;
                    zoom = fitZoom + (toLocation.zoom - fitZoom) * eased;
                    arcProgress = 1;
                }

                // Update map view
                map.setCenter({ lat, lng });
                map.setZoom(zoom);

                // Update flight line - progressively reveal arc
                if (!skipLine && arcProgress > 0) {
                    const visiblePoints = Math.ceil(arcProgress * arcPath.length);
                    onUpdateFlightLine(arcPath.slice(0, visiblePoints));
                }

                if (totalProgress < 1) {
                    requestAnimationFrame(tick);
                } else {
                    isAnimatingRef.current = false;
                    // Keep full arc visible
                    if (!skipLine) {
                        onUpdateFlightLine(arcPath);
                    }
                }
            }

            requestAnimationFrame(tick);
        },
        [map, onUpdateFlightLine, generateArcPath, calculateFitZoom]
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
        flyTo(toLocation, 3500, comingFromIntro);
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
