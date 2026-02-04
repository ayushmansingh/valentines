import { useState } from "react";
import { useMusic } from "../../hooks/useMusic";
import { motion, AnimatePresence } from "framer-motion";

export default function MusicManager() {
    const {
        groups,
        library,
        isLoading,
        createGroup,
        deleteGroup,
        uploadTrack,
        deleteTrack,
        assignTrackToGroup
    } = useMusic();

    const [newGroupName, setNewGroupName] = useState("");
    const [isUploading, setIsUploading] = useState(false);

    // Group creation handler
    const handleCreateGroup = async (e) => {
        e.preventDefault();
        if (!newGroupName.trim()) return;
        await createGroup(newGroupName, "");
        setNewGroupName("");
    };

    // File upload handler
    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsUploading(true);
        try {
            await uploadTrack(file);
        } catch (error) {
            alert("Upload failed!");
        }
        setIsUploading(false);
    };

    if (isLoading) return <div className="text-white">Loading music data...</div>;

    return (
        <div className="space-y-8">
            {/* --- Music Groups Section --- */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/10">
                <h3 className="text-xl font-bold text-white mb-4">🎵 Music Groups</h3>

                {/* Create Group Form */}
                <form onSubmit={handleCreateGroup} className="flex gap-2 mb-6">
                    <input
                        type="text"
                        placeholder="New Group Name (e.g. 'Upbeat Travel')"
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                        className="flex-1 bg-black/40 text-white rounded-lg px-4 py-2 border border-white/20 focus:outline-none focus:border-cyan-400"
                    />
                    <button
                        type="submit"
                        className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold px-4 py-2 rounded-lg transition-colors"
                    >
                        Create
                    </button>
                </form>

                {/* Groups List */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {groups.map(group => (
                        <div key={group.id} className="relative group bg-black/40 p-4 rounded-lg border border-white/10">
                            <h4 className="text-white font-medium">{group.name}</h4>
                            <p className="text-xs text-white/50">
                                {library.filter(t => t.musicGroupId === group.id).length} tracks
                            </p>
                            <button
                                onClick={() => {
                                    if (confirm('Delete this group?')) deleteGroup(group.id);
                                }}
                                className="absolute top-2 right-2 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* --- Music Library Section --- */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/10">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-white">📂 Music Library</h3>
                    <div className="relative overflow-hidden">
                        <button className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2">
                            {isUploading ? "Uploading..." : "⬆ Upload MP3"}
                        </button>
                        <input
                            type="file"
                            accept="audio/*"
                            onChange={handleFileUpload}
                            disabled={isUploading}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    {library.map(track => (
                        <div key={track.id} className="flex items-center gap-3 bg-black/20 p-3 rounded-lg border border-white/5 hover:bg-black/40 transition-colors">
                            <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400">
                                ♪
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">{track.title}</p>
                                <a href={track.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-300 hover:text-blue-200">
                                    Preview
                                </a>
                            </div>

                            {/* Group Assignment Dropdown */}
                            <select
                                value={track.musicGroupId || ""}
                                onChange={(e) => assignTrackToGroup(track.id, e.target.value)}
                                className="bg-black/40 text-white text-xs rounded px-2 py-1 border border-white/20 focus:outline-none"
                            >
                                <option value="">Unassigned</option>
                                {groups.map(g => (
                                    <option key={g.id} value={g.id}>{g.name}</option>
                                ))}
                            </select>

                            <button
                                onClick={() => {
                                    if (confirm('Delete track?')) deleteTrack(track.id, track.storagePath);
                                }}
                                className="text-white/40 hover:text-red-400 px-2"
                            >
                                🗑
                            </button>
                        </div>
                    ))}
                    {library.length === 0 && (
                        <p className="text-white/40 text-center py-8">No tracks yet. Upload one!</p>
                    )}
                </div>
            </div>
        </div>
    );
}
