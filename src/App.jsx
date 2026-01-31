import { useState, useCallback, useEffect } from "react";
import MapBackground from "./components/MapBackground";
import StoryOverlay from "./components/StoryOverlay";
import DetailModal from "./components/DetailModal";
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

      {/* Gradient overlays for better text readability */}
      <div className="fixed inset-0 pointer-events-none z-[5]">
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/50 to-transparent" />
      </div>
    </>
  );
}
