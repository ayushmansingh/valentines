import { motion, AnimatePresence } from "framer-motion";

/**
 * Memory List Component
 * Displays all memories for a city with images in a gallery format
 */
export default function MemoryList({ memories, onDelete }) {
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

    // Collect all images from memories for gallery view
    const allImages = memories
        .filter((m) => m.imageUrl)
        .map((m) => ({ id: m.id, url: m.imageUrl, author: m.author }));

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
                                transition={{ delay: index * 0.05 }}
                                className="relative rounded-lg overflow-hidden group bg-black/20"
                            >
                                <img
                                    src={img.url}
                                    alt="Memory"
                                    className="w-full h-auto max-h-48 object-contain transition-transform duration-300 group-hover:scale-105"
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
                    {memories.map((memory) => (
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

                            {/* Inline Image (full) */}
                            {memory.imageUrl && (
                                <div className="mt-3 rounded-lg overflow-hidden bg-black/20">
                                    <img
                                        src={memory.imageUrl}
                                        alt="Memory"
                                        className="w-full h-auto max-h-64 object-contain"
                                        loading="lazy"
                                    />
                                </div>
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}
