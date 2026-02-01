export function initTimeline(plantData, onBrush) {
    const container = d3.select("#timeline-container");
    const width = container.node().getBoundingClientRect().width;
    const height = 150; // Fixed height for timeline
    const margin = { top: 10, right: 30, bottom: 30, left: 40 };

    container.selectAll("*").remove();

    const svg = container.append("svg")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("width", width)
        .attr("height", height);

    // Aggregating Capacity by Year and Fuel
    
    // Get all unique fuel types for stacking
    const fuelTypes = Array.from(new Set(plantData.map(d => d.primary_fuel)));
    
    // Create a map of Year 
    const yearMap = new Map();
    
    // Initialize range
    const minYear = d3.min(plantData, d => d.commissioning_year);
    const maxYear = d3.max(plantData, d => d.commissioning_year);

    // Filling map with empty objects for all years 
    for (let y = minYear; y <= maxYear; y++) {
        const obj = { year: y };
        fuelTypes.forEach(f => obj[f] = 0);
        yearMap.set(y, obj);
    }
    // Populate with data
    plantData.forEach(d => {
        const yearObj = yearMap.get(d.commissioning_year);
        if (yearObj) {
            yearObj[d.primary_fuel] += d.capacity_mw;
        }
    });

    const stackedData = Array.from(yearMap.values()).sort((a, b) => a.year - b.year);

    // scales
    const xScale = d3.scaleLinear()
        .domain([minYear, maxYear])
        .range([margin.left, width - margin.right]);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(stackedData, d => d3.sum(fuelTypes, f => d[f]))])
        .range([height - margin.bottom, margin.top]);

    const colorScale = d3.scaleOrdinal(d3.schemeTableau10)
        .domain(fuelTypes);

    // stack generator
    const stack = d3.stack()
        .keys(fuelTypes);
    
    const series = stack(stackedData);

    // drawing the area chart
    const area = d3.area()
        .x(d => xScale(d.data.year))
        .y0(d => yScale(d[0]))
        .y1(d => yScale(d[1]));

    svg.append("g")
        .selectAll("path")
        .data(series)
        .join("path")
        .attr("fill", d => colorScale(d.key))
        .attr("d", area)
        .append("title") // Simple tooltip
        .text(d => d.key);

    // axes
    const xAxis = d3.axisBottom(xScale).tickFormat(d3.format("d")); // "d" for integer (year)
    
    svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(xAxis);

    // brush
    const brush = d3.brushX()
        .extent([[margin.left, margin.top], [width - margin.right, height - margin.bottom]])
        .on("brush end", brushed);

    const brushGroup = svg.append("g")
        .attr("class", "brush")
        .call(brush);

    function brushed(event) {
        if (!event.selection) {
            // If selection is cleared, return null to indicate "all years"
            onBrush(null);
            return;
        }

        // Convert pixel coordinates back to Year values
        const [x0, x1] = event.selection;
        const year0 = Math.round(xScale.invert(x0));
        const year1 = Math.round(xScale.invert(x1));

        onBrush([year0, year1]);
    }
}
