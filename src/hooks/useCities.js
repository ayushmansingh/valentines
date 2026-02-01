import { useState, useEffect, useCallback } from "react";
import { db } from "../firebase";
import { doc, onSnapshot, setDoc, getDoc } from "firebase/firestore";
import { chapters as staticChapters } from "../data/story-data";

/**
 * Custom hook for managing cities with Firebase persistence
 * Falls back to static data if Firebase is empty
 */
export function useCities() {
    const [cities, setCities] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isInitialized, setIsInitialized] = useState(false);

    // Subscribe to real-time updates from Firestore
    useEffect(() => {
        const docRef = doc(db, "cities", "list");

        const unsubscribe = onSnapshot(
            docRef,
            (snapshot) => {
                if (snapshot.exists()) {
                    const data = snapshot.data();
                    // Sort by order field
                    const sortedCities = (data.items || []).sort((a, b) => a.order - b.order);
                    setCities(sortedCities);
                    setIsInitialized(true);
                } else {
                    // No data in Firebase, use static chapters
                    setCities(staticChapters);
                }
                setIsLoading(false);
            },
            (error) => {
                console.error("Error fetching cities:", error);
                // Fall back to static data on error
                setCities(staticChapters);
                setIsLoading(false);
            }
        );

        return () => unsubscribe();
    }, []);

    /**
     * Add a new city at a specific position
     * @param {Object} city - { id, title, subtitle, location: { lat, lng, zoom } }
     * @param {number} position - Index to insert at (0 = first, -1 = last)
     */
    const addCity = useCallback(async (city, position = -1) => {
        const docRef = doc(db, "cities", "list");
        const currentCities = [...cities];

        // Validate city has required fields
        if (!city.id || !city.title || !city.location) {
            throw new Error("City must have id, title, and location");
        }

        // Determine insert position
        const insertAt = position === -1 ? currentCities.length : position;

        // Insert city at position
        currentCities.splice(insertAt, 0, city);

        // Recalculate order for all cities
        const updatedCities = currentCities.map((c, idx) => ({
            ...c,
            order: idx,
        }));

        await setDoc(docRef, { items: updatedCities });
    }, [cities]);

    /**
     * Remove a city by ID
     * @param {string} cityId - The city ID to remove
     */
    const removeCity = useCallback(async (cityId) => {
        const docRef = doc(db, "cities", "list");
        const updatedCities = cities
            .filter((c) => c.id !== cityId)
            .map((c, idx) => ({ ...c, order: idx }));

        await setDoc(docRef, { items: updatedCities });
    }, [cities]);

    /**
     * Update a city's data
     * @param {string} cityId - The city ID to update
     * @param {Object} updates - Fields to update
     */
    const updateCity = useCallback(async (cityId, updates) => {
        const docRef = doc(db, "cities", "list");
        const updatedCities = cities.map((c) =>
            c.id === cityId ? { ...c, ...updates } : c
        );

        await setDoc(docRef, { items: updatedCities });
    }, [cities]);

    /**
     * Move a city to a new position
     * @param {string} cityId - The city ID to move
     * @param {number} newPosition - The new index
     */
    const moveCity = useCallback(async (cityId, newPosition) => {
        const docRef = doc(db, "cities", "list");
        const currentCities = [...cities];

        const currentIndex = currentCities.findIndex((c) => c.id === cityId);
        if (currentIndex === -1) return;

        // Remove from current position
        const [city] = currentCities.splice(currentIndex, 1);

        // Insert at new position
        currentCities.splice(newPosition, 0, city);

        // Recalculate order
        const updatedCities = currentCities.map((c, idx) => ({
            ...c,
            order: idx,
        }));

        await setDoc(docRef, { items: updatedCities });
    }, [cities]);

    /**
     * Initialize Firebase with static cities (migration)
     */
    const initializeFromStatic = useCallback(async () => {
        const docRef = doc(db, "cities", "list");
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            const citiesWithOrder = staticChapters.map((c, idx) => ({
                ...c,
                order: idx,
            }));
            await setDoc(docRef, { items: citiesWithOrder });
            return true;
        }
        return false;
    }, []);

    return {
        cities,
        isLoading,
        isInitialized,
        addCity,
        removeCity,
        updateCity,
        moveCity,
        initializeFromStatic,
    };
}
