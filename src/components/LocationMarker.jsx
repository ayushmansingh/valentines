import { motion } from "framer-motion";

/**
 * Custom location marker component
 * Styled pin with pulse animation for active state
 */
export default function LocationMarker({ chapter, isActive, onClick }) {
    return (
        <motion.div
            onClick={() => onClick(chapter.id)}
            className="cursor-pointer relative"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
        >
            {/* Pulse ring for active marker */}
            {isActive && (
                <motion.div
                    className="absolute inset-0 flex items-center justify-center"
                    initial={{ scale: 1, opacity: 0.6 }}
                    animate={{ scale: 2.5, opacity: 0 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
                >
                    <div className="w-8 h-8 rounded-full bg-white/30" />
                </motion.div>
            )}

            {/* Marker container */}
            <div
                className={`
          relative flex flex-col items-center
          transition-all duration-300
        `}
            >
                {/* Pin head */}
                <div
                    className={`
            w-10 h-10 rounded-full flex items-center justify-center
            shadow-lg shadow-black/30
            transition-all duration-300
            ${isActive
                            ? "bg-white text-slate-900 scale-110"
                            : "bg-slate-800 text-white border border-white/20 hover:bg-slate-700"
                        }
          `}
                >
                    <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                    </svg>
                </div>

                {/* Pin tail */}
                <div
                    className={`
            w-1 h-4 rounded-b-full
            transition-all duration-300
            ${isActive ? "bg-white" : "bg-slate-700"}
          `}
                />

                {/* Label */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className={`
            absolute -bottom-8 whitespace-nowrap
            px-2 py-1 rounded-md text-xs font-medium
            ${isActive
                            ? "bg-white text-slate-900"
                            : "bg-slate-800/90 text-white/80"
                        }
          `}
                >
                    {chapter.title}
                </motion.div>
            </div>
        </motion.div>
    );
}
