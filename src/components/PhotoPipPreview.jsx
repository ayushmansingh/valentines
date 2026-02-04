import { motion } from "framer-motion";
import { useMemo } from "react";

/**
 * Glass Polaroid Preview Component
 * Shows a premium hover preview of a photo pip
 */
export default function PhotoPipPreview({ photo, mousePos }) {
    // Format timestamp for display
    const formattedTime = useMemo(() => {
        if (!photo.timestamp) return null;

        try {
            const date = new Date(photo.timestamp);
            return date.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
        } catch {
            return null;
        }
    }, [photo.timestamp]);

    // Position the preview above the cursor, offset to not cover the pip
    const previewStyle = {
        position: 'fixed',
        left: mousePos.x,
        top: mousePos.y - 20, // Offset above cursor
        transform: 'translate(-50%, -100%)', // Center horizontally, anchor at bottom
        zIndex: 1000,
        pointerEvents: 'none',
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 4 }}
            transition={{
                type: "tween",
                duration: 0.15,
                ease: "easeOut"
            }}
            style={previewStyle}
        >
            {/* Glass Polaroid Frame */}
            <div
                className="relative rounded-xl overflow-hidden"
                style={{
                    transform: 'rotate(-2deg)',
                    boxShadow: `
                        0 8px 32px rgba(0, 0, 0, 0.4),
                        0 2px 8px rgba(0, 0, 0, 0.2),
                        inset 0 0 0 1px rgba(255, 255, 255, 0.1)
                    `,
                }}
            >
                {/* Glassmorphism Background */}
                <div
                    className="absolute inset-0 backdrop-blur-md"
                    style={{
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)',
                    }}
                />

                {/* Content */}
                <div className="relative p-2">
                    {/* Photo */}
                    <div
                        className="rounded-lg overflow-hidden"
                        style={{
                            width: '160px',
                            height: '120px',
                        }}
                    >
                        <img
                            src={photo.url}
                            alt="Memory"
                            className="w-full h-full object-cover"
                            style={{
                                filter: 'brightness(1.05) contrast(1.02)',
                            }}
                        />
                    </div>

                    {/* Metadata Bar */}
                    <div className="mt-2 flex items-center justify-between px-1">
                        {/* Time */}
                        {formattedTime && (
                            <span className="text-white/70 text-xs font-sans">
                                {formattedTime}
                            </span>
                        )}

                        {/* GPS Indicator */}
                        <span
                            className={`text-xs font-sans ${photo.hasGps
                                ? 'text-cyan-400'
                                : 'text-amber-400'
                                }`}
                        >
                            {photo.hasGps ? '📍 GPS' : '📍 ~Approx'}
                        </span>
                    </div>
                </div>

                {/* Shine Effect */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.1) 45%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.1) 55%, transparent 60%)',
                    }}
                />
            </div>
        </motion.div>
    );
}
