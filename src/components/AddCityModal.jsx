import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMapsLibrary } from "@vis.gl/react-google-maps";

/**
 * Add City Modal Component
 * Uses the new Places API (AutocompleteSuggestion) instead of legacy AutocompleteService
 */
export default function AddCityModal({ isOpen, onClose, onAdd, existingCities }) {
    const [searchInput, setSearchInput] = useState("");
    const [selectedPlace, setSelectedPlace] = useState(null);
    const [subtitle, setSubtitle] = useState("");
    const [insertAfter, setInsertAfter] = useState("-1"); // -1 = end, or city id
    const [predictions, setPredictions] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState("");

    const placesLib = useMapsLibrary("places");
    const searchTimeoutRef = useRef(null);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setSearchInput("");
            setSelectedPlace(null);
            setSubtitle("");
            setInsertAfter("-1");
            setPredictions([]);
            setError("");
        }
    }, [isOpen]);

    // Search for places using new Places API
    const handleSearch = useCallback(async (input) => {
        setSearchInput(input);
        setSelectedPlace(null);
        setError("");

        // Clear any pending timeout
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        if (!input || input.length < 2 || !placesLib) {
            setPredictions([]);
            return;
        }

        // Debounce the search
        searchTimeoutRef.current = setTimeout(async () => {
            setIsSearching(true);

            try {
                // Use new Places API - AutocompleteSuggestion
                const { AutocompleteSuggestion } = placesLib;

                if (!AutocompleteSuggestion) {
                    // Fallback to legacy if new API not available
                    console.warn("New Places API not available, trying legacy...");
                    setError("Please enable Places API in Google Cloud Console");
                    setIsSearching(false);
                    return;
                }

                const request = {
                    input,
                    includedPrimaryTypes: ["locality", "administrative_area_level_3"], // Cities
                };

                const { suggestions } = await AutocompleteSuggestion.fetchAutocompleteSuggestions(request);

                if (suggestions && suggestions.length > 0) {
                    setPredictions(suggestions.slice(0, 5));
                } else {
                    setPredictions([]);
                }
            } catch (err) {
                console.error("Autocomplete error:", err);
                setError("Search failed. Please check your API key and enabled APIs.");
                setPredictions([]);
            } finally {
                setIsSearching(false);
            }
        }, 300);
    }, [placesLib]);

    // Select a place from predictions - fetch details using new Places API
    const handleSelectPlace = useCallback(async (suggestion) => {
        if (!placesLib) return;

        try {
            const { Place } = placesLib;

            // Get place details using the suggestion's place
            const placePrediction = suggestion.placePrediction;
            const place = new Place({
                id: placePrediction.placeId,
            });

            await place.fetchFields({ fields: ["displayName", "location", "formattedAddress"] });

            setSelectedPlace({
                name: place.displayName,
                address: place.formattedAddress,
                lat: place.location.lat(),
                lng: place.location.lng(),
            });
            setSearchInput(place.displayName);
            setPredictions([]);
        } catch (err) {
            console.error("Place details error:", err);
            setError("Could not get place details");
        }
    }, [placesLib]);

    // Generate unique ID from city name
    const generateId = (name) => {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");
    };

    // Handle form submission
    const handleSubmit = useCallback((e) => {
        e.preventDefault();
        setError("");

        if (!selectedPlace) {
            setError("Please select a city from the search results");
            return;
        }

        const cityId = generateId(selectedPlace.name);

        // Check for duplicates
        if (existingCities.some((c) => c.id === cityId)) {
            setError("This city already exists in your list");
            return;
        }

        const newCity = {
            id: cityId,
            title: selectedPlace.name,
            subtitle: subtitle || null,
            location: {
                lat: selectedPlace.lat,
                lng: selectedPlace.lng,
                zoom: 12, // Default zoom for city view
            },
        };

        // Calculate position
        let position = -1; // Default: append at end
        if (insertAfter === "0") {
            position = 0; // At beginning
        } else if (insertAfter !== "-1") {
            const afterIndex = existingCities.findIndex((c) => c.id === insertAfter);
            if (afterIndex !== -1) {
                position = afterIndex + 1;
            }
        }

        onAdd(newCity, position);
        onClose();
    }, [selectedPlace, subtitle, insertAfter, existingCities, onAdd, onClose]);

    // Get display text from suggestion
    const getSuggestionText = (suggestion) => {
        const placePrediction = suggestion.placePrediction;
        return {
            main: placePrediction?.mainText?.text || placePrediction?.text?.text || "Unknown",
            secondary: placePrediction?.secondaryText?.text || "",
        };
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100]"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 
                                 md:-translate-x-1/2 md:-translate-y-1/2
                                 md:w-full md:max-w-md
                                 bg-slate-900/95 backdrop-blur-xl rounded-2xl 
                                 overflow-hidden shadow-2xl border border-white/10
                                 z-[101] flex flex-col max-h-[90vh]"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-white/10">
                            <h2 className="font-serif text-xl text-white">Add New City</h2>
                            <button
                                onClick={onClose}
                                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center
                                         text-white/70 hover:text-white hover:bg-white/20 transition-all"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Content */}
                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
                            {/* Search Input */}
                            <div className="relative">
                                <label className="block text-sm text-white/60 font-sans mb-1">
                                    Search for a city
                                </label>
                                <input
                                    type="text"
                                    value={searchInput}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    placeholder="e.g. Paris, Tokyo, New York..."
                                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3
                                             text-white placeholder-white/40 font-sans
                                             focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
                                    autoFocus
                                />

                                {/* Predictions Dropdown */}
                                {predictions.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-1 z-10
                                                  bg-slate-800 border border-white/20 rounded-lg overflow-hidden
                                                  shadow-xl">
                                        {predictions.map((suggestion, idx) => {
                                            const text = getSuggestionText(suggestion);
                                            return (
                                                <button
                                                    key={suggestion.placePrediction?.placeId || idx}
                                                    type="button"
                                                    onClick={() => handleSelectPlace(suggestion)}
                                                    className="w-full px-4 py-3 text-left text-white font-sans
                                                             hover:bg-white/10 transition-colors
                                                             border-b border-white/5 last:border-0"
                                                >
                                                    <div className="font-medium">{text.main}</div>
                                                    <div className="text-sm text-white/50">{text.secondary}</div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}

                                {isSearching && (
                                    <div className="absolute right-3 top-9">
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-cyan-400 
                                                      rounded-full animate-spin" />
                                    </div>
                                )}
                            </div>

                            {/* Selected Place Info */}
                            {selectedPlace && (
                                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                                    <div className="flex items-center gap-2 text-green-400 text-sm font-sans">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        <span>{selectedPlace.name}</span>
                                    </div>
                                    <div className="text-xs text-white/40 mt-1 font-mono">
                                        {selectedPlace.lat.toFixed(4)}, {selectedPlace.lng.toFixed(4)}
                                    </div>
                                </div>
                            )}

                            {/* Subtitle Input */}
                            <div>
                                <label className="block text-sm text-white/60 font-sans mb-1">
                                    Subtitle (optional)
                                </label>
                                <input
                                    type="text"
                                    value={subtitle}
                                    onChange={(e) => setSubtitle(e.target.value)}
                                    placeholder="e.g. City of Love, The Venice of the North..."
                                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3
                                             text-white placeholder-white/40 font-sans
                                             focus:outline-none focus:border-cyan-500/50"
                                />
                            </div>

                            {/* Position Picker */}
                            <div>
                                <label className="block text-sm text-white/60 font-sans mb-1">
                                    Insert position
                                </label>
                                <select
                                    value={insertAfter}
                                    onChange={(e) => setInsertAfter(e.target.value)}
                                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3
                                             text-white font-sans appearance-none cursor-pointer
                                             focus:outline-none focus:border-cyan-500/50"
                                >
                                    <option value="-1" className="bg-slate-800">
                                        At the end
                                    </option>
                                    <option value="0" className="bg-slate-800">
                                        At the beginning
                                    </option>
                                    {existingCities.map((city) => (
                                        <option key={city.id} value={city.id} className="bg-slate-800">
                                            After {city.title}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="text-red-400 text-sm font-sans bg-red-500/10 border border-red-500/30 
                                              rounded-lg p-3">
                                    {error}
                                </div>
                            )}
                        </form>

                        {/* Footer */}
                        <div className="p-4 border-t border-white/10 flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-3 rounded-lg bg-white/10 text-white font-sans
                                         hover:bg-white/20 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={!selectedPlace}
                                className="flex-1 px-4 py-3 rounded-lg bg-cyan-500 text-white font-sans font-medium
                                         hover:bg-cyan-400 transition-colors
                                         disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Add City
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
