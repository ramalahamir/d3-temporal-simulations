// scripts/hierarchyChart.js
// Requirement 2.3: Interactive State Controls - The Drill-Down

export function initHierarchyChart(data, onContinentHover) {
    const container = d3.select("#hierarchy-container");
    const width = 600;
    const height = 400;
    const radius = Math.min(width, height) / 2 - 20; // Slightly reduced radius to ensure fit

    container.selectAll("*").remove();

    const svg = container.append("svg")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("width", "100%")
        .attr("height", "100%");

    // Main Group for the Sunburst (Centered)
    const g = svg.append("g")
        .attr("transform", `translate(${width / 2},${height / 2})`);

    // Get latest year data for sizing
    const latestYear = d3.max(data, d => d.year);
    const latestData = data.filter(d => d.year === latestYear);

    // Build hierarchy: World -> Continent -> Country
    const hierarchyData = {
        name: "World",
        children: []
    };

    // Group by continent
    const continents = d3.group(latestData, d => d.continent);
    
    continents.forEach((countries, continent) => {
        const continentNode = {
            name: continent,
            children: countries.map(c => ({
                name: c.country,
                value: c.pop
            }))
        };
        hierarchyData.children.push(continentNode);
    });

    // Create hierarchy
    const root = d3.hierarchy(hierarchyData)
        .sum(d => d.value || 0)
        .sort((a, b) => b.value - a.value);

    // Partition layout
    const partition = d3.partition()
        .size([2 * Math.PI, radius]);

    partition(root);

    // Color scale
    const colorScale = d3.scaleOrdinal()
        .domain(["Africa", "Americas", "Asia", "Europe", "Oceania", "Other"])
        .range(["#e74c3c", "#3498db", "#f39c12", "#2ecc71", "#9b59b6", "#95a5a6"]);

    // Arc generator
    const arc = d3.arc()
        .startAngle(d => d.x0)
        .endAngle(d => d.x1)
        .innerRadius(d => d.y0)
        .outerRadius(d => d.y1);

    // Draw arcs
    const arcs = g.selectAll(".hierarchy-arc")
        .data(root.descendants().filter(d => d.depth > 0))
        .join("path")
        .attr("class", "hierarchy-arc")
        .attr("d", arc)
        .attr("fill", d => {
            if (d.depth === 1) {
                // Continent level
                return colorScale(d.data.name);
            } else {
                // Country level - lighter shade
                const continent = d.parent.data.name;
                return d3.color(colorScale(continent)).brighter(0.5);
            }
        })
        .attr("opacity", 0.8)
        .attr("stroke", "#fff")
        .attr("stroke-width", 1);

    // Tooltip
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    // Interactions
    arcs
        .on("mouseover", function(event, d) {
            d3.select(this)
                .attr("opacity", 1)
                .attr("stroke-width", 3);

            // If hovering over continent, highlight it in motion chart
            let continentName = d.depth === 1 ? d.data.name : d.parent.data.name;
            onContinentHover(continentName);

            tooltip.transition().duration(200).style("opacity", 1);
            tooltip.html(`
                <strong>${d.data.name}</strong><br/>
                ${d.depth === 1 ? 'Continent' : 'Country'}<br/>
                Population: ${d3.format(",.0f")(d.value)}
            `)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
            d3.select(this)
                .attr("opacity", 0.8)
                .attr("stroke-width", 1);

            // Reset highlight
            onContinentHover(null);

            tooltip.transition().duration(200).style("opacity", 0);
        });

    // Center label (World)
    g.append("text")
        .attr("text-anchor", "middle")
        .attr("dy", "0.35em")
        .attr("fill", "#2c3e50")
        .style("font-size", "16px")
        .style("font-weight", "700")
        .text("World");

    // ---------------------------------------------------------
    // NEW: LEGEND (Top Left)
    // ---------------------------------------------------------
    const legendData = colorScale.domain(); // Get list of continents

    // Create a group for the legend, positioned at top-left
    const legend = svg.append("g")
        .attr("class", "legend")
        .attr("transform", "translate(20, 20)");

    const legendItems = legend.selectAll(".legend-item")
        .data(legendData)
        .join("g")
        .attr("class", "legend-item")
        .attr("transform", (d, i) => `translate(0, ${i * 25})`) // Space them out vertically
        .style("cursor", "pointer"); // Show pointer to indicate interactivity

    // Draw the colored boxes
    legendItems.append("rect")
        .attr("width", 18)
        .attr("height", 18)
        .attr("fill", d => colorScale(d))
        .attr("rx", 3); // Rounded corners

    // Draw the text labels
    legendItems.append("text")
        .attr("x", 25)
        .attr("y", 14) // Center text vertically relative to rect
        .text(d => d)
        .style("font-size", "14px")
        .attr("fill", "#333");

    // Add Hover Interaction to Legend as well
    legendItems
        .on("mouseover", (event, d) => {
            // Highlight Motion Chart
            onContinentHover(d);
            
            // Highlight this legend item
            d3.select(event.currentTarget).select("text").style("font-weight", "bold");
            
            // Dim other arcs in this chart
            arcs.attr("opacity", arcD => {
                const arcContinent = arcD.depth === 1 ? arcD.data.name : arcD.parent.data.name;
                return arcContinent === d ? 1 : 0.2;
            });
        })
        .on("mouseout", (event, d) => {
            onContinentHover(null);
            d3.select(event.currentTarget).select("text").style("font-weight", "normal");
            arcs.attr("opacity", 0.8);
        });
}