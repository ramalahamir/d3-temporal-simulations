// scripts/choroplethMap.js
// Requirement 2.2: The Synchronized Choropleth Map

export function initChoroplethMap(geoData, gapminderData) {
    const container = d3.select("#choropleth-container");
    const width = 600;
    const height = 500;

    container.selectAll("*").remove();

    const svg = container.append("svg")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("width", "100%")
        .attr("height", "100%");

    // Projection
    const projection = d3.geoNaturalEarth1()
        .fitSize([width, height], geoData);

    const pathGenerator = d3.geoPath().projection(projection);

    // Color scale for life expectancy
    const colorScale = d3.scaleSequential(d3.interpolateYlGnBu)
        .domain([20, 85]); // Life expectancy range

    // Tooltip
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    // Draw countries
    const countries = svg.selectAll(".country-path")
        .data(geoData.features)
        .join("path")
        .attr("class", "country-path")
        .attr("d", pathGenerator)
        .attr("fill", "#d9d9d9")
        .attr("stroke", "#fff")
        .attr("stroke-width", 0.5);

    // Update function
    function update(year) {
        // Create a map of country -> life expectancy for this year
        const yearData = new Map();
        gapminderData
            .filter(d => d.year === year)
            .forEach(d => {
                yearData.set(d.country, d.lifeExp);
            });

        // Update country colors
        countries
            .transition()
            .duration(300)
            .attr("fill", d => {
                const countryName = d.properties.name;
                const lifeExp = yearData.get(countryName);
                return lifeExp ? colorScale(lifeExp) : "#d9d9d9";
            });

        // Hover effects
        countries
            .on("mouseover", function(event, d) {
                const countryName = d.properties.name;
                const lifeExp = yearData.get(countryName);

                d3.select(this)
                    .attr("stroke-width", 2)
                    .attr("stroke", "#2c3e50");

                if (lifeExp) {
                    tooltip.transition().duration(200).style("opacity", 1);
                    tooltip.html(`
                        <strong>${countryName}</strong><br/>
                        Life Expectancy: ${lifeExp.toFixed(1)} years<br/>
                        Year: ${year}
                    `)
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 28) + "px");
                }
            })
            .on("mouseout", function() {
                d3.select(this)
                    .attr("stroke-width", 0.5)
                    .attr("stroke", "#fff");
                tooltip.transition().duration(200).style("opacity", 0);
            });
    }

    // Legend
    const legendWidth = 200;
    const legendHeight = 10;
    const legendX = width - legendWidth - 20;
    const legendY = height - 40;

    const legendScale = d3.scaleLinear()
        .domain([20, 85])
        .range([0, legendWidth]);

    const legendAxis = d3.axisBottom(legendScale)
        .ticks(5)
        .tickFormat(d => `${d} yrs`);

    // Create gradient
    const defs = svg.append("defs");
    const gradient = defs.append("linearGradient")
        .attr("id", "legend-gradient");

    gradient.selectAll("stop")
        .data(d3.range(0, 1.1, 0.1))
        .join("stop")
        .attr("offset", d => `${d * 100}%`)
        .attr("stop-color", d => colorScale(20 + d * 65));

    // Draw legend
    const legendG = svg.append("g")
        .attr("transform", `translate(${legendX},${legendY})`);

    legendG.append("rect")
        .attr("width", legendWidth)
        .attr("height", legendHeight)
        .style("fill", "url(#legend-gradient)");

    legendG.append("g")
        .attr("transform", `translate(0,${legendHeight})`)
        .call(legendAxis)
        .selectAll("text")
        .attr("fill", "#999")
        .style("font-size", "10px");

    legendG.selectAll(".domain, .tick line")
        .attr("stroke", "#666");

    return { update };
}
