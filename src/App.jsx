import { useState, useCallback } from "react";
import MapBackground from "./components/MapBackground";
import StoryOverlay from "./components/StoryOverlay";
import DetailModal from "./components/DetailModal";
import TimelineView from "./components/TimelineView";
import ImageLightbox from "./components/ImageLightbox";
import { chapters } from "./data/story-data";

/**
 * Main App Component
 * Orchestrates the Map Scrollytelling experience
 * 
 * Key architecture:
 * - Body handles scrolling (no overlay blocking map)
 * - Map is fixed, interactive
 * - Story cards positioned to side, don't block map center
 */
export default function App() {
  // Track the currently visible chapter
  const [activeChapter, setActiveChapter] = useState(chapters[0]?.id || null);

  // Explore mode - enables free map interaction
  const [exploreMode, setExploreMode] = useState(false);

  // Selected location for detail modal
  const [selectedLocation, setSelectedLocation] = useState(null);

  // Timeline view state
  const [timelineOpen, setTimelineOpen] = useState(false);

  // Lightbox state (shared across components)
  const [lightboxImages, setLightboxImages] = useState([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Handler for when a chapter comes into view via scroll
  // Also exits explore mode when scrolling back
  const handleChapterChange = useCallback((chapterId) => {
    // When scrolling back, exit explore mode and resume guided navigation
    if (exploreMode) {
      setExploreMode(false);
    }
    setActiveChapter(chapterId);
  }, [exploreMode]);

  // Handler for marker clicks - opens detail modal
  const handleMarkerClick = useCallback((chapterId) => {
    console.log("[DEBUG] App.handleMarkerClick called with:", chapterId);
    const chapter = chapters.find(c => c.id === chapterId);
    if (chapter) {
      console.log("[DEBUG] Setting selectedLocation:", chapter.title);
      setSelectedLocation(chapter);
      setActiveChapter(chapterId);
    }
  }, []);

  // Handler to enter explore mode
  const handleEnterExploreMode = useCallback(() => {
    console.log("[DEBUG] handleEnterExploreMode called!");
    setExploreMode(true);
  }, []);

  // Handler to close the detail modal
  const handleCloseModal = useCallback(() => {
    setSelectedLocation(null);
  }, []);

  // Handler for opening lightbox from any component
  const handleImageClick = useCallback((images, index) => {
    setLightboxImages(images);
    setLightboxIndex(index);
    setLightboxOpen(true);
  }, []);

  return (
    <>
      {/* Fixed full-screen map background - z-0, always interactive */}
      <MapBackground
        activeChapter={activeChapter}
        chapters={chapters}
        exploreMode={exploreMode}
        onMarkerClick={handleMarkerClick}
      />

      {/* Scrollable story overlay - uses body scroll, cards don't block map */}
      <StoryOverlay
        chapters={chapters}
        onChapterChange={handleChapterChange}
        onEnterExploreMode={handleEnterExploreMode}
        exploreMode={exploreMode}
      />

      {/* Detail modal for marker clicks */}
      <DetailModal
        chapter={selectedLocation}
        isOpen={!!selectedLocation}
        onClose={handleCloseModal}
      />

      {/* Timeline button - fixed in corner */}
      <button
        onClick={() => setTimelineOpen(true)}
        className="fixed bottom-6 right-6 z-40 px-4 py-3 rounded-xl
                 bg-gradient-to-r from-rose-500/80 to-violet-500/80 backdrop-blur-sm
                 text-white font-sans text-sm font-medium
                 border border-white/20 shadow-lg
                 hover:from-rose-500 hover:to-violet-500 
                 hover:scale-105 transition-all duration-200
                 flex items-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Our Timeline
      </button>

      {/* Timeline view */}
      <TimelineView
        isOpen={timelineOpen}
        onClose={() => setTimelineOpen(false)}
        onImageClick={handleImageClick}
      />

      {/* Global image lightbox */}
      <ImageLightbox
        images={lightboxImages}
        currentIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onNavigate={setLightboxIndex}
      />

      {/* Gradient overlays for better text readability */}
      <div className="fixed inset-0 pointer-events-none z-[5]">
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/50 to-transparent" />
      </div>
    </>
  );
}
