export function initFuelChart(plantData, onFilter) {
    const container = d3.select("#force-container");
    const width = container.node().getBoundingClientRect().width;
    const height = 600;

    container.selectAll("*").remove();

    const svg = container.append("svg")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("width", width)
        .attr("height", height);

    // Color scale needs to be consistent across updates
    const colorScale = d3.scaleOrdinal(d3.schemeTableau10); 

    // We keep track of the currently selected fuel to persist it during updates
    let currentSelectedFuel = null;

    function update(currentData) {
        // adding Count plants per fuel type
        // We aggregate the filtered data
        const fuelRollup = d3.rollup(currentData, v => v.length, d => d.primary_fuel);
        
        // Convert to array of objects. 
        let nodes = Array.from(fuelRollup, ([fuel, count]) => ({ fuel, count }));

        // scales
        const rScale = d3.scaleSqrt()
            .domain([0, d3.max(nodes, d => d.count)])
            .range([10, 50]); 

        // binding data
        const bubbles = svg.selectAll(".fuel-bubble")
            .data(nodes, d => d.fuel);

        bubbles.exit().transition().duration(500).attr("opacity", 0).remove();

        const bubblesEnter = bubbles.enter().append("g")
            .attr("class", "fuel-bubble")
            .style("cursor", "pointer")
            .call(d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended));

        bubblesEnter.append("circle")
            .attr("stroke", "#fff")
            .attr("stroke-width", 2);

        bubblesEnter.append("text")
            .attr("text-anchor", "middle")
            .attr("dy", ".3em")
            .style("font-size", "10px")
            .style("pointer-events", "none");

        // Update existing + new
        const bubblesMerge = bubblesEnter.merge(bubbles);

        // Update visuals 
        bubblesMerge.select("circle")
            .transition().duration(500)
            .attr("r", d => rScale(d.count))
            .attr("fill", d => colorScale(d.fuel))
            // Maintain highlight if selected
            .attr("stroke", d => d.fuel === currentSelectedFuel ? "#333" : "#fff")
            .attr("stroke-width", d => d.fuel === currentSelectedFuel ? 4 : 2);

        bubblesMerge.select("text")
            .text(d => `${d.fuel} (${d.count})`); // Added count to text for better feedback

       
        // We need to restart the simulation with the new/updated nodes
        const simulation = d3.forceSimulation(nodes)
            .force("charge", d3.forceManyBody().strength(5)) 
            .force("center", d3.forceCenter(width / 2, height / 2)) 
            .force("collide", d3.forceCollide().radius(d => rScale(d.count) + 2));

        simulation.on("tick", () => {
            bubblesMerge.attr("transform", d => `translate(${d.x}, ${d.y})`);
        });

        // interaction on clicking
        bubblesMerge.on("click", (event, d) => {
            // Toggle Logic
            if (currentSelectedFuel === d.fuel) {
                currentSelectedFuel = null; // Deselect
            } else {
                currentSelectedFuel = d.fuel; // Select
            }
            
            // Updating visual state immediately
            bubblesMerge.select("circle")
                .attr("stroke", n => n.fuel === currentSelectedFuel ? "#333" : "#fff")
                .attr("stroke-width", n => n.fuel === currentSelectedFuel ? 4 : 2);

            // Sending choice back to main.js
            onFilter(currentSelectedFuel);
        });

        // Drag functions
        function dragstarted(event, d) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }

        function dragged(event, d) {
            d.fx = event.x;
            d.fy = event.y;
        }

        function dragended(event, d) {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        }
    }

    // Initial render
    update(plantData);

    return { update };
}