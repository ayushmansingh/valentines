import { useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Image Lightbox Component
 * Full-screen image viewer with keyboard and touch navigation
 */
export default function ImageLightbox({ images, currentIndex, isOpen, onClose, onNavigate }) {
    const touchStartX = useRef(0);
    const touchEndX = useRef(0);

    // Handle keyboard navigation
    const handleKeyDown = useCallback((e) => {
        if (!isOpen) return;

        switch (e.key) {
            case "Escape":
                onClose();
                break;
            case "ArrowLeft":
                if (currentIndex > 0) {
                    onNavigate(currentIndex - 1);
                }
                break;
            case "ArrowRight":
                if (currentIndex < images.length - 1) {
                    onNavigate(currentIndex + 1);
                }
                break;
            default:
                break;
        }
    }, [isOpen, currentIndex, images.length, onClose, onNavigate]);

    // Touch handlers for swipe navigation
    const handleTouchStart = useCallback((e) => {
        touchStartX.current = e.touches[0].clientX;
    }, []);

    const handleTouchMove = useCallback((e) => {
        touchEndX.current = e.touches[0].clientX;
    }, []);

    const handleTouchEnd = useCallback(() => {
        const diff = touchStartX.current - touchEndX.current;
        const threshold = 50; // minimum swipe distance

        if (Math.abs(diff) > threshold) {
            if (diff > 0 && currentIndex < images.length - 1) {
                // Swipe left - next image
                onNavigate(currentIndex + 1);
            } else if (diff < 0 && currentIndex > 0) {
                // Swipe right - prev image
                onNavigate(currentIndex - 1);
            }
        }
    }, [currentIndex, images.length, onNavigate]);

    useEffect(() => {
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);

    // Lock body scroll when lightbox is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [isOpen]);

    if (!images || images.length === 0) return null;

    const currentImage = images[currentIndex];
    const hasPrev = currentIndex > 0;
    const hasNext = currentIndex < images.length - 1;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/95 z-[100]"
                    />

                    {/* Content Container */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[101] flex items-center justify-center p-4"
                    >
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 z-10 w-12 h-12 rounded-full
                                     bg-white/10 backdrop-blur-sm border border-white/20
                                     flex items-center justify-center
                                     text-white/80 hover:text-white hover:bg-white/20
                                     transition-all duration-200"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        {/* Image Counter */}
                        <div className="absolute top-4 left-4 z-10 px-4 py-2 rounded-full
                                      bg-white/10 backdrop-blur-sm border border-white/20
                                      text-white/80 text-sm font-sans">
                            {currentIndex + 1} / {images.length}
                        </div>

                        {/* Author Badge */}
                        {currentImage?.author && (
                            <div className={`absolute top-4 left-1/2 -translate-x-1/2 z-10 px-4 py-1.5 rounded-full
                                          text-white text-sm font-sans font-medium
                                          ${currentImage.author === "Ayushman"
                                    ? "bg-rose-500/80"
                                    : "bg-violet-500/80"
                                }`}>
                                {currentImage.author}
                            </div>
                        )}

                        {/* Previous Button - hidden on small screens (use swipe) */}
                        {hasPrev && (
                            <button
                                onClick={() => onNavigate(currentIndex - 1)}
                                className="hidden md:flex absolute left-4 md:left-8 z-10 w-12 h-12 rounded-full
                                         bg-white/10 backdrop-blur-sm border border-white/20
                                         items-center justify-center
                                         text-white/80 hover:text-white hover:bg-white/20
                                         transition-all duration-200"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                        )}

                        {/* Next Button - hidden on small screens (use swipe) */}
                        {hasNext && (
                            <button
                                onClick={() => onNavigate(currentIndex + 1)}
                                className="hidden md:flex absolute right-4 md:right-8 z-10 w-12 h-12 rounded-full
                                         bg-white/10 backdrop-blur-sm border border-white/20
                                         items-center justify-center
                                         text-white/80 hover:text-white hover:bg-white/20
                                         transition-all duration-200"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        )}

                        {/* Main Image - with touch swipe support */}
                        <motion.img
                            key={currentIndex}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            src={currentImage?.url}
                            alt={`Photo ${currentIndex + 1}`}
                            className="max-w-full max-h-[80vh] md:max-h-[85vh] object-contain rounded-lg shadow-2xl touch-pan-y"
                            onClick={(e) => e.stopPropagation()}
                            onTouchStart={handleTouchStart}
                            onTouchMove={handleTouchMove}
                            onTouchEnd={handleTouchEnd}
                        />

                        {/* Thumbnail Strip */}
                        {images.length > 1 && (
                            <div
                                className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10
                                          flex gap-2 p-2 rounded-xl
                                          bg-black/50 backdrop-blur-sm border border-white/10
                                          max-w-[90vw] overflow-x-auto"
                                style={{ paddingBottom: "calc(0.5rem + env(safe-area-inset-bottom, 0))" }}
                            >
                                {images.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => onNavigate(idx)}
                                        className={`flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden
                                                  transition-all duration-200
                                                  ${idx === currentIndex
                                                ? "ring-2 ring-white scale-110"
                                                : "opacity-60 hover:opacity-100"
                                            }`}
                                    >
                                        <img
                                            src={img.url}
                                            alt={`Thumbnail ${idx + 1}`}
                                            className="w-full h-full object-cover"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
