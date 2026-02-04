import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CityManager from "./CityManager";
import MusicManager from "./MusicManager";

export default function AdminDashboard({ onAddCity }) {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("cities");

    return (
        <>
            {/* Admin Toggle Button (Floating) */}
            <div className="fixed top-4 right-4 z-50 flex gap-2 items-center">
                <div className="bg-red-500/80 backdrop-blur text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg flex items-center">
                    Admin Mode
                </div>
                <button
                    onClick={() => setIsOpen(true)}
                    className="bg-white text-black px-4 py-2 rounded-full font-bold shadow-lg hover:bg-gray-100 transition-colors flex items-center gap-2"
                >
                    ⚙️ Dashboard
                </button>
            </div>

            {/* Dashboard Modal/Panel */}
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />

                        {/* Panel Content */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-4xl max-h-[85vh] bg-[#1a1a1a] rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-white/10"
                        >
                            {/* Header */}
                            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#222]">
                                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                    🎛️ Admin Dashboard
                                </h2>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="text-white/50 hover:text-white transition-colors"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Tabs */}
                            <div className="flex border-b border-white/10 bg-[#222]">
                                <Tab
                                    label="🏙️ Cities"
                                    isActive={activeTab === "cities"}
                                    onClick={() => setActiveTab("cities")}
                                />
                                <Tab
                                    label="🎵 Music"
                                    isActive={activeTab === "music"}
                                    onClick={() => setActiveTab("music")}
                                />
                            </div>

                            {/* Content Area */}
                            <div className="flex-1 overflow-y-auto p-6 bg-[#1a1a1a]">
                                {activeTab === "cities" ? (
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-center">
                                            <h3 className="text-white font-bold text-lg">City List</h3>
                                            <button
                                                onClick={() => {
                                                    setIsOpen(false); // Close dashboard to show map for adding
                                                    onAddCity();
                                                }}
                                                className="bg-cyan-500 hover:bg-cyan-400 text-black px-4 py-2 rounded-lg font-bold transition-colors flex items-center gap-2"
                                            >
                                                + Add New City
                                            </button>
                                        </div>
                                        <CityManager />
                                    </div>
                                ) : (
                                    <MusicManager />
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}

function Tab({ label, isActive, onClick }) {
    return (
        <button
            onClick={onClick}
            className={`px-6 py-4 font-medium text-sm transition-colors relative ${isActive ? "text-white bg-white/5" : "text-white/50 hover:text-white/80"
                }`}
        >
            {label}
            {isActive && (
                <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-500"
                />
            )}
        </button>
    );
}
