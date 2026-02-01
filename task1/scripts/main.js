import { initMap } from './T1_map.js'; 
import { initFuelChart } from './T2_fuelChart.js'; 
import { initTimeline } from './T3_timeline.js';

let state = {
    geoData: null,
    plantData: null,
    
    // Component Controllers
    mapControl: null,
    fuelControl: null,
    
    // Filter State
    selectedFuel: null,
    selectedYearRange: null
};

Promise.all([
    d3.json("data/world.geojson"),
    d3.json("data/power_plants.json")
]).then(([geoData, plantData]) => {
    state.geoData = geoData;
    state.plantData = plantData;

    console.log("Data loaded");

    // initializing components

    // map
    state.mapControl = initMap(state.geoData, state.plantData);

    // fuel chart
    state.fuelControl = initFuelChart(state.plantData, (fuel) => {
        // Callback when a fuel bubble is clicked
        state.selectedFuel = fuel;
        updateGlobalState();
    });

    // timeline
    initTimeline(state.plantData, (range) => {
        // Callback when brush changes
        state.selectedYearRange = range;
        updateGlobalState();
    });

    // updating logic    
    function updateGlobalState() {
        // Starting with full dataset
        let filteredData = state.plantData;

        // Applying Fuel Filter
        if (state.selectedFuel) {
            filteredData = filteredData.filter(d => d.primary_fuel === state.selectedFuel);
        }

        // Applying Time Filter
        if (state.selectedYearRange) {
            const [minYear, maxYear] = state.selectedYearRange;
            filteredData = filteredData.filter(d => 
                d.commissioning_year >= minYear && d.commissioning_year <= maxYear
            );
        }

        console.log(`Filtered Data: ${filteredData.length} plants`);

        // Updating the Linked Views
        state.mapControl.update(filteredData);
        state.fuelControl.update(filteredData);
        
    }

}).catch(error => {
    console.error("Error loading data:", error);
});