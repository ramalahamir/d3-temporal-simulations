// scripts/motionChart.js
// Requirement 2.1: The Motion Chart (Scatter Plot)

export function initMotionChart(data, onYearChange) {
    const container = d3.select("#motion-chart-container");
    const width = 700;
    const height = 500;
    const margin = { top: 20, right: 20, bottom: 60, left: 80 };

    // 1. CLEAR & SETUP SVG
    container.selectAll("*").remove();

    const svg = container.append("svg")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("width", "100%")
        .attr("height", "100%");

    const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // 2. DATA PREP
    // Get all unique years and sort them
    const years = Array.from(new Set(data.map(d => d.year))).sort((a, b) => a - b);
    const minYear = d3.min(years);
    const maxYear = d3.max(years);

    // 3. SCALES
    const xScale = d3.scaleLog()
        .domain([100, d3.max(data, d => d.gdpPercap) * 1.1])
        .range([0, chartWidth])
        .nice();

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.lifeExp) * 1.05])
        .range([chartHeight, 0])
        .nice();

    const radiusScale = d3.scaleSqrt()
        .domain([0, d3.max(data, d => d.pop)])
        .range([3, 40]);

    const colorScale = d3.scaleOrdinal()
        .domain(["Africa", "Americas", "Asia", "Europe", "Oceania"])
        .range(["#e74c3c", "#3498db", "#f39c12", "#2ecc71", "#9b59b6"]);

    // 4. AXES CONFIGURATION
    // Note: We use specific tick arguments to handle Log Scale clutter
    const xAxis = d3.axisBottom(xScale)
        .ticks(5, ",.0s") // "5" suggests the number of ticks; ",.0s" formats like 1k, 1M
        .tickSizeOuter(0);

    const yAxis = d3.axisLeft(yScale);

    // 5. DRAW GRID (Background Lines)
    g.append("g")
        .attr("class", "grid")
        .attr("transform", `translate(0,${chartHeight})`)
        .call(d3.axisBottom(xScale)
            .ticks(5) // Match axis tick count
            .tickSize(-chartHeight)
            .tickFormat("")
        )
        .style("opacity", 0.1);

    g.append("g")
        .attr("class", "grid")
        .call(d3.axisLeft(yScale)
            .tickSize(-chartWidth)
            .tickFormat("")
        )
        .style("opacity", 0.1);

    // 6. DRAW AXES (With Rotation Fix)
    const xAxisG = g.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(0,${chartHeight})`)
        .call(xAxis);

    // Apply rotation to the text labels AFTER drawing the axis
    xAxisG.selectAll("text")
        .attr("transform", "translate(-10,0)rotate(-45)") // Rotate and shift slightly left
        .style("text-anchor", "end");

    const yAxisG = g.append("g")
        .attr("class", "axis")
        .call(yAxis);

    // 7. AXIS LABELS
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height - 10)
        .attr("text-anchor", "middle")
        .attr("fill", "#999")
        .style("font-size", "14px")
        .text("GDP per Capita (USD)");

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", 20)
        .attr("text-anchor", "middle")
        .attr("fill", "#999")
        .style("font-size", "14px")
        .text("Life Expectancy (years)");

    // 8. TOOLTIP
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    // 9. ANIMATION STATE
    let currentYear = minYear;
    let isPlaying = false;
    let animationInterval = null;

    // 10. UPDATE FUNCTION (The Core Loop)
    function update(year, transition = true) {
        currentYear = year;
        onYearChange(year); // Notify parent (e.g. to update the map)

        // Filter data for current year
        const yearData = data.filter(d => d.year === year);

        // Bind data
        const bubbles = g.selectAll(".country-bubble")
            .data(yearData, d => d.country);

        // Enter
        const bubblesEnter = bubbles.enter()
            .append("circle")
            .attr("class", "country-bubble")
            .attr("cx", d => xScale(d.gdpPercap))
            .attr("cy", d => yScale(d.lifeExp))
            .attr("r", 0)
            .attr("fill", d => colorScale(d.continent))
            .attr("opacity", 0.7);

        // Merge
        const bubblesMerge = bubblesEnter.merge(bubbles);

        // Update Position
        if (transition) {
            bubblesMerge.transition()
                .duration(300)
                .ease(d3.easeLinear) // Linear ease makes continuous animation smoother
                .attr("cx", d => xScale(d.gdpPercap))
                .attr("cy", d => yScale(d.lifeExp))
                .attr("r", d => radiusScale(d.pop));
        } else {
            bubblesMerge
                .attr("cx", d => xScale(d.gdpPercap))
                .attr("cy", d => yScale(d.lifeExp))
                .attr("r", d => radiusScale(d.pop));
        }

        // Hover effects
        bubblesMerge
            .on("mouseover", function(event, d) {
                d3.select(this)
                    .attr("opacity", 1)
                    .attr("stroke", "#333")
                    .attr("stroke-width", 2);

                tooltip.transition().duration(200).style("opacity", 1);
                tooltip.html(`
                    <strong>${d.country}</strong><br/>
                    Continent: ${d.continent}<br/>
                    GDP: $${d3.format(",.0f")(d.gdpPercap)}<br/>
                    Life Exp: ${d.lifeExp.toFixed(1)} years<br/>
                    Population: ${d3.format(",.0f")(d.pop)}
                `)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function() {
                d3.select(this)
                    .attr("opacity", 0.7)
                    .attr("stroke", "none");
                tooltip.transition().duration(200).style("opacity", 0);
            });

        // Exit
        bubbles.exit()
            .transition()
            .duration(300)
            .attr("r", 0)
            .remove();
    }

    // 11. PLAYBACK CONTROLS
    function play() {
        isPlaying = true;
        d3.select("#play-pause-btn").text("⏸ Pause");

        animationInterval = d3.interval(() => {
            if (currentYear >= maxYear) {
                currentYear = minYear; // Loop back to start
            } else {
                // Find next available year in the dataset
                const currentIndex = years.indexOf(currentYear);
                if (currentIndex < years.length - 1) {
                    currentYear = years[currentIndex + 1];
                } else {
                    currentYear = minYear;
                }
            }
            update(currentYear, true);
        }, 500); // Speed: 500ms per year
    }

    function pause() {
        isPlaying = false;
        d3.select("#play-pause-btn").text("▶ Play");
        if (animationInterval) {
            animationInterval.stop();
        }
    }

    // Attach Click Handler
    d3.select("#play-pause-btn").on("click", () => {
        if (isPlaying) {
            pause();
        } else {
            play();
        }
    });

    // Initial render
    update(currentYear, false);

    // 12. EXPOSE CONTROL METHODS
    return {
        setYear: (year) => {
            pause();
            update(year, false);
        },
        highlightContinent: (continent) => {
            g.selectAll(".country-bubble")
                .transition()
                .duration(200)
                .attr("opacity", d => {
                    if (!continent) return 0.7;
                    return d.continent === continent ? 0.9 : 0.1; // Dim others significantly
                });
        },
        getYearRange: () => ({ min: minYear, max: maxYear }),
        getCurrentYear: () => currentYear
    };
}