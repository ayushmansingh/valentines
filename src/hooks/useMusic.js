import { useState, useEffect, useCallback } from "react";
import { db, storage } from "../firebase";
import {
    collection,
    doc,
    onSnapshot,
    addDoc,
    deleteDoc,
    updateDoc,
    query,
    orderBy
} from "firebase/firestore";
import {
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject
} from "firebase/storage";

/**
 * Custom hook for managing music groups and library
 */
export function useMusic() {
    const [groups, setGroups] = useState([]);
    const [library, setLibrary] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [uploadProgress, setUploadProgress] = useState(0);

    // Subscribe to Music Groups
    useEffect(() => {
        const q = query(collection(db, "music_groups"), orderBy("name"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setGroups(data);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // Subscribe to Music Library
    useEffect(() => {
        const q = query(collection(db, "music_library"), orderBy("title"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setLibrary(data);
        });
        return () => unsubscribe();
    }, []);

    /**
     * Create a new Music Group
     */
    const createGroup = useCallback(async (name, description) => {
        await addDoc(collection(db, "music_groups"), {
            name,
            description,
            createdAt: new Date()
        });
    }, []);

    /**
     * Upload a music file
     */
    const uploadTrack = useCallback(async (file, title, groupId = null) => {
        if (!file) return;

        try {
            const storageRef = ref(storage, `music/${Date.now()}_${file.name}`);

            // Upload
            const snapshot = await uploadBytes(storageRef, file);
            const url = await getDownloadURL(snapshot.ref);

            // Add to Firestore
            await addDoc(collection(db, "music_library"), {
                title: title || file.name,
                url,
                storagePath: snapshot.ref.fullPath,
                musicGroupId: groupId,
                createdAt: new Date(),
                size: file.size,
                type: file.type
            });

            return true;
        } catch (error) {
            console.error("Upload failed:", error);
            throw error;
        }
    }, []);

    /**
     * Delete a track (from Firestore and Storage)
     */
    const deleteTrack = useCallback(async (trackId, storagePath) => {
        try {
            // Delete from Storage
            if (storagePath) {
                const storageRef = ref(storage, storagePath);
                await deleteObject(storageRef);
            }

            // Delete from Firestore
            await deleteDoc(doc(db, "music_library", trackId));
        } catch (error) {
            console.error("Delete failed:", error);
            throw error;
        }
    }, []);

    /**
     * Assign track to a group
     */
    const assignTrackToGroup = useCallback(async (trackId, groupId) => {
        await updateDoc(doc(db, "music_library", trackId), {
            musicGroupId: groupId
        });
    }, []);

    /**
     * Delete a group (and optionally its tracks?)
     * For now, just unassigns tracks
     */
    const deleteGroup = useCallback(async (groupId) => {
        await deleteDoc(doc(db, "music_groups", groupId));
    }, []);

    return {
        groups,
        library,
        isLoading,
        createGroup,
        deleteGroup,
        uploadTrack,
        deleteTrack,
        assignTrackToGroup
    };
}
