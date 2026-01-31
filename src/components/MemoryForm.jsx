import { useState, useRef } from "react";
import { motion } from "framer-motion";

/**
 * Memory Form Component
 * Form to add a new memory with local file upload
 */
export default function MemoryForm({ onSubmit, onCancel, onUploadImage, cityId }) {
    const [author, setAuthor] = useState("Ayushman");
    const [text, setText] = useState("");
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileInputRef = useRef(null);

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            // Create preview URL
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
        }
    };

    const handleRemoveImage = () => {
        setSelectedFile(null);
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!text.trim()) return;

        setIsUploading(true);
        setUploadProgress(10);

        try {
            let imageUrl = null;

            // Upload image if selected
            if (selectedFile) {
                setUploadProgress(30);
                imageUrl = await onUploadImage(selectedFile, cityId);
                setUploadProgress(80);
            }

            await onSubmit({
                author,
                text: text.trim(),
                imageUrl,
            });

            setUploadProgress(100);

            // Reset form
            setText("");
            handleRemoveImage();
        } catch (error) {
            console.error("Error saving memory:", error);
            alert("Failed to save memory. Please try again.");
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
        }
    };

    return (
        <motion.form
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onSubmit={handleSubmit}
            className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 space-y-4"
        >
            <h3 className="font-serif text-lg text-white/90 mb-3">Add a Memory</h3>

            {/* Author Selection */}
            <div className="space-y-2">
                <label className="block text-sm text-white/60 font-sans">Who's adding this?</label>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => setAuthor("Ayushman")}
                        className={`px-4 py-2 rounded-full text-sm font-sans transition-all duration-200
                            ${author === "Ayushman"
                                ? "bg-rose-500/80 text-white"
                                : "bg-white/10 text-white/60 hover:bg-white/20"
                            }`}
                    >
                        Ayushman
                    </button>
                    <button
                        type="button"
                        onClick={() => setAuthor("Dhwani")}
                        className={`px-4 py-2 rounded-full text-sm font-sans transition-all duration-200
                            ${author === "Dhwani"
                                ? "bg-violet-500/80 text-white"
                                : "bg-white/10 text-white/60 hover:bg-white/20"
                            }`}
                    >
                        Dhwani
                    </button>
                </div>
            </div>

            {/* Memory Text */}
            <div className="space-y-2">
                <label className="block text-sm text-white/60 font-sans">What do you remember?</label>
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="That amazing dinner at the little café by the river..."
                    rows={3}
                    className="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-white 
                             placeholder:text-white/30 font-sans text-sm
                             focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-transparent
                             resize-none"
                />
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
                <label className="block text-sm text-white/60 font-sans">
                    Add a Photo <span className="text-white/40">(optional)</span>
                </label>

                {previewUrl ? (
                    <div className="relative rounded-lg overflow-hidden">
                        <img
                            src={previewUrl}
                            alt="Preview"
                            className="w-full max-h-64 object-contain bg-black/20"
                        />
                        <button
                            type="button"
                            onClick={handleRemoveImage}
                            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 
                                     flex items-center justify-center text-white/80 hover:text-white
                                     hover:bg-red-500/80 transition-all"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                ) : (
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center 
                                 cursor-pointer hover:border-white/40 hover:bg-white/5 transition-all"
                    >
                        <svg className="w-8 h-8 mx-auto mb-2 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-sm text-white/40">Click to upload a photo</p>
                    </div>
                )}

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                />
            </div>

            {/* Upload Progress */}
            {isUploading && (
                <div className="space-y-1">
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${uploadProgress}%` }}
                            className="h-full bg-gradient-to-r from-rose-500 to-violet-500"
                        />
                    </div>
                    <p className="text-xs text-white/50 text-center">Uploading...</p>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
                <button
                    type="submit"
                    disabled={!text.trim() || isUploading}
                    className="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-rose-500 to-violet-500 
                             text-white font-sans font-medium text-sm
                             hover:from-rose-600 hover:to-violet-600 transition-all duration-200
                             disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isUploading ? "Saving..." : "Save Memory"}
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={isUploading}
                    className="px-4 py-2.5 rounded-lg bg-white/10 text-white/70 font-sans text-sm
                             hover:bg-white/20 transition-all duration-200
                             disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Cancel
                </button>
            </div>
        </motion.form>
    );
}
