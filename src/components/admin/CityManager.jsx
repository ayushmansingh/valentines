import { useState, useEffect } from "react";
import { useCities } from "../../hooks/useCities";
import { useMusic } from "../../hooks/useMusic";
import { Reorder, useDragControls, motion } from "framer-motion";

export default function CityManager() {
    const { cities, reorderCities, updateCity, removeCity } = useCities();
    const { groups } = useMusic();
    const [items, setItems] = useState([]);

    // Sync local items with cities from hook
    useEffect(() => {
        setItems(cities);
    }, [cities]);

    // Handle reorder
    const handleReorder = (newOrder) => {
        setItems(newOrder);
    };

    // Save order when drag ends
    const handleDragEnd = () => {
        // Compare if order actually changed to avoid unnecessary writes
        const currentIds = cities.map(c => c.id).join(',');
        const newIds = items.map(c => c.id).join(',');

        if (currentIds !== newIds) {
            reorderCities(items);
        }
    };

    return (
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/10">
            <h3 className="text-xl font-bold text-white mb-4">🏙️ Manage Cities</h3>
            <p className="text-white/50 text-sm mb-4">Drag to reorder. Changes save automatically.</p>

            <Reorder.Group
                axis="y"
                values={items}
                onReorder={handleReorder}
                className="space-y-2"
            >
                {items.map((city) => (
                    <CityItem
                        key={city.id}
                        city={city}
                        groups={groups}
                        updateCity={updateCity}
                        removeCity={removeCity}
                        onDragEnd={handleDragEnd}
                    />
                ))}
            </Reorder.Group>
        </div>
    );
}

function CityItem({ city, groups, updateCity, removeCity, onDragEnd }) {
    const controls = useDragControls();

    return (
        <Reorder.Item
            value={city}
            dragListener={false}
            dragControls={controls}
            onDragEnd={onDragEnd}
            className="bg-black/40 p-3 rounded-lg border border-white/10 flex items-center gap-4 group"
        >
            {/* Drag Handle */}
            <div
                onPointerDown={(e) => controls.start(e)}
                className="cursor-move text-white/30 hover:text-white p-1"
            >
                ☰
            </div>

            {/* City Info */}
            <div className="flex-1 min-w-0">
                <div className="font-bold text-white truncate">{city.title}</div>
                <div className="text-xs text-white/50 truncate">{city.subtitle}</div>
            </div>

            {/* Music Group Selector */}
            <select
                value={city.musicGroupId || ""}
                onChange={(e) => updateCity(city.id, { musicGroupId: e.target.value })}
                className="bg-black/40 text-white text-xs rounded px-2 py-1 border border-white/20 focus:outline-none max-w-[120px]"
            >
                <option value="">No Music</option>
                {groups.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                ))}
            </select>

            {/* Delete Button */}
            <button
                onClick={() => {
                    if (confirm(`Delete ${city.title}?`)) removeCity(city.id);
                }}
                className="text-white/20 hover:text-red-400 transition-colors"
            >
                🗑
            </button>
        </Reorder.Item>
    );
}
