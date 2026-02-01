// scripts/main.js
// Main controller for Task 2

import { initMotionChart } from './motionChart.js';
import { initChoroplethMap } from './choroplethMap.js';
import { initYearSlider } from './yearSlider.js';
import { initHierarchyChart } from './hierarchyChart.js';

// State
const state = {
    gapminderData: null,
    geoData: null,
    motionChartControl: null,
    choroplethControl: null,
    sliderControl: null
};

// Load data
Promise.all([
    d3.json("data/gapminder.json"),
    d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson")
]).then(([gapminderData, geoData]) => {
    state.gapminderData = gapminderData;
    state.geoData = geoData;

    console.log("Data loaded successfully");
    console.log(`Gapminder records: ${gapminderData.length}`);

    // Initialize all components
    initializeVisualization();

}).catch(error => {
    console.error("Error loading data:", error);
    alert("Error loading data. Please ensure gapminder.json is in the data folder.");
});

function initializeVisualization() {
    // 1. Initialize Motion Chart
    state.motionChartControl = initMotionChart(state.gapminderData, (year) => {
        // When year changes in motion chart, update other views
        if (state.choroplethControl) {
            state.choroplethControl.update(year);
        }
        if (state.sliderControl) {
            state.sliderControl.setYear(year);
        }
    });

    // 2. Initialize Choropleth Map
    state.choroplethControl = initChoroplethMap(state.geoData, state.gapminderData);

    // 3. Initialize Year Slider
    const yearRange = state.motionChartControl.getYearRange();
    state.sliderControl = initYearSlider(yearRange.min, yearRange.max, (year) => {
        // When slider is dragged, update motion chart and map
        if (state.motionChartControl) {
            state.motionChartControl.setYear(year);
        }
        if (state.choroplethControl) {
            state.choroplethControl.update(year);
        }
    });

    // 4. Initialize Hierarchy Chart
    initHierarchyChart(state.gapminderData, (continent) => {
        // When hovering over continent in hierarchy, highlight in motion chart
        if (state.motionChartControl) {
            state.motionChartControl.highlightContinent(continent);
        }
    });

    // Set initial year display
    const currentYear = state.motionChartControl.getCurrentYear();
    d3.select("#year-display").text(currentYear);
    state.choroplethControl.update(currentYear);
}
