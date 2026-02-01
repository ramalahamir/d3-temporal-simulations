// scripts/yearSlider.js
// Requirement 2.3: Interactive State Controls - The Slider

export function initYearSlider(minYear, maxYear, onYearChange) {
    const container = d3.select("#year-slider");
    const width = 600;
    const height = 50;
    const margin = { top: 10, right: 20, bottom: 20, left: 20 };

    container.selectAll("*").remove();

    container
        .attr("width", "100%")
        .attr("height", height)
        .attr("viewBox", `0 0 ${width} ${height}`);

    const sliderWidth = width - margin.left - margin.right;

    const g = container.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Scale
    const xScale = d3.scaleLinear()
        .domain([minYear, maxYear])
        .range([0, sliderWidth]);

    // Track
    g.append("line")
        .attr("x1", 0)
        .attr("x2", sliderWidth)
        .attr("y1", 15)
        .attr("y2", 15)
        .attr("stroke", "#ddd")
        .attr("stroke-width", 4)
        .attr("stroke-linecap", "round");

    // Tick marks
    const tickYears = d3.range(minYear, maxYear + 1, Math.ceil((maxYear - minYear) / 10));
    
    g.selectAll(".tick-mark")
        .data(tickYears)
        .join("line")
        .attr("class", "tick-mark")
        .attr("x1", d => xScale(d))
        .attr("x2", d => xScale(d))
        .attr("y1", 10)
        .attr("y2", 20)
        .attr("stroke", "#999")
        .attr("stroke-width", 2);

    g.selectAll(".tick-label")
        .data(tickYears)
        .join("text")
        .attr("class", "tick-label")
        .attr("x", d => xScale(d))
        .attr("y", 35)
        .attr("text-anchor", "middle")
        .attr("fill", "#666")
        .style("font-size", "10px")
        .text(d => d);

    // Handle
    const handle = g.append("circle")
        .attr("class", "slider-handle")
        .attr("cx", xScale(minYear))
        .attr("cy", 15)
        .attr("r", 10)
        .attr("fill", "#2c3e50")
        .attr("stroke", "#fff")
        .attr("stroke-width", 2)
        .attr("cursor", "grab")
        .style("filter", "drop-shadow(0 2px 4px rgba(0,0,0,0.2))");

    // Progress track
    const progressTrack = g.append("line")
        .attr("x1", 0)
        .attr("x2", xScale(minYear))
        .attr("y1", 15)
        .attr("y2", 15)
        .attr("stroke", "#2c3e50")
        .attr("stroke-width", 4)
        .attr("stroke-linecap", "round");

    // Drag behavior
    const drag = d3.drag()
        .on("start", function() {
            d3.select(this).attr("cursor", "grabbing");
        })
        .on("drag", function(event) {
            const x = Math.max(0, Math.min(sliderWidth, event.x));
            const year = Math.round(xScale.invert(x));
            
            handle.attr("cx", xScale(year));
            progressTrack.attr("x2", xScale(year));
            
            d3.select("#year-display").text(year);
            onYearChange(year);
        })
        .on("end", function() {
            d3.select(this).attr("cursor", "grab");
        });

    handle.call(drag);

    // Click on track to jump
    g.append("rect")
        .attr("width", sliderWidth)
        .attr("height", 30)
        .attr("y", 0)
        .attr("fill", "transparent")
        .attr("cursor", "pointer")
        .on("click", function(event) {
            const [x] = d3.pointer(event);
            const year = Math.round(xScale.invert(x));
            
            handle.transition().duration(200).attr("cx", xScale(year));
            progressTrack.transition().duration(200).attr("x2", xScale(year));
            
            d3.select("#year-display").text(year);
            onYearChange(year);
        });

    // Update function
    function setYear(year) {
        handle.attr("cx", xScale(year));
        progressTrack.attr("x2", xScale(year));
        d3.select("#year-display").text(year);
    }

    return { setYear };
}
