import { motion } from "framer-motion";

/**
 * Custom location marker component
 * Glassmorphism floating label design (no pin icon)
 */
export default function LocationMarker({ chapter, isActive, onClick }) {
    return (
        <motion.div
            onClick={() => onClick(chapter.id)}
            className="cursor-pointer relative"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
        >
            {/* Pulse ring for active marker */}
            {isActive && (
                <motion.div
                    className="absolute inset-0 flex items-center justify-center"
                    initial={{ scale: 1, opacity: 0.6 }}
                    animate={{ scale: 2, opacity: 0 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
                >
                    <div className="w-full h-full rounded-xl bg-white/30" />
                </motion.div>
            )}

            {/* Glassmorphism floating label */}
            <div
                className={`
                    relative px-4 py-2.5 rounded-xl
                    shadow-lg transition-all duration-300
                    ${isActive
                        ? "bg-white/95 backdrop-blur-md shadow-white/20"
                        : "bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20"
                    }
                `}
                style={{
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
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
                    {chapter.title}
                </span>

                {/* Subtle location dot */}
                <div
                    className={`
                        absolute -bottom-1 left-1/2 -translate-x-1/2
                        w-2 h-2 rounded-full
                        transition-all duration-300
                        ${isActive
                            ? "bg-rose-500 shadow-lg shadow-rose-500/50"
                            : "bg-white/60"
                        }
                    `}
                />
            </div>
        </motion.div>
    );
}
