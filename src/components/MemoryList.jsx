import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Memory List Component
 * Displays all memories for a city with images in a gallery format
 * Supports both legacy imageUrl and new imageUrls array format
 */
export default function MemoryList({ memories, onDelete, onImageClick }) {
    if (!memories || memories.length === 0) {
        return (
            <div className="text-center py-8">
                <p className="text-white/40 font-sans text-sm italic">
                    No memories yet. Add your first one!
                </p>
            </div>
        );
    }

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    // Helper to get all images from a memory (supports both old and new format)
    const getMemoryImages = (memory) => {
        const images = [];
        // New format: array of URLs
        if (memory.imageUrls && Array.isArray(memory.imageUrls)) {
            memory.imageUrls.forEach((url) => {
                images.push({ url, author: memory.author, memoryId: memory.id });
            });
        }
        // Legacy format: single URL
        if (memory.imageUrl) {
            images.push({ url: memory.imageUrl, author: memory.author, memoryId: memory.id });
        }
        return images;
    };

    // Collect all images from all memories for gallery view
    const allImages = memories.flatMap((m, memoryIndex) =>
        getMemoryImages(m).map((img, imgIndex) => ({
            ...img,
            id: `${m.id}-${imgIndex}`,
            globalIndex: memoryIndex * 100 + imgIndex, // for animation delay
        }))
    );

    return (
        <div className="space-y-6">
            {/* Image Gallery (if there are images) */}
            {allImages.length > 0 && (
                <div className="space-y-3">
                    <h4 className="text-sm font-sans text-white/50 uppercase tracking-wider">
                        Our Photos ({allImages.length})
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {allImages.map((img, index) => (
                            <motion.div
                                key={img.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.03 }}
                                className="relative aspect-square rounded-lg overflow-hidden group bg-black/20 cursor-pointer"
                                onClick={() => onImageClick && onImageClick(allImages, index)}
                            >
                                <img
                                    src={img.url}
                                    alt="Memory"
                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                    loading="lazy"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <span
                                    className={`absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-xs font-sans
                                        opacity-0 group-hover:opacity-100 transition-opacity
                                        ${img.author === "Ayushman"
                                            ? "bg-rose-500/80 text-white"
                                            : "bg-violet-500/80 text-white"
                                        }`}
                                >
                                    {img.author}
                                </span>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {/* Memory Cards */}
            <div className="space-y-4">
                <h4 className="text-sm font-sans text-white/50 uppercase tracking-wider">
                    Memories ({memories.length})
                </h4>
                <AnimatePresence mode="popLayout">
                    {memories.map((memory) => {
                        const memoryImages = getMemoryImages(memory);
                        return (
                            <motion.div
                                key={memory.id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="group relative bg-white/5 backdrop-blur-sm rounded-xl p-4 
                                           border border-white/10 hover:border-white/20 transition-colors"
                            >
                                {/* Delete Button */}
                                <button
                                    onClick={() => onDelete(memory.id)}
                                    className="absolute top-3 right-3 w-7 h-7 rounded-full
                                             bg-red-500/0 hover:bg-red-500/80 
                                             flex items-center justify-center
                                             opacity-0 group-hover:opacity-100 transition-all duration-200"
                                    title="Delete memory"
                                >
                                    <svg className="w-4 h-4 text-white/60 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>

                                {/* Author & Date */}
                                <div className="flex items-center gap-2 mb-3">
                                    <span
                                        className={`px-2.5 py-1 rounded-full text-xs font-sans font-medium
                                            ${memory.author === "Ayushman"
                                                ? "bg-rose-500/20 text-rose-300"
                                                : "bg-violet-500/20 text-violet-300"
                                            }`}
                                    >
                                        {memory.author}
                                    </span>
                                    <span className="text-white/40 text-xs font-sans">
                                        {formatDate(memory.date)}
                                    </span>
                                </div>

                                {/* Memory Text */}
                                <p className="text-white/80 font-sans text-sm leading-relaxed">
                                    {memory.text}
                                </p>

                                {/* Inline Images Grid */}
                                {memoryImages.length > 0 && (
                                    <div className={`mt-3 grid gap-2 ${memoryImages.length === 1 ? 'grid-cols-1' : memoryImages.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                                        {memoryImages.map((img, idx) => (
                                            <div
                                                key={idx}
                                                className="rounded-lg overflow-hidden bg-black/20 cursor-pointer"
                                                onClick={() => {
                                                    // Find this image in allImages and open lightbox
                                                    const globalIndex = allImages.findIndex(ai => ai.url === img.url);
                                                    if (onImageClick && globalIndex >= 0) {
                                                        onImageClick(allImages, globalIndex);
                                                    }
                                                }}
                                            >
                                                <img
                                                    src={img.url}
                                                    alt="Memory"
                                                    className="w-full h-32 object-cover hover:scale-105 transition-transform duration-300"
                                                    loading="lazy"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </div>
    );
}
