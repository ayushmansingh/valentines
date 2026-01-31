import { useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { introSection, outroSection } from "../data/story-data";

/**
 * Individual story section for scroll-snap
 * Uses pointer-events-none so map is clickable through empty areas
 */
function StorySection({ chapter, index, onVisible }) {
    const sectionRef = useRef(null);

    useEffect(() => {
        const section = sectionRef.current;
        if (!section) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
                        console.log("Section visible:", chapter.id);
                        onVisible(chapter.id);
                    }
                });
            },
            {
                threshold: [0.5],
                rootMargin: "-10% 0px -10% 0px",
            }
        );

        observer.observe(section);
        return () => observer.disconnect();
    }, [chapter.id, onVisible]);

    return (
        <section
            ref={sectionRef}
            data-chapter={chapter.id}
            className="story-section"
        >
            {/* Card positioned to the right, clickable */}
            <motion.div
                initial={{ opacity: 0, y: 40, x: 20 }}
                whileInView={{ opacity: 1, y: 0, x: 0 }}
                exit={{ opacity: 0, y: -20 }}
                viewport={{ once: false, amount: 0.3 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="story-card glass-dark rounded-2xl overflow-hidden shadow-2xl"
            >
                <div className="p-6">
                    {/* Chapter indicator */}
                    <div className="flex items-center gap-3 mb-3">
                        <span className="h-px w-6 bg-white/40" />
                        <span className="text-xs font-sans font-medium text-white/50 uppercase tracking-widest">
                            Chapter {index + 1}
                        </span>
                    </div>

                    {/* Title */}
                    <h2 className="font-serif text-2xl md:text-3xl font-semibold text-white mb-1 leading-tight">
                        {chapter.title}
                    </h2>

                    {/* Subtitle */}
                    {chapter.subtitle && (
                        <p className="font-serif italic text-base text-white/60 mb-3">
                            {chapter.subtitle}
                        </p>
                    )}

                    {/* Hint */}
                    <p className="text-sm font-sans text-white/40">
                        Click the marker on the map to add or see memories
                    </p>
                </div>
            </motion.div>
        </section>
    );
}

/**
 * Intro section - centered, allows clicks through
 */
function IntroSection({ onVisible }) {
    const sectionRef = useRef(null);

    useEffect(() => {
        const section = sectionRef.current;
        if (!section) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
                        onVisible();
                    }
                });
            },
            { threshold: [0.5] }
        );

        observer.observe(section);
        return () => observer.disconnect();
    }, [onVisible]);

    return (
        <section ref={sectionRef} className="story-section story-section--intro">
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                className="story-card story-card--intro glass-dark rounded-2xl text-center p-8 md:p-12"
            >
                <h1 className="font-serif text-2xl md:text-3xl lg:text-4xl font-semibold text-white mb-4 leading-tight">
                    {introSection.title}
                </h1>
                <p className="font-sans text-base md:text-lg text-white/70 mb-4">
                    {introSection.subtitle}
                </p>
                <p className="font-sans text-sm text-white/50 mb-10">
                    Click on the markers to see and add memories
                </p>

                {/* Scroll indicator */}
                <motion.div
                    animate={{ y: [0, 8, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="flex flex-col items-center gap-2"
                >
                    <div className="w-5 h-8 rounded-full border border-white/30 flex items-start justify-center p-1">
                        <motion.div
                            animate={{ y: [0, 10, 0] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            className="w-1 h-1 rounded-full bg-white/50"
                        />
                    </div>
                    <span className="text-xs font-sans text-white/30 uppercase tracking-widest">
                        Scroll
                    </span>
                </motion.div>
            </motion.div>
        </section>
    );
}

/**
 * Outro section
 */
function OutroSection({ onEnterExploreMode, exploreMode }) {
    return (
        <section className="story-section story-section--outro">
            <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8 }}
                className="story-card story-card--outro glass-dark rounded-2xl text-center p-8 md:p-12"
            >
                <h2 className="font-serif text-2xl md:text-3xl font-semibold text-white mb-3">
                    {outroSection.title}
                </h2>
                <p className="font-sans text-base text-white/70 mb-8">
                    {outroSection.subtitle}
                </p>

                {!exploreMode && (
                    <motion.button
                        onClick={onEnterExploreMode}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="px-6 py-3 rounded-full bg-white text-slate-900 font-sans font-medium
                       shadow-lg shadow-white/20 hover:shadow-xl hover:shadow-white/30
                       transition-all duration-300"
                    >
                        {outroSection.buttonText}
                    </motion.button>
                )}

                {exploreMode && (
                    <div className="flex items-center justify-center gap-2 text-green-400">
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                        <span className="font-sans text-sm">Explore mode active!</span>
                    </div>
                )}
            </motion.div>
        </section>
    );
}

/**
 * Main StoryOverlay component
 * Sections use pointer-events-none so map clicks pass through
 * Only cards have pointer-events-auto
 */
export default function StoryOverlay({
    chapters,
    onChapterChange,
    onEnterExploreMode,
    exploreMode
}) {
    const handleVisible = useCallback((chapterId) => {
        if (chapterId) {
            onChapterChange(chapterId);
        }
    }, [onChapterChange]);

    const handleIntroVisible = useCallback(() => {
        if (chapters.length > 0) {
            onChapterChange(chapters[0].id);
        }
    }, [chapters, onChapterChange]);

    // The key insight: this div is NOT a scroll container
    // It just holds the sections, body handles scroll
    // pointer-events: none allows map/marker clicks through
    return (
        <div className="relative z-10" style={{ pointerEvents: "none" }}>
            {/* Intro */}
            <IntroSection onVisible={handleIntroVisible} />

            {/* Story chapters */}
            {chapters.map((chapter, index) => (
                <StorySection
                    key={chapter.id}
                    chapter={chapter}
                    index={index}
                    onVisible={handleVisible}
                />
            ))}

            {/* Outro with explore button */}
            <OutroSection
                onEnterExploreMode={onEnterExploreMode}
                exploreMode={exploreMode}
            />
        </div>
    );
}
