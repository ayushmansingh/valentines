import { useState, useEffect, useCallback } from "react";
import { db, storage } from "../firebase";
import {
    collection,
    doc,
    onSnapshot,
    updateDoc,
    arrayUnion,
    arrayRemove,
    setDoc,
    getDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

/**
 * Custom hook for managing memories with Firebase persistence
 * 
 * @returns {Object} - { memories, cityData, addMemory, deleteMemory, getMemoriesForCity, getCitySubtitle, updateCitySubtitle, uploadImage, isLoading }
 */
export function useMemories() {
    const [memories, setMemories] = useState({});
    const [cityData, setCityData] = useState({});
    const [isLoading, setIsLoading] = useState(true);

    // Subscribe to real-time updates from Firestore
    useEffect(() => {
        const unsubscribe = onSnapshot(
            collection(db, "memories"),
            (snapshot) => {
                const newMemories = {};
                const newCityData = {};
                snapshot.forEach((doc) => {
                    const data = doc.data();
                    newMemories[doc.id] = data.items || [];
                    newCityData[doc.id] = {
                        subtitle: data.subtitle || null,
                    };
                });
                setMemories(newMemories);
                setCityData(newCityData);
                setIsLoading(false);
            },
            (error) => {
                console.error("Error fetching memories:", error);
                setIsLoading(false);
            }
        );

        return () => unsubscribe();
    }, []);

    /**
     * Get all memories for a specific city
     * @param {string} cityId - The city identifier
     * @returns {Array} - Array of memory objects
     */
    const getMemoriesForCity = useCallback((cityId) => {
        return memories[cityId] || [];
    }, [memories]);

    /**
     * Get custom subtitle for a city (if set)
     * @param {string} cityId - The city identifier
     * @returns {string|null} - Custom subtitle or null
     */
    const getCitySubtitle = useCallback((cityId) => {
        return cityData[cityId]?.subtitle || null;
    }, [cityData]);

    /**
     * Update custom subtitle for a city
     * @param {string} cityId - The city identifier
     * @param {string} subtitle - The new subtitle
     */
    const updateCitySubtitle = useCallback(async (cityId, subtitle) => {
        const docRef = doc(db, "memories", cityId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            await updateDoc(docRef, { subtitle });
        } else {
            await setDoc(docRef, { items: [], subtitle });
        }
    }, []);

    /**
     * Upload an image to Firebase Storage
     * @param {File} file - The image file to upload
     * @param {string} cityId - The city this image belongs to
     * @returns {Promise<string>} - The download URL
     */
    const uploadImage = useCallback(async (file, cityId) => {
        const timestamp = Date.now();
        const fileName = `${cityId}/${timestamp}_${file.name}`;
        const storageRef = ref(storage, `memories/${fileName}`);

        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);
        return downloadURL;
    }, []);

    /**
     * Add a new memory to a city
     * @param {string} cityId - The city identifier
     * @param {Object} memory - { author, text, imageUrl }
     */
    const addMemory = useCallback(async (cityId, memory) => {
        const newMemory = {
            id: Date.now().toString(),
            ...memory,
            date: new Date().toISOString(),
        };

        const docRef = doc(db, "memories", cityId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            await updateDoc(docRef, {
                items: arrayUnion(newMemory),
            });
        } else {
            await setDoc(docRef, {
                items: [newMemory],
            });
        }
    }, []);

    /**
     * Delete a memory from a city
     * @param {string} cityId - The city identifier
     * @param {string} memoryId - The memory ID to delete
     */
    const deleteMemory = useCallback(async (cityId, memoryId) => {
        const cityMemories = memories[cityId] || [];
        const memoryToDelete = cityMemories.find((m) => m.id === memoryId);

        if (memoryToDelete) {
            const docRef = doc(db, "memories", cityId);
            await updateDoc(docRef, {
                items: arrayRemove(memoryToDelete),
            });
        }
    }, [memories]);

    return {
        memories,
        cityData,
        getMemoriesForCity,
        getCitySubtitle,
        updateCitySubtitle,
        addMemory,
        deleteMemory,
        uploadImage,
        isLoading,
    };
}
