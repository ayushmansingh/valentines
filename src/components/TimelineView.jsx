import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMemories } from "../hooks/useMemories";
import { chapters } from "../data/story-data";

/**
 * Timeline View Component
 * Shows all memories across all cities in chronological order
 */
export default function TimelineView({ isOpen, onClose, onImageClick }) {
    const { memories } = useMemories();

    // Lock body scroll when open
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

    // Get city name by ID
    const getCityName = (cityId) => {
        const chapter = chapters.find((c) => c.id === cityId);
        return chapter?.title || cityId;
    };

    // Helper to get all images from a memory
    const getMemoryImages = (memory) => {
        const images = [];
        if (memory.imageUrls && Array.isArray(memory.imageUrls)) {
            memory.imageUrls.forEach((url) => {
                images.push({ url, author: memory.author, memoryId: memory.id });
            });
        }
        if (memory.imageUrl) {
            images.push({ url: memory.imageUrl, author: memory.author, memoryId: memory.id });
        }
        return images;
    };

    // Flatten all memories with city info and sort by date
    const allMemories = Object.entries(memories)
        .flatMap(([cityId, cityMemories]) =>
            cityMemories.map((memory) => ({
                ...memory,
                cityId,
                cityName: getCityName(cityId),
                images: getMemoryImages(memory),
            }))
        )
        .sort((a, b) => new Date(b.date) - new Date(a.date)); // Newest first

    // Group by month/year
    const groupedMemories = allMemories.reduce((groups, memory) => {
        const date = new Date(memory.date);
        const monthYear = date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
        if (!groups[monthYear]) {
            groups[monthYear] = [];
        }
        groups[monthYear].push(memory);
        return groups;
    }, {});

    // Collect all images for lightbox
    const allImages = allMemories.flatMap((m) => m.images.map((img, idx) => ({
        ...img,
        id: `${m.id}-${idx}`,
    })));

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
        });
    };

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
                        className="fixed inset-0 bg-black/80 backdrop-blur-md z-[90]"
                    />

                    {/* Panel */}
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed inset-y-0 right-0 w-full md:max-w-lg bg-slate-900/95 backdrop-blur-xl z-[91]
                                 border-l border-white/10 shadow-2xl overflow-hidden flex flex-col"
                        style={{ paddingBottom: "env(safe-area-inset-bottom, 0)" }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-white/10">
                            <div>
                                <h2 className="font-serif text-xl text-white">Our Timeline</h2>
                                <p className="text-sm text-white/50 font-sans">
                                    {allMemories.length} memories across {Object.keys(memories).length} cities
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center
                                         text-white/70 hover:text-white hover:bg-white/20 transition-all"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-6">
                            {allMemories.length === 0 ? (
                                <div className="text-center py-12">
                                    <svg className="w-16 h-16 mx-auto mb-4 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p className="text-white/40 font-sans">No memories yet</p>
                                    <p className="text-white/30 font-sans text-sm mt-1">
                                        Click on a marker to add your first memory
                                    </p>
                                </div>
                            ) : (
                                Object.entries(groupedMemories).map(([monthYear, monthMemories]) => (
                                    <div key={monthYear}>
                                        {/* Month Header */}
                                        <div className="sticky top-0 bg-slate-900/80 backdrop-blur-sm py-2 z-10">
                                            <h3 className="text-sm font-sans text-white/50 uppercase tracking-wider">
                                                {monthYear}
                                            </h3>
                                        </div>

                                        {/* Memories for this month */}
                                        <div className="space-y-3 mt-2">
                                            {monthMemories.map((memory) => (
                                                <motion.div
                                                    key={memory.id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="bg-white/5 rounded-xl p-3 border border-white/10"
                                                >
                                                    {/* Header */}
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span
                                                            className={`px-2 py-0.5 rounded-full text-xs font-sans font-medium
                                                                ${memory.author === "Ayushman"
                                                                    ? "bg-rose-500/20 text-rose-300"
                                                                    : "bg-violet-500/20 text-violet-300"
                                                                }`}
                                                        >
                                                            {memory.author}
                                                        </span>
                                                        <span className="text-white/80 text-sm font-sans font-medium">
                                                            {memory.cityName}
                                                        </span>
                                                        <span className="text-white/40 text-xs font-sans ml-auto">
                                                            {formatDate(memory.date)}
                                                        </span>
                                                    </div>

                                                    {/* Text */}
                                                    <p className="text-white/70 font-sans text-sm line-clamp-2">
                                                        {memory.text}
                                                    </p>

                                                    {/* Images */}
                                                    {memory.images.length > 0 && (
                                                        <div className="flex gap-1 mt-2 overflow-x-auto">
                                                            {memory.images.map((img, idx) => (
                                                                <div
                                                                    key={idx}
                                                                    className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden cursor-pointer"
                                                                    onClick={() => {
                                                                        const globalIndex = allImages.findIndex(ai => ai.url === img.url);
                                                                        if (onImageClick && globalIndex >= 0) {
                                                                            onImageClick(allImages, globalIndex);
                                                                        }
                                                                    }}
                                                                >
                                                                    <img
                                                                        src={img.url}
                                                                        alt=""
                                                                        className="w-full h-full object-cover hover:scale-110 transition-transform"
                                                                    />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
