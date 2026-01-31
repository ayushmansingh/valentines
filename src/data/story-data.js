/**
 * Story Data Configuration
 * 
 * Each chapter has:
 * - id: Unique identifier
 * - title: Main heading
 * - subtitle: Secondary heading (optional)
 * - content: Body text
 * - location: { lat, lng, zoom } - zoom 10-12 for city-level view
 * - image: Image URL for the detail modal
 */

export const chapters = [
    {
        id: "allahabad",
        title: "Allahabad",
        subtitle: "The City of Offerings",
        location: { lat: 25.4358, lng: 81.8463, zoom: 12 },
    },
    {
        id: "lille",
        title: "Lille",
        subtitle: "France's Northern Jewel",
        location: { lat: 50.6292, lng: 3.0573, zoom: 12 },
    },
    {
        id: "brugge",
        title: "Brugge",
        subtitle: "The Venice of the North",
        location: { lat: 51.2093, lng: 3.2247, zoom: 13 },
    },
    {
        id: "naples",
        title: "Naples",
        subtitle: "Soul of Italy",
        location: { lat: 40.8518, lng: 14.2681, zoom: 12 },
    },
    {
        id: "venice",
        title: "Venice",
        subtitle: "City of Canals",
        location: { lat: 45.4408, lng: 12.3155, zoom: 13 },
    },
    {
        id: "verona",
        title: "Verona",
        subtitle: "City of Love",
        location: { lat: 45.4384, lng: 10.9916, zoom: 13 },
    },
    {
        id: "koln",
        title: "Koln",
        subtitle: "The Cathedral City",
        location: { lat: 50.9375, lng: 6.9603, zoom: 12 },
    },
    {
        id: "hamburg",
        title: "Hamburg",
        subtitle: "Gateway to the World",
        location: { lat: 53.5511, lng: 9.9937, zoom: 11 },
    },
    {
        id: "copenhagen",
        title: "Copenhagen",
        subtitle: "City of Spires",
        location: { lat: 55.6761, lng: 12.5683, zoom: 12 },
    },
    {
        id: "malmo",
        title: "Malmo",
        subtitle: "Sweden's Southern Hub",
        location: { lat: 55.6049, lng: 13.0038, zoom: 12 },
    },
    {
        id: "vienna",
        title: "Vienna",
        subtitle: "City of Music",
        location: { lat: 48.2082, lng: 16.3738, zoom: 11 },
    },
    {
        id: "hallstatt",
        title: "Hallstatt",
        subtitle: "Austria's Ancient Salt Mine Village",
        location: { lat: 47.5622, lng: 13.6493, zoom: 14 },
    },
    {
        id: "salzburg",
        title: "Salzburg",
        subtitle: "Stage of the World",
        location: { lat: 47.8095, lng: 13.0550, zoom: 12 },
    },
    {
        id: "budapest",
        title: "Budapest",
        subtitle: "Pearl of the Danube",
        location: { lat: 47.4979, lng: 19.0402, zoom: 12 },
    },
    {
        id: "bratislava",
        title: "Bratislava",
        subtitle: "Beauty on the Danube",
        location: { lat: 48.1486, lng: 17.1077, zoom: 13 },
    },
    {
        id: "basel",
        title: "Basel",
        subtitle: "Switzerland's Cultural Capital",
        location: { lat: 47.5596, lng: 7.5886, zoom: 13 },
    },
    {
        id: "strasbourg",
        title: "Strasbourg",
        subtitle: "Capital of Christmas",
        location: { lat: 48.5734, lng: 7.7521, zoom: 12 },
    },
    {
        id: "bangalore",
        title: "Bangalore",
        subtitle: "The Silicon Valley of India",
        location: { lat: 12.9716, lng: 77.5946, zoom: 12 },
    },
    {
        id: "coorg",
        title: "Coorg",
        subtitle: "The Scotland of India",
        location: { lat: 12.4244, lng: 75.7382, zoom: 12 },
    },
    {
        id: "ooty",
        title: "Ooty",
        subtitle: "Queen of Hill Stations",
        location: { lat: 11.4102, lng: 76.6950, zoom: 13 },
    },
];

/**
 * Intro section configuration
 */
export const introSection = {
    title: "A Journey Across Continents",
    subtitle: "Scroll to explore the story, or click markers on the map",
};

/**
 * Outro section configuration
 */
export const outroSection = {
    title: "Explore Freely",
    subtitle: "To marking more cities on this map, just you and me. For now you can explore",
    buttonText: "Enter Explore Mode",
};
