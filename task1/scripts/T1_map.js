export function initMap(geoData, plantData) {
    // selecting container and dimensions
    const container = d3.select("#map-container");
    const width = container.node().getBoundingClientRect().width;
    const height = 600; // Fixed height for now

    // clearing out the container
    container.selectAll("*").remove();

    const svg = container.append("svg")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("width", width)
        .attr("height", height)
        .style("background-color", "#f0f0f0"); 

    // creating a group for zooming
    const g = svg.append("g");

    // projecting
    const projection = d3.geoMercator()
        .fitSize([width, height], geoData); // Auto-fit map to screen

    const pathGenerator = d3.geoPath().projection(projection);

    // drawing the countries
    g.selectAll(".country")
        .data(geoData.features)
        .join("path")
        .attr("class", "country")
        .attr("d", pathGenerator)
        .attr("fill", "#d9d9d9")
        .attr("stroke", "#fff")
        .attr("stroke-width", 0.5);

    // Adding data
    
    // Grouping plants by Country to calculate Total Capacity
    // OPTIMIZATION: Pre-calculate projected coordinates
    // This avoids running the expensive projection function 35,000 times on every zoom event
    plantData.forEach((d, i) => {
        const coords = projection([d.longitude, d.latitude]);
        if (coords) {
            d.x = coords[0];
            d.y = coords[1];
            d.id = i; 
        }
    });

    // Color Scale for Fuel Type
    const colorScale = d3.scaleOrdinal(d3.schemeTableau10);

    // Radius Scale for Plant Capacity (Individual Points)
    const plantRadiusScale = d3.scaleSqrt()
        .domain([0, d3.max(plantData, d => d.capacity_mw)])
        .range([2, 10]); // Min 2px, Max 10px (at zoom level 1)

    // state variables
    let currentPlantData = plantData; // This will change when filtered
    let currentTransform = d3.zoomIdentity;

    // update function called by the main
    function update(filteredData) {
        currentPlantData = filteredData;

        // Re-aggregate Country Totals based on filtered data
        const plantsByCountry = d3.rollup(currentPlantData, 
            v => d3.sum(v, d => d.capacity_mw),
            d => d.country_long
        );

        // Re-build Country Circle Data
        const countryCirclesData = geoData.features.map(feature => {
            let name = feature.properties.name;
            if (name === "USA" || name === "United States") name = "United States of America";

            const capacity = plantsByCountry.get(name) || 0;
            const centroid = pathGenerator.centroid(feature);
            
            return { country: name, capacity, x: centroid[0], y: centroid[1] };
        }).filter(d => d.capacity > 0);

        const rScale = d3.scaleSqrt()
            .domain([0, d3.max(countryCirclesData, d => d.capacity)])
            .range([2, 25]);

        // Update Country Circles 
        const circles = g.selectAll(".country-circle")
            .data(countryCirclesData, d => d.country);

        circles.join(
            enter => enter.append("circle")
                .attr("class", "country-circle")
                .attr("cx", d => d.x)
                .attr("cy", d => d.y)
                .attr("fill", "steelblue")
                .attr("stroke", "#333")
                .attr("opacity", currentTransform.k > 2.5 ? 0 : 1)
                .attr("r", d => rScale(d.capacity)),
            update => update.transition().duration(500)
                .attr("r", d => rScale(d.capacity)), // Animate size change
            exit => exit.remove()
        );

        // Re-render current view (Points or Circles) immediately
        render();
    }

    // Combined Zoom & Filter logic
    function render() {
        // Apply Transform
        g.attr("transform", currentTransform);

        // Semantic Zoom Decision
        if (currentTransform.k > 2.5) {
            // ZOOMED IN: Showing Points
            g.selectAll(".country-circle").attr("opacity", 0).attr("pointer-events", "none");

            // Viewport Calculation
            const minX = (0 - currentTransform.x) / currentTransform.k;
            const maxX = (width - currentTransform.x) / currentTransform.k;
            const minY = (0 - currentTransform.y) / currentTransform.k;
            const maxY = (height - currentTransform.y) / currentTransform.k;

            // Filtering VISIBLE points from the FILTERED data
            const visiblePlants = currentPlantData.filter(d => 
                d.x >= minX - 10 && d.x <= maxX + 10 && 
                d.y >= minY - 10 && d.y <= maxY + 10
            );

            g.selectAll(".plant-circle")
                .data(visiblePlants, d => d.id)
                .join("circle")
                .attr("class", "plant-circle")
                .attr("cx", d => d.x)
                .attr("cy", d => d.y)
                // Dynamic Radius: Scale by capacity, but divide by zoom level to keep them reasonable
                .attr("r", d => plantRadiusScale(d.capacity_mw) / (currentTransform.k * 0.5)) 
                // Dynamic Color: Coloring by Fuel Type
                .attr("fill", d => colorScale(d.primary_fuel))
                .attr("opacity", 0.8)
                .attr("stroke", "#fff")
                .attr("stroke-width", 0.5 / currentTransform.k);

            g.selectAll(".country").attr("stroke-width", 0.5 / currentTransform.k);

        } else {
            // ZOOMED OUT: Show Country Summaries
            g.selectAll(".plant-circle").remove(); // Clear dots
            g.selectAll(".country-circle").attr("opacity", 1).attr("pointer-events", "all");
            g.selectAll(".country").attr("stroke-width", 0.5 / currentTransform.k);
        }
    }

    // ZOOM HANDLER
    const zoom = d3.zoom()
        .scaleExtent([1, 8])
        .on("zoom", (event) => {
            currentTransform = event.transform;
            render(); // Call the unified render function
        });

    svg.call(zoom);

    // Initial call
    update(plantData);
    return { update };
}