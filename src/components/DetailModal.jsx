import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMemories } from "../hooks/useMemories";
import MemoryForm from "./MemoryForm";
import MemoryList from "./MemoryList";
import ImageLightbox from "./ImageLightbox";

/**
 * Detail Modal Component
 * Opens when a location marker is clicked
 * Shows full photo, text content, and memories
 */
export default function DetailModal({ chapter, isOpen, onClose }) {
    const [showForm, setShowForm] = useState(false);
    const [isEditingSubtitle, setIsEditingSubtitle] = useState(false);
    const [subtitleInput, setSubtitleInput] = useState("");
    const [lightboxImages, setLightboxImages] = useState([]);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const {
        getMemoriesForCity,
        getCitySubtitle,
        updateCitySubtitle,
        addMemory,
        deleteMemory,
        uploadImagesWithGps,
        isLoading
    } = useMemories();

    // Lock body scroll when modal is open
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

    if (!chapter) return null;

    const memories = getMemoriesForCity(chapter.id);
    const customSubtitle = getCitySubtitle(chapter.id);
    const displaySubtitle = customSubtitle || chapter.subtitle;

    const handleAddMemory = async (memory) => {
        await addMemory(chapter.id, memory);
        setShowForm(false);
    };

    const handleDeleteMemory = async (memoryId) => {
        await deleteMemory(chapter.id, memoryId);
    };

    const handleEditSubtitle = () => {
        setSubtitleInput(displaySubtitle || "");
        setIsEditingSubtitle(true);
    };

    const handleSaveSubtitle = async () => {
        await updateCitySubtitle(chapter.id, subtitleInput.trim());
        setIsEditingSubtitle(false);
    };

    const handleCancelSubtitleEdit = () => {
        setIsEditingSubtitle(false);
        setSubtitleInput("");
    };

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={onClose}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                        />

                        {/* Modal */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="fixed inset-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 
                       md:w-full md:max-w-2xl md:max-h-[90vh]
                       bg-slate-900/95 backdrop-blur-xl md:rounded-2xl overflow-hidden
                       shadow-2xl shadow-black/50 border-0 md:border md:border-white/10
                       z-50 flex flex-col"
                            style={{ paddingBottom: "env(safe-area-inset-bottom, 0)" }}
                        >
                            {/* Close button */}
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full
                         bg-black/50 backdrop-blur-sm border border-white/20
                         flex items-center justify-center
                         text-white/80 hover:text-white hover:bg-black/70
                         transition-all duration-200"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>

                            {/* Scrollable Content */}
                            <div className="overflow-y-auto flex-1">
                                {/* Image */}
                                {chapter.image && (
                                    <div className="relative w-full h-48 md:h-64 overflow-hidden flex-shrink-0">
                                        <img
                                            src={chapter.image}
                                            alt={chapter.title}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
                                    </div>
                                )}

                                {/* Content */}
                                <div className="p-6 md:p-8">
                                    {/* Location tag */}
                                    <div className="flex items-center gap-2 mb-4">
                                        <span className="h-px w-8 bg-white/40" />
                                        <span className="text-xs font-sans font-medium text-white/60 uppercase tracking-widest">
                                            {chapter.location.lat.toFixed(2)}°N, {Math.abs(chapter.location.lng).toFixed(2)}°
                                            {chapter.location.lng >= 0 ? "E" : "W"}
                                        </span>
                                    </div>

                                    {/* Title */}
                                    <h2 className="font-serif text-3xl md:text-4xl font-semibold text-white mb-2 leading-tight">
                                        {chapter.title}
                                    </h2>

                                    {/* Editable Subtitle */}
                                    {isEditingSubtitle ? (
                                        <div className="mb-6 space-y-2">
                                            <input
                                                type="text"
                                                value={subtitleInput}
                                                onChange={(e) => setSubtitleInput(e.target.value)}
                                                placeholder="Enter your own subtitle..."
                                                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 
                                                     text-white font-serif italic text-lg
                                                     focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                                                autoFocus
                                            />
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={handleSaveSubtitle}
                                                    className="px-3 py-1.5 rounded-lg bg-rose-500/80 text-white text-sm 
                                                         hover:bg-rose-600 transition-colors"
                                                >
                                                    Save
                                                </button>
                                                <button
                                                    onClick={handleCancelSubtitleEdit}
                                                    className="px-3 py-1.5 rounded-lg bg-white/10 text-white/70 text-sm 
                                                         hover:bg-white/20 transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="group flex items-center gap-2 mb-6">
                                            <p className="font-serif italic text-lg md:text-xl text-white/70">
                                                {displaySubtitle || "Add a subtitle..."}
                                            </p>
                                            <button
                                                onClick={handleEditSubtitle}
                                                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-full 
                                                     hover:bg-white/10 transition-all"
                                                title="Edit subtitle"
                                            >
                                                <svg className="w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                </svg>
                                            </button>
                                        </div>
                                    )}

                                    {/* Divider */}
                                    <div className="h-px w-16 bg-gradient-to-r from-white/50 to-transparent mb-6" />

                                    {/* Body content */}
                                    {chapter.content && (
                                        <p className="font-sans text-base md:text-lg text-white/80 leading-relaxed mb-8">
                                            {chapter.content}
                                        </p>
                                    )}

                                    {/* Memories Section */}
                                    <div className="border-t border-white/10 pt-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="font-serif text-xl text-white/90">
                                                Our Memories
                                                {memories.length > 0 && (
                                                    <span className="ml-2 text-sm text-white/40">({memories.length})</span>
                                                )}
                                            </h3>
                                            {!showForm && (
                                                <button
                                                    onClick={() => setShowForm(true)}
                                                    className="px-4 py-2 rounded-full bg-gradient-to-r from-rose-500/20 to-violet-500/20
                                                         text-white/80 font-sans text-sm border border-white/20
                                                         hover:from-rose-500/30 hover:to-violet-500/30 hover:text-white
                                                         transition-all duration-200"
                                                >
                                                    + Add Memory
                                                </button>
                                            )}
                                        </div>

                                        {/* Loading State */}
                                        {isLoading && (
                                            <div className="text-center py-4">
                                                <p className="text-white/50 text-sm">Loading memories...</p>
                                            </div>
                                        )}

                                        {/* Memory Form */}
                                        <AnimatePresence>
                                            {showForm && (
                                                <div className="mb-4">
                                                    <MemoryForm
                                                        onSubmit={handleAddMemory}
                                                        onCancel={() => setShowForm(false)}
                                                        onUploadImagesWithGps={uploadImagesWithGps}
                                                        cityId={chapter.id}
                                                        cityLocation={chapter.location}
                                                    />
                                                </div>
                                            )}
                                        </AnimatePresence>

                                        {/* Memory List */}
                                        {!isLoading && (
                                            <MemoryList
                                                memories={memories}
                                                onDelete={handleDeleteMemory}
                                                onImageClick={(images, index) => {
                                                    setLightboxImages(images);
                                                    setLightboxIndex(index);
                                                    setLightboxOpen(true);
                                                }}
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Image Lightbox */}
            <ImageLightbox
                images={lightboxImages}
                currentIndex={lightboxIndex}
                isOpen={lightboxOpen}
                onClose={() => setLightboxOpen(false)}
                onNavigate={setLightboxIndex}
            />
        </>
    );
}
