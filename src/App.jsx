import { useState, useCallback, useMemo, useEffect } from "react";
import MapBackground from "./components/MapBackground";
import StoryOverlay from "./components/StoryOverlay";
import DetailModal from "./components/DetailModal";
import TimelineView from "./components/TimelineView";
import ImageLightbox from "./components/ImageLightbox";
import AddCityModal from "./components/AddCityModal";
import AdminDashboard from "./components/admin/AdminDashboard";
import { useCities } from "./hooks/useCities";

/**
 * Main App Component
 * Orchestrates the Map Scrollytelling experience
 * 
 * Key architecture:
 * - Body handles scrolling (no overlay blocking map)
 * - Map is fixed, interactive
 * - Story cards positioned to side, don't block map center
 * - Admin mode enabled via ?admin=true URL param
 */
export default function App() {
  // Check for admin mode via URL param
  const isAdmin = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('admin') === 'true';
  }, []);

  // Use Firebase-backed cities hook
  const { cities, isLoading, addCity, initializeFromStatic } = useCities();

  // Initialize Firebase with static cities if empty (one-time migration)
  useEffect(() => {
    if (!isLoading && cities.length === 0) {
      initializeFromStatic();
    }
  }, [isLoading, cities.length, initializeFromStatic]);

  // Track the currently visible chapter
  const [activeChapter, setActiveChapter] = useState('intro');

  // Explore mode - enables free map interaction
  const [exploreMode, setExploreMode] = useState(false);

  // Selected location for detail modal
  const [selectedLocation, setSelectedLocation] = useState(null);

  // Timeline view state
  const [timelineOpen, setTimelineOpen] = useState(false);

  // Add city modal state
  const [addCityOpen, setAddCityOpen] = useState(false);

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
    const chapter = cities.find(c => c.id === chapterId);
    if (chapter) {
      setSelectedLocation(chapter);
      setActiveChapter(chapterId);
    }
  }, [cities]);

  // Handler to enter explore mode
  const handleEnterExploreMode = useCallback(() => {
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

  // Handler for adding a new city (admin only)
  const handleAddCity = useCallback(async (city, position) => {
    try {
      await addCity(city, position);
    } catch (error) {
      console.error("Failed to add city:", error);
    }
  }, [addCity]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-slate-900 flex items-center justify-center">
        <div className="text-white font-sans text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <>
      {/* Fixed full-screen map background - z-0, always interactive */}
      <MapBackground
        activeChapter={activeChapter}
        chapters={cities}
        exploreMode={exploreMode}
        onMarkerClick={handleMarkerClick}
      >
        {/* AddCityModal inside MapBackground to access APIProvider context */}
        <AddCityModal
          isOpen={addCityOpen}
          onClose={() => setAddCityOpen(false)}
          onAdd={handleAddCity}
          existingCities={cities}
        />
      </MapBackground>

      {/* Scrollable story overlay - uses body scroll, cards don't block map */}
      <StoryOverlay
        chapters={cities}
        onChapterChange={handleChapterChange}
        onEnterExploreMode={handleEnterExploreMode}
        exploreMode={exploreMode}
        isAdmin={isAdmin}
      />

      {/* Detail modal for marker clicks */}
      <DetailModal
        chapter={selectedLocation}
        isOpen={!!selectedLocation}
        onClose={handleCloseModal}
      />

      {/* Timeline button - fixed in corner, mobile-safe positioning */}
      <button
        onClick={() => setTimelineOpen(true)}
        className="fixed bottom-4 left-4 md:bottom-6 md:right-6 md:left-auto z-40 
                 px-3 py-2 md:px-4 md:py-3 rounded-xl
                 bg-gradient-to-r from-rose-500/80 to-violet-500/80 backdrop-blur-sm
                 text-white font-sans text-xs md:text-sm font-medium
                 border border-white/20 shadow-lg
                 hover:from-rose-500 hover:to-violet-500 
                 hover:scale-105 active:scale-95 transition-all duration-200
                 flex items-center gap-2"
        style={{ marginBottom: "env(safe-area-inset-bottom, 0)" }}
      >
        <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="hidden sm:inline">Our Timeline</span>
        <span className="sm:hidden">Timeline</span>
      </button>

      {/* Admin: Dashboard */}
      {isAdmin && (
        <AdminDashboard onAddCity={() => setAddCityOpen(true)} />
      )}



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

      {/* Admin mode indicator */}
      {isAdmin && (
        <div className="fixed top-4 left-4 z-50 px-3 py-1.5 rounded-full
                      bg-amber-500/90 text-amber-900 text-xs font-sans font-semibold
                      shadow-lg">
          Admin Mode
        </div>
      )}
    </>
  );
}
