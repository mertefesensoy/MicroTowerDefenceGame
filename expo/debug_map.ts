import { createDefaultDefinitions } from './src/core/definitions/GameDefinitions';

try {
    console.log("Creating definitions...");
    const defs = createDefaultDefinitions();
    console.log("Definitions created.");
    console.log("Maps defined?", !!defs.maps);
    if (defs.maps) {
        console.log("Maps count:", defs.maps.maps.length);
        const m = defs.maps.map("default");
        console.log("Found map 'default'?", !!m);
        if (m) console.log("Map ID:", m.id);
    }
} catch (e) {
    console.error("Error:", e);
}
