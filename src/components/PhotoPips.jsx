import { useState, useCallback, useMemo } from "react";
import { AdvancedMarker } from "@vis.gl/react-google-maps";
import { motion, AnimatePresence } from "framer-motion";
import PhotoPipPreview from "./PhotoPipPreview";

/**
 * Generate radial scatter offset for constellation effect
 * Distributes pips in a ring around the city center
 * @param {number} index - Index of the pip
 * @param {number} total - Total number of pips
 * @param {number} radius - Base radius in degrees (~0.018 = ~2km)
 */
function getRadialOffset(index, total, radius = 0.018) {
    // Golden angle for nice distribution
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    const angle = index * goldenAngle;

    // Vary the radius slightly for organic look (0.7 to 1.3x)
    const r = radius * (0.7 + Math.random() * 0.6);

    return {
        latOffset: r * Math.cos(angle),
        lngOffset: r * Math.sin(angle) * 1.2, // Stretch horizontally slightly
    };
}

/**
 * PhotoPips Component
 * Renders "Glow Pip" micro-markers for photos on the map
 * Now with radial scatter for constellation effect
 */
export default function PhotoPips({
    photos = [],
    isActive,
    isChapterHovered,
    onPipHover,
    cityCenter // { lat, lng } - for radial scatter calculation
}) {
    const [hoveredPip, setHoveredPip] = useState(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    // Handle pip hover with magnetic effect
    const handlePipHover = useCallback((photo, e) => {
        setHoveredPip(photo);
        setMousePos({ x: e?.clientX || 0, y: e?.clientY || 0 });
        if (onPipHover) onPipHover(photo);
    }, [onPipHover]);

    const handlePipLeave = useCallback(() => {
        setHoveredPip(null);
        if (onPipHover) onPipHover(null);
    }, [onPipHover]);

    // Filter photos with valid coordinates and apply radial scatter
    const scatteredPhotos = useMemo(() => {
        const valid = photos.filter(p => p.lat && p.lng);

        return valid.map((photo, index) => {
            // Apply radial scatter offset for constellation effect
            const { latOffset, lngOffset } = getRadialOffset(index, valid.length);

            return {
                ...photo,
                displayLat: photo.lat + latOffset,
                displayLng: photo.lng + lngOffset,
            };
        });
    }, [photos]);

    if (!isActive || scatteredPhotos.length === 0) return null;

    return (
        <>
            {scatteredPhotos.map((photo, index) => (
                <GlowPip
                    key={photo.url || index}
                    photo={photo}
                    isHovered={hoveredPip?.url === photo.url}
                    isChapterHovered={isChapterHovered}
                    onHover={handlePipHover}
                    onLeave={handlePipLeave}
                />
            ))}

            {/* Hover Preview */}
            <AnimatePresence>
                {hoveredPip && (
                    <PhotoPipPreview
                        photo={hoveredPip}
                        mousePos={mousePos}
                    />
                )}
            </AnimatePresence>
        </>
    );
}

/**
 * Individual Glow Pip Marker
 */
function GlowPip({ photo, isHovered, isChapterHovered, onHover, onLeave }) {
    const [isNear, setIsNear] = useState(false);

    // Magnetic hover - detect when cursor is within 20px
    const handleMouseMove = useCallback((e) => {
        const element = e.currentTarget;
        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const distance = Math.sqrt(
            Math.pow(e.clientX - centerX, 2) +
            Math.pow(e.clientY - centerY, 2)
        );
        setIsNear(distance < 20);
    }, []);

    // Determine visual state - BRIGHT pips
    const getOpacity = () => {
        if (isHovered) return 1;
        if (isNear) return 1;
        if (isChapterHovered) return 1; // Full brightness on marker hover
        return 0.7; // Default state - still visible
    };

    const getScale = () => {
        if (isHovered) return 1.8;
        if (isNear) return 1.5;
        return 1;
    };

    // Use display coordinates (with radial offset applied)
    const position = {
        lat: photo.displayLat || photo.lat,
        lng: photo.displayLng || photo.lng
    };

    return (
        <AdvancedMarker
            position={position}
            zIndex={isHovered ? 200 : 150}  // Higher z-index to be above city markers
        >
            <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                    scale: getScale(),
                    opacity: getOpacity(),
                }}
                transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 25
                }}
                onMouseMove={handleMouseMove}
                onMouseEnter={(e) => onHover(photo, e)}
                onMouseLeave={() => {
                    setIsNear(false);
                    onLeave();
                }}
                className="relative cursor-pointer"
                style={{
                    // Expand click target for magnetic hover
                    padding: '14px',
                    margin: '-14px',
                }}
            >
                {/* Outer Glow */}
                <div
                    className="absolute inset-0 rounded-full"
                    style={{
                        background: 'radial-gradient(circle, rgba(255,105,180,0.4) 0%, transparent 70%)',
                        filter: 'blur(4px)',
                        transform: 'scale(2)',
                    }}
                />

                {/* Core Pip */}
                <div
                    className="relative rounded-full"
                    style={{
                        width: '6px',
                        height: '6px',
                        background: photo.hasGps
                            ? 'rgba(255, 105, 180, 0.9)' // Pink for real GPS
                            : 'rgba(255, 180, 200, 0.9)', // Lighter pink for generated
                        boxShadow: `
                            0 0 4px rgba(255, 105, 180, 0.8),
                            0 0 8px rgba(255, 105, 180, 0.4)
                        `,
                    }}
                />
            </motion.div>
        </AdvancedMarker>
    );
}
