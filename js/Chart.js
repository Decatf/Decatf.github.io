
window.onresize = function (event) {
    // look for resize but use timer to only call the update script when a resize stops
    var resizeTimer;
    window.onresize = function (event) {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
            var width = window.innerWidth;
            var height = window.innerHeight;
            width = width - 250;
            if (typeof chartCollection != 'undefined' && chartCollection != null) {
                chartCollection.update(width, height);
            }
        }, 100);
    }
};

function ChartCollection(data, volume_data) {

    ChartCollection.prototype.onBrush = function () {
        var charts = this.charts;
        var brush = this.chartContext.brush;
        var chartContext = this.chartContext;

        var startTime = Date.now();
        if (startTime - this.onBrushTimer > this.brushTimerAvg) {
            // Compute the context xDomain
            var filtered_data;
            var xDomain;
            if (brush.empty()) {
                filtered_data = chartContext.chartData;
            }
            else {
                var brush_extent = brush.extent();
                filtered_data = chartContext.chartData.filter(function (element, index, array) {
                    return (brush_extent[0] <= array[index].x && array[index].x <= brush_extent[1]);
                });
            }
            xDomain = d3.extent(filtered_data.map(chartContext.dataMapFuncX));

            // Find the x index range of the chart data 
            var xRange = [0, 0];
            var hasStart = false;
            var hasEnd = false;
            for (var i = 0; i < chartContext.chartData.length; i++) {
                if (!hasStart && xDomain[0] == chartContext.chartData[i].x) {
                    xRange[0] = i;
                    hasStart = true;
                }
                if (!hasEnd && xDomain[1] == chartContext.chartData[i].x) {
                    xRange[1] = i;
                    hasEnd = true;
                }
                if (hasStart && hasEnd) {
                    break;
                }
            }

            for (var i = 0; i < charts.length; i++) {
                charts[i].onBrush.call(charts[i], brush, xRange, xRange);
            }

            var now = Date.now();
            this.brushTimerAvg = ((0.40 * this.brushTimerAvg) + (0.60 * (now - startTime))) / 1.95;
            //console.log(this.brushTimerAvg);
            this.onBrushTimer = now;
        }
    }

    ChartCollection.prototype.onBrushEnd = function () {
        //var startTime = Date.now();

        //for (var i = 0; i < this.charts.length; i++) {
        //    this.charts[i].onBrush.call(this.charts[i], this.chartContext.brush);
        //}

        //this.brushTimerAvg = ((0.10 * this.brushTimerAvg) + (0.90 * (Date.now() - startTime))) / 1.9;
    }

    ChartCollection.prototype.update = function (width, height) {
        var chartCount = this.charts.length + 1;
        var chartCollectionWidth = (width * 9 / 10) - this.margin.left - this.margin.right;
        var chartCollectionHeight = (height * 8 / 10) - (chartCount * this.margin.top) - this.margin.bottom;
        //var chartCollectionHeight = (height * 2 / 3) - this.margin.top - this.margin.bottom;

        this.svg.attr("width", chartCollectionWidth + this.margin.left + this.margin.right)
                .attr("height", chartCollectionHeight + (chartCount * this.margin.top) + this.margin.bottom);

        var chartWidth;
        chartWidth = chartCollectionWidth - (0.10 * chartCollectionHeight);
        chartHeight = 0.10 * chartCollectionHeight;
        this.chartContext.update(
            chartWidth,
            chartHeight,
            this.margin.left + (chartHeight) / 2,
            this.margin.top + ((0.90 * chartCollectionHeight) + this.margin.top));

        chartWidth = chartCollectionWidth;
        chartHeight = 0.70 * chartCollectionHeight;
        this.charts[0].update.call(this.charts[0], chartWidth, chartHeight, this.margin.left, this.margin.top);
        this.charts[0].onBrush.call(this.charts[0], this.chartContext.brush);
        this.charts[0].updateCursor();

        chartWidth = chartCollectionWidth;
        chartHeight = 0.20 * chartCollectionHeight;
        this.charts[1].update.call(this.charts[1], chartWidth, chartHeight, this.margin.left, this.margin.top + ((0.70 * chartCollectionHeight) + this.margin.top));
        this.charts[1].onBrush.call(this.charts[1], this.chartContext.brush);
        this.charts[1].updateCursor();


        // Center the tab container vertically
        var chartContentDiv = document.getElementById("chartContentDiv");
        var marginTop = "-" + ((height - (chartCount * this.margin.top) - this.margin.bottom) / 2) + "px";
        chartContentDiv.style['marginTop'] = marginTop;
    }
    
    ChartCollection.prototype.onMouseMove = function () {
        //console.log("ChartCollection onMouseMove");
        d3.event.preventDefault();
        d3.event.stopPropagation();

        var now = Date.now();
        if (now - this.mouseMoveTimer > this.mouseMoveTime) {
            //// Manually call the mouse move function for every other chart
            for (i = 0; i < this.charts.length; i++) {
                this.charts[i].onMouseMove.call(this.charts[i]);
            }
            
            this.mouseMoveTimer = now;
        }
    }

    ChartCollection.prototype.onTouchStart = function (evt) {
        //console.log("ChartCollection onTouchStart");
        d3.event.preventDefault();
        d3.event.stopPropagation();

        var now = Date.now();
        if (now - this.mouseMoveTimer > this.mouseMoveTime) {
            // Manually call the mouse move function for every other chart
            for (i = 0; i < this.charts.length; i++) {
                this.charts[i].onTouchMove.call(this.charts[i]);
            }

            this.mouseMoveTimer = now;
        }
    }

    ChartCollection.prototype.onTouchMove = function (evt) {
        //console.log("ChartCollection onTouchMove");
        d3.event.preventDefault();
        d3.event.stopPropagation();

        var now = Date.now();
        if (now - this.mouseMoveTimer > this.mouseMoveTime) {
            // Manually call the mouse move function for every other chart
            for (i = 0; i < this.charts.length; i++) {
                this.charts[i].onTouchMove.call(this.charts[i]);
            }

            this.mouseMoveTimer = now;
        }
    }

    this.charts = [];
    //this.chartContext;

    var chartCount = 2 + 1; // Charts + Context

    this.margin = { top: 10, right: 80, bottom: 10, left: 10 };
    this.barMargin = { side: 1, top: 10 };
    
    this.width = 960 - this.margin.left - this.margin.right;
    this.height = 600 - (chartCount * this.margin.top) - this.margin.bottom;

    // Chart annotations
    this.patternAnnotations = [];

    var now = Date.now();
    this.mouseMoveTime = 50; // milliseconds
    this.mouseMoveTimer = now;
    this.brushTimerAvg = 50; // milliseconds
    this.onBrushTimer = now;

    this.svg = d3.select("#chart")
        .append("svg")
        .attr("class", "chart")
        .attr("width", this.width + this.margin.left + this.margin.right)
        .attr("height", this.height + (chartCount * this.margin.top) + this.margin.bottom);

    var cursorText;

    cursorText = function (d) {
        return d.x.toDateString() +
            " - O: " + d.y[0].toFixed(2) +
            " H: " + d.y[1].toFixed(2) +
            " L: " + d.y[2].toFixed(2) +
            " C: " + d.y[3].toFixed(2);
    };

    this.charts.push(new CanvasCandlestickChart({
    //this.charts.push(new CandlestickChart({
        svg: this.svg,
        data: data,
        width: this.width,
        height: this.height * 0.70,
        margin: this.margin,
        barMargin: this.barMargin,
        translateX: this.margin.left,
        translateY: this.margin.top,
        name: "CandleStickChart",
        dataMapFuncX: function (d) { return d.index; },
        dataMapFuncY: function (d) { return d.y0; },
        cursorTextFunc: cursorText,
        onMouseMove: this.onMouseMove.bind(this),
        onTouchStart: this.onTouchStart.bind(this),
        onTouchMove: this.onTouchMove.bind(this),
        yDomainPadding: 0.05
    }));

    this.charts["CandleStickChart"] = this.charts[0];
    //this.charts["CandleStickChart"].yAxis.tickFormat(function (d, i) {
    //    if (data[d]) {
    //        return data[d].y0.toFixed(2);
    //    }
    //});

    //this.charts.push(new Chart({
    //    svg: this.svg,
    //    data: data,
    //    width: this.width,
    //    height: this.height * 0.70,
    //    margin: this.margin,
    //    barMargin: this.barMargin,
    //    translateX: this.margin.left,
    //    translateY: this.margin.top,
    //    name: "PriceChart",
    //    dataMapFuncX: function (d) { return d.index; },
    //    dataMapFuncY: function (d) { return d.y0; },
    //    cursorTextFunc: cursorText,
    //    onMouseMove: this.onMouseMove.bind(this)
    //}));


    cursorText = function (d) { return "Volume: " + (d3.format(",")(d.y0)); };
    this.charts.push(new CanvasBarChart({
    //this.charts.push(new BarChart({
        svg: this.svg,
        data: volume_data,
        width: this.width,
        height: this.height * 0.20,
        margin: this.margin,
        barMargin: this.barMargin,
        translateX: this.margin.left,
        translateY: this.margin.top + ((this.height * 0.70) + this.margin.top),
        name: "BarChart",
        dataMapFuncX: function (d) { return d.index; },
        dataMapFuncY: function (d) { return d.y0; },
        cursorTextFunc: cursorText,
        onMouseMove: this.onMouseMove.bind(this),
        onTouchStart: this.onTouchStart.bind(this),
        onTouchMove: this.onTouchMove.bind(this),
        yDomainMin: 0
    }));
    this.charts["BarChart"] = this.charts[1];
    //this.charts["BarChart"].chartContainer
    //    .select("path.chart")
    //    .attr("id", "volume_path");
    this.charts["BarChart"].yAxis.ticks(5);

    var chartHeight =  (this.height * 0.10 - 2);
    var chartWidth = this.width - (chartHeight); 
    this.chartContext = new ChartContext({
        svg: this.svg,
        data: data,
        width: chartWidth,
        height: chartHeight,
        margin: this.margin,
        translateX: this.margin.left + chartHeight,
        translateY: this.margin.top + ((0.90 * this.height) + this.margin.top)
    });
    
    //this.chartContext.brush.on("brush", this.charts[0].onBrush.bind(this.charts[0]));
    //this.chartContext.brush.on("brush", this.charts[1].onBrush.bind(this.charts[1]));
    this.chartContext.brush.on("brushend", this.onBrushEnd.bind(this));
    this.chartContext.brush.on("brush", this.onBrush.bind(this));

};

// Create the context brush that will let us zoom and pan the chart
function ChartContext(contextModel) {

    // Update event
    ChartContext.prototype.update = function (width, height, translateX, translateY) {
        var brushExtent = this.brush.extent();
        
        this.contextWidth = width;
        this.contextHeight = height;

        this.contextXScale
            .range([0, this.contextWidth])
            .domain(d3.extent(this.chartData.map(this.dataMapFuncX)));
        this.contextYScale
            .range([this.contextHeight, 0])
            .domain(d3.extent(this.chartData.map(this.dataMapFuncY)));

        this.contextAxis
            .scale(this.contextXScale)
            .orient("bottom");

        //var xS = this.contextXScale;
        //var yS = this.contextYScale;
        this.contextPathFunction
            .x(function (d) { return xS(d.x); })
            //.y(function (d) { return yS(d.y0); });
            .y0(this.contextHeight)
            .y1(function (d) { return yS(d.y0); });

        this.context
            .attr("transform", "translate(" + translateX + "," + translateY + ")");

        this.context.select("path")
            .datum(this.chartData)
            .attr("d", this.contextPathFunction);

        this.context.select(".x.axis")
            .attr("transform", "translate(0, " + height + ")")
            .call(this.contextAxis);

        // Restore the brush extent
        this.brush.extent(brushExtent);

        this.context.select(".x.brush")
            .call(this.brush)
            .selectAll("rect")
            .attr("y", 0)
            .attr("height", this.contextHeight);
    }

    // Brush event
    //ChartContext.prototype.onBrush = function () {        
        
    //}


    this.svg = contextModel.svg;
    this.chartData = contextModel.data;

    this.margin = contextModel.margin;
    this.contextWidth = contextModel.width;
    this.contextHeight = contextModel.height;//;

    this.dataMapFuncX = function (d) { return d.x; };
    this.dataMapFuncY = function (d) { return d.y0; };

    this.contextXScale = d3.time.scale()
        .range([0, this.contextWidth])
        .domain(d3.extent(this.chartData.map(this.dataMapFuncX)));
    this.contextYScale = d3.scale.linear()
        .range([this.contextHeight, 0])
        .domain(d3.extent(this.chartData.map(this.dataMapFuncY)));

    this.contextAxis = d3.svg.axis()
        .scale(this.contextXScale)
        .orient("bottom");

    var xS = this.contextXScale;
    var yS = this.contextYScale;
    this.contextPathFunction = d3.svg.area()
        //.interpolate("base")
        .defined(function (d) { return d.y0 != null && !isNaN(d.y0); })
        .x(function (d) { return xS(d.x); })
        //.y(function (d) { return yS(d.y0); });
        .y0(this.contextHeight)
        .y1(function (d) { return yS(d.y0); });


    this.brush = d3.svg.brush()
        .x(this.contextXScale)
        .on("brush", onBrushEvents);
        //.on("brush", chartCollection.onBrush);

    this.context = this.svg.append("g")
        .attr("class", "context")
        .attr("transform", "translate(" + contextModel.translateX + "," + contextModel.translateY + ")");


    // Data for the context
    this.context.append("path")
        .attr("id", "context_path")
        .datum(this.chartData)
        .attr("d", this.contextPathFunction);

    this.context.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + this.contextHeight + ")")
        .call(this.contextAxis)

    this.context.append("g")
        .attr("class", "x brush")
        .call(this.brush)
        .selectAll("rect")
        .attr("y", 0)
        .attr("height", this.contextHeight);

    // Brush handles
    //var arc = d3.svg.arc()
    //.outerRadius(this.contextHeight / 2)
    //.startAngle(0)
    //.endAngle(function (d, i) { return i ? -Math.PI : Math.PI; });

    //this.context.selectAll(".resize").append("path")
    //.attr("transform", "translate(0," +  this.contextHeight / 2 + ")")
    //.attr("d", arc);

    this.context.selectAll(".resize.e").append("rect")
        .attr("class", "contextResizeHandle")
        .attr("width", this.contextHeight / 2)
        .attr("height", this.contextHeight)
        .attr("transform", "translate(0, 0)")
        .on("mousemove", onBrushHandleTouch)
        .on("touchmove", onBrushHandleTouch)
        .on("touchstart", onBrushHandleTouch);

    this.context.selectAll(".resize.w").append("rect")
        .attr("class", "contextResizeHandle")
        .attr("width", this.contextHeight / 2)
        .attr("height", this.contextHeight)
        .attr("transform", "translate(" + (-this.contextHeight / 2) + ", 0)")
        .on("mousemove", onBrushHandleTouch)
        .on("touchmove", onBrushHandleTouch)
        .on("touchstart", onBrushHandleTouch);

    this.context.selectAll("rect.extent")
        .on("mousemove", onBrushHandleTouch)
        .on("touchmove", onBrushHandleTouch)
        .on("touchstart", onBrushHandleTouch);

    this.context.selectAll("g.x.brush")
        .on("mousemove", onBrushEvents)
        .on("touchmove", onBrushEvents)
        .on("touchstart", onBrushEvents);
};

function onBrushHandleTouch() {
    d3.event.preventDefault();
    //d3.event.stopPropagation();
};

function onBrushEvents() {
    d3.event.preventDefault();
    //d3.event.stopPropagation();
};

function Chart(chartModel) {
    this.svg = chartModel.svg;
    this.margin = chartModel.margin;
    this.width = chartModel.width;
    this.height = chartModel.height;
    this.translateX = chartModel.translateX;
    this.translateY = chartModel.translateY;
    this.chartData = chartModel.data;
    this.dataMapFuncX = chartModel.dataMapFuncX;
    this.dataMapFuncY = chartModel.dataMapFuncY;
    this.cursorText = chartModel.cursorTextFunc;

    // Set custom domain range. (values in data space.)
    this.yDomainMin = typeof chartModel.yDomainMin == 'undefined' ? null : chartModel.yDomainMin;
    this.yDomainMax = typeof chartModel.yDomainMax == 'undefined' ? null : chartModel.yDomainMax;

    // y domain padding (percentage)
    this.yDomainPadding = typeof chartModel.yDomainPadding == 'undefined' ? 0 : chartModel.yDomainPadding;


    this.name = chartModel.name;
    //this.area = "";
    this.chartContainer = "";   // aka focus

    var clipRectHeight = this.height - this.margin.top - this.margin.bottom;

    // Pattern line segment collections
    this.visibleSegments = [];

    // Chart annotations
    this.patternAnnotations = [];

    // Indicators
    this.chartIndicators = [];

    // scales
    this.xScale = d3.scale.linear().range([0, this.width]);
    this.yScale = d3.scale.linear().range([clipRectHeight, 0]);

    this.xScale.domain(d3.extent(this.chartData.map(this.dataMapFuncX)));
    this.yScale.domain(d3.extent(this.chartData.map(this.dataMapFuncY)));

    // axis 
    this.xAxis = d3.svg.axis().scale(this.xScale).orient("bottom"),
    this.yAxis = d3.svg.axis().scale(this.yScale).orient("right");    

    // x-axis tick display string
    var data = this.chartData;
    this.xAxis.tickFormat(function (d, i) {
        if (data[d]) {
            return data[d].x.getDate() + "/" + (data[d].x.getMonth() + 1) + "/" + (data[d].x.getFullYear());
        }
    });


    // Chart area
    var xS = this.xScale;
    var yS = this.yScale;

    // SVG Path
    this.pathFunction = d3.svg.line()
        //.interpolate("monotone")
        .defined(function (d) { return d != null && d.y0 != null && !isNaN(d.y0); })
        .x(function (d) { return xS(d.index); })
        .y(function (d) { return yS(d.y0); });
        //.y0(function (d) { return yS(0); })
        //.y1(function (d) { return yS(d.y0); });
    
    // Clipping region    
    this.svg.append("defs")
        .append("clipPath")
        .attr("id", "clip-" + this.name)
        .append("rect")
        .attr("class", "clipRect")
        .attr("width", this.width)
        .attr("height", clipRectHeight);

    // Chart graphics element
    this.chartContainer = this.svg.append("g")
        .attr("class", this.name)
        .attr("transform", "translate(" + chartModel.translateX + "," + chartModel.translateY + ")")

    // Chart axes
    this.chartContainer.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + clipRectHeight + ")")
        .call(this.xAxis);
    this.chartContainer.append("g")
        .attr("class", "y axis")
        //.attr("transform", "translate(" + (this.margin.left + this.width) + ",0)")
        .attr("transform", "translate(" + (this.width) + ",0)")
        .call(this.yAxis);

    // Catch mouse move events with this overlay   
    this.overlay = this.chartContainer.append("rect")
        .attr("class", "mouse_overlay")
        .attr("width", this.width)
        .attr("height", clipRectHeight)
        //.on("mouseover", function () { focus.style("display", null); })
        //.on("mouseout", function () { focus.style("display", "none"); })
        .on("mousemove", chartModel.onMouseMove)
        .on("touchmove", chartModel.onTouchMove)
        .on("touchstart", chartModel.onTouchStart);


    this.chartContainer.append("svg:line")
        .attr("class", "cursor_line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", 0)
        .attr("y2", clipRectHeight);

    this.chartContainer.append("text")
        .attr("class", "cursor_value")
        .attr("x", 10)
        .attr("y", 10)
        .attr("font-family", "sans-serif")
        .attr("font-size", "11px")
        .attr("fill", "black");

    Chart.prototype.addIndicator = function (indicator) {
        this.chartIndicators[indicator.id] = indicator;

        // Add the chart path
        this.chartContainer.insert("path", "g.x.axis")
            .attr("class", "chart_indicator")
            .attr("id", indicator.id)
            .attr("clip-path", "url(#clip-" + this.name + ")")
            .datum(indicator.indicatorData)
            .attr("d", indicator.pathFunction)
            .attr("stroke", "blue")
            .attr("fill", "none")
            .attr("stroke-width", "0.05%");

        this.chartIndicators.push(indicator);
    }

    Chart.prototype.showPatternAnnotation = function (patternId) {
        var patternAnnotation = this.patternAnnotations.filter(function (element, index, array) {
            return patternId == element.patternId;
        });

        for (var i = 0; i < patternAnnotation[0].patternSegments.length; i++) {
            var patternSegment = patternAnnotation[0].patternSegments[i];
            var startDate = patternSegment.startDate;
            var endDate = patternSegment.endDate;

            var startPoint = this.chartData.filter(function (element, index, array) {
                return startDate == toIntDate(array[index].x);
            });
            var endPoint = this.chartData.filter(function (element, index, array) {
                return endDate == toIntDate(array[index].x);
            });

            var segment = [];
            if (startPoint.length == 1 && endPoint.length == 1) {
                segment.push(startPoint[0].index);
                segment.push(endPoint[0].index);
                segment.push(patternId);
            }

            this.visibleSegments.push(segment);
        }


        // Draw the annotation with a path
        //var len = patternAnnotation[0].patternSegments.length;
        //var startDate = patternAnnotation[0].patternSegments[0].startDate;
        //var endDate = patternAnnotation[0].patternSegments[len - 1].endDate;        
        //var startPoint = this.chartData.filter(function (element, index, array) {
        //    return startDate == toIntDate(array[index].x);
        //});
        //var endPoint = this.chartData.filter(function (element, index, array) {
        //    return endDate == toIntDate(array[index].x);
        //});
        //var filtered_data = this.chartData.filter(function (element, index, array) {
        //    return (startPoint[0].index <= array[index].index && array[index].index <= endPoint[0].index);
        //});
        //var xS = this.xScale;
        //var yS = this.yScale;
        //var pathFunction = d3.svg.area()
        //    .interpolate("cardinal-open")
        //    .defined(function (d) { return d.y0 != null && !isNaN(d.y0); })
        //    .x(function (d) { return xS(d.index); })
        //    .y0(function (d) { return yS(d.y[2]); })
        //    .y1(function (d) { return yS(d.y[1]); });
        //this.chartContainer.insert("path", "g.x.axis")
        //    .attr("class", "chart-" + patternId)
        //    .attr("id", "annotation-" + patternId)
        //    .datum(filtered_data)
        //    .attr("clip-path", "url(#clip-" + this.name + ")")
        //    .attr("d", pathFunction);

    }

    Chart.prototype.hidePatternAnnotation = function (patternId) {
        var current_segments = this.visibleSegments.filter(function (element, index, array) {
            return patternId == element[2];
        });

        for (var i = 0; i < current_segments.length; i++) {
            // remove the segement from visible list
            this.visibleSegments.splice(this.visibleSegments.indexOf(current_segments[i]), 1);
        }

        //this.chartContainer.selectAll("#annotation-" + patternId).remove();
    }

    Chart.prototype.drawSegments = function () {
        var xS = this.xScale;
        var yS = this.yScale;
        var data = this.chartData;

        var segmentLine = this.chartContainer.selectAll("line.segment")
            .data(this.visibleSegments);
        segmentLine
            .attr("x1", function (d) { return xS(data[d[0]].index); })
            .attr("x2", function (d) { return xS(data[d[1]].index); })
            .attr("y1", function (d) { return yS(data[d[0]].y0); })
            .attr("y2", function (d) { return yS(data[d[1]].y0); })
        segmentLine.enter()
            .append("svg:line")
            .attr("class", "segment")
            .attr("x1", function (d) { return xS(data[d[0]].index); })
            .attr("x2", function (d) { return xS(data[d[1]].index); })
            .attr("y1", function (d) { return yS(data[d[0]].y0); })
            .attr("y2", function (d) { return yS(data[d[1]].y0); })
            .attr("stroke", function (d) { return "blue"; })
            .attr("stroke-width", 5)
            .attr("clip-path", "url(#clip-" + this.name + ")")
        segmentLine.exit().remove();
    }

    Chart.prototype.onMouseMove = function () {
        var bisectData = d3.bisector(function (d) { return d.index; }).left
        var xS = this.xScale;
        var data = this.chartData;
        var focus = this.chartContainer;
        var cursorTextFunc = this.cursorText;

        var x0 = xS.invert(d3.mouse(this.overlay[0][0])[0]);
        //console.log(d3m[0] + " : " + x0);
        var i = bisectData(data, x0, 1);
        if (i > -1 && i < data.length) {
            var d0 = data[i - 1];
            var d1 = data[i];
            var d = x0 - d0.index > d1.index - x0 ? d1 : d0;
            //console.log(d.date)
            focus.select("text.cursor_value")
                .text(cursorTextFunc(d));

            focus.select("line.cursor_line")
                .style("stroke-opacity", .125)
                .attr("x1", xS(d.index))
                .attr("x2", xS(d.index));
        }
    }

    Chart.prototype.onTouchMove = function () {
        var bisectData = d3.bisector(function (d) { return d.index; }).left
        var xS = this.xScale;
        var data = this.chartData;
        var focus = this.chartContainer;
        var cursorTextFunc = this.cursorText;

        var touches = d3.touches(this.overlay[0][0]);
        var x0 = xS.invert(touches[0][0]);
        //console.log(d3m[0] +  " : " + x0);
        var i = bisectData(data, x0, 1);
        if (i > -1 && i < data.length) {
            var d0 = data[i - 1];
            var d1 = data[i];
            var d = x0 - d0.index > d1.index - x0 ? d1 : d0;
            //console.log(d.date)
            focus.select("text.cursor_value")
                .text(cursorTextFunc(d));

            focus.select("line.cursor_line")
                .style("stroke-opacity", .125)
                .attr("x1", xS(d.index))
                .attr("x2", xS(d.index));
        }
    }

    Chart.prototype.updateCursor = function () {
        var clipRectHeight = this.height - this.margin.top - this.margin.bottom;

        this.chartContainer.select(".mouse_overlay")
            .attr("width", this.width)
            .attr("height", clipRectHeight);

        this.chartContainer
            .select(".cursor_line")
            .attr("y2", clipRectHeight);
    }

    // Update the chart
    Chart.prototype.update = function (width, height, translateX, translateY) {
        this.width = width;
        this.height = height;
        this.translateX = translateX;
        this.translateY = translateY;

        var clipRectHeight = this.height - this.margin.top - this.margin.bottom;

        // clipping region
        this.svg.select("#clip-" + this.name)
            .select(".clipRect")
            .attr("width", this.width)
            .attr("height", clipRectHeight);

        // scales
        this.xScale
            .range([0, this.width])
            .domain(d3.extent(this.chartData.map(this.dataMapFuncX)));
        this.yScale
            .range([clipRectHeight, 0])
            .domain(d3.extent(this.chartData.map(this.dataMapFuncY)));

        //var xS = this.xScale;
        //var yS = this.yScale;
        //this.pathFunction
            //.interpolate("monotone")
            //.defined(function (d) { return d.y0 != null && !isNaN(d.y0); })
            //.x(function (d) { return xS(d.index); })
            //.y(function (d) { return yS(d.y0); });
            //.y1(function (d) { return yS(d.y0); });

        // Graphics element
        this.chartContainer.attr("transform", "translate(" + translateX + "," + translateY + ")")

        // Chart line path
        //this.chartContainer.select("path").datum(this.chartData).attr("d", this.pathFunction);

        // Chart axes
        this.chartContainer.select(".x.axis")
            .attr("transform", "translate(0, " + clipRectHeight + ")")
            .call(this.xAxis);
        this.chartContainer.select(".y.axis")
            //.attr("transform", "translate(" + (this.margin.left + this.width) + ", " + 0 + ")")
            .attr("transform", "translate(" + (this.width) + ", " + 0 + ")")
            .call(this.yAxis);


    }

    // Zoom or pan the context
    Chart.prototype.onBrush = function (brush) {
        var filtered_data;
        var xDomain;
        var yDomain;

        if (brush.empty()) {
            filtered_data = this.chartData;
            xDomain = d3.extent(this.chartData.map(this.dataMapFuncX));
            yDomain = d3.extent(this.chartData.map(this.dataMapFuncY));
        }
        else {
            var brush_extent = brush.extent();
            filtered_data = this.chartData.filter(function (element, index, array) {
                return (brush_extent[0] <= array[index].x && array[index].x <= brush_extent[1]);
            });
            xDomain = [d3.min(filtered_data, this.dataMapFuncX),
                d3.max(filtered_data, this.dataMapFuncX)];
            //var high_prices = filtered_data.map(function (d) { return d.y[1] });
            //var low_prices = filtered_data.map(function (d) { return d.y[2] });
            var high_prices = filtered_data.map(function (d) { return d.y0 });
            var low_prices = filtered_data.map(function (d) { return d.y0 });
            yDomain = [d3.min(low_prices), d3.max(high_prices)];
        }

        this.xScale.domain(xDomain);
        this.yScale.domain(yDomain);
        
        this.chartContainer.select("path").datum(filtered_data).attr("d", this.pathFunction);
        this.chartContainer.select(".x.axis").call(this.xAxis);
        this.chartContainer.select(".y.axis").call(this.yAxis);

        this.drawSegments();
    }
};

function CandlestickChart(chartModel) {
    // Call super class constructor
    Chart.call(this, chartModel);

    this.barMargin = chartModel.barMargin;
    this.hasChartPath = true;

    // Chart line path
    this.chartContainer.append("path")
        .attr("class", "chart")
        .datum(this.chartData)
        .attr("clip-path", "url(#clip-" + this.name + ")")
        .attr("d", this.pathFunction)
        .attr("stroke", "black")
        .attr("fill", "none")
        .attr("stroke-width", "0.05%");

    // Update the chart
    //CandlestickChart.prototype.update = function (width, height, translateX, translateY) {
    //    Chart.prototype.update.call(this, width, height, translateX, translateY);

    //    console.log("CandlestickChart update");
    //    this.onBrush(chartContext.brush);
    //}

    // Zoom or pan the context
    CandlestickChart.prototype.onBrush = function (brush) {
        var filtered_data;
        var xDomain;
        var yDomain;

        if (!brush || brush.empty()) {
            filtered_data = this.chartData;
            xDomain = d3.extent(this.chartData.map(this.dataMapFuncX));
            //xDomain = brush.extent();
            yDomain = d3.extent(this.chartData.map(this.dataMapFuncY));
        }
        else {
            var brush_extent = brush.extent();

            filtered_data = this.chartData.filter(function (element, index, array) {
                return (brush_extent[0] <= array[index].x && array[index].x <= brush_extent[1]);
            });

            xDomain = [d3.min(filtered_data, this.dataMapFuncX),
                d3.max(filtered_data, this.dataMapFuncX)];
            var high_prices = filtered_data.map(function (d) { return d.y[1] });
            var low_prices = filtered_data.map(function (d) { return d.y[2] });
            yDomain = [d3.min(low_prices), d3.max(high_prices)];
        }

        //xDomain[0] = xDomain[0] - 1;
        this.xScale.domain(xDomain);
        this.yScale.domain(yDomain);

        var prevHasChartPath = this.hasChartPath;
        var bar_width = 0.40 * (this.width - 2 * this.barMargin.side) / filtered_data.length;
        if (filtered_data.length > 0 && bar_width > this.barMargin.side) {
            // Remove the line chart
            //this.chartContainer.select("path").datum(new Array()).attr("d", this.area);
            if (prevHasChartPath === true) {
                this.chartContainer.selectAll("path.chart").remove();
                this.hasChartPath = false;
            }

            // Draw the price bars
            this.updateOHLC(filtered_data, bar_width);
        }
        else {
            if (prevHasChartPath === false) {
                // Add the chart path
                this.chartContainer.insert("path", "g.x.axis")
                    .attr("class", "chart")
                    .datum(this.chartData)
                    .attr("clip-path", "url(#clip-" + this.name + ")")
                    .attr("d", this.pathFunction);
                this.hasChartPath = true;
            }
            else {
                // Update the chart path
                this.chartContainer.select("path.chart").datum(this.chartData).attr("d", this.pathFunction);
                //this.chartContainer.selectAll("path").attr("d", this.pathFunction);
            }

            if (prevHasChartPath != this.hasChartPath) {
                // Remove the OHLC candlesticks
                this.chartContainer.selectAll("rect.candlebody").remove();
                this.chartContainer.selectAll("line.stem").remove();
                this.chartContainer.selectAll("line.close_stem").remove();
                this.chartContainer.selectAll("line.open_stem").remove();
            }
        }

        //this.chartContainer.selectAll("path.chart_indicator").attr("d", this.pathFunction);
    }

    CandlestickChart.prototype.updateOHLC = function (filtered_data, bar_width) {

        var bar_color = function (d) {
            return d.y[0] == d.y[3] ?
                "stroke:#000000;" : (d.y[0] > d.y[3] ? "stroke:#FF0000;" : "stroke:#006600;");
        };
        var xS = this.xScale;
        var yS = this.yScale;

        // Draw candlesticks
        var stem = this.chartContainer.selectAll("line.stem")
                        .data(filtered_data);
        stem.attr("x1", function (d) { return xS(d.index) })
            .attr("x2", function (d) { return xS(d.index); })
            .attr("y1", function (d) { return yS(d.y[2]); })    // High
            .attr("y2", function (d) { return yS(d.y[1]); })    // Low
            .attr("style", function (d) { return bar_color(d); })
        stem.enter().append("svg:line")
            .attr("class", "stem")
            .attr("x1", function (d) { return xS(d.index) })
            .attr("x2", function (d) { return xS(d.index); })
            .attr("y1", function (d) { return yS(d.y[2]); })    // High
            .attr("y2", function (d) { return yS(d.y[1]); })    // Low
            .attr("style", function (d) { return bar_color(d); })
        stem.exit().remove();

        var open_stem = this.chartContainer.selectAll("line.open_stem")
                        .data(filtered_data);
        open_stem.attr("x1", function (d) { return xS(d.index) - bar_width; })
            .attr("x2", function (d) { return xS(d.index); })
            .attr("y1", function (d) { return yS(d.y[0]); })    // Open
            .attr("y2", function (d) { return yS(d.y[0]); })
            .attr("style", function (d) { return bar_color(d); })
        open_stem.enter().append("svg:line")
            .attr("class", "open_stem")
            .attr("x1", function (d) { return xS(d.index) - bar_width; })
            .attr("x2", function (d) { return xS(d.index); })
            .attr("y1", function (d) { return yS(d.y[0]); })    // Open
            .attr("y2", function (d) { return yS(d.y[0]); })
            .attr("style", function (d) { return bar_color(d); })
            .attr("clip-path", "url(#clip-" + this.name + ")")
        open_stem.exit().remove();

        var close_stem = this.chartContainer.selectAll("line.close_stem")
                        .data(filtered_data);
        close_stem.attr("x1", function (d) { return xS(d.index) + bar_width; })
            .attr("x2", function (d) { return xS(d.index); })
            .attr("y1", function (d) { return yS(d.y[3]); })    // Close
            .attr("y2", function (d) { return yS(d.y[3]); })
            .attr("style", function (d) { return bar_color(d); })
        close_stem.enter().append("svg:line")
            .attr("class", "close_stem")
            .attr("x1", function (d) { return xS(d.index) + bar_width; })
            .attr("x2", function (d) { return xS(d.index); })
            .attr("y1", function (d) { return yS(d.y[3]); })    // Close
            .attr("y2", function (d) { return yS(d.y[3]); })
            .attr("style", function (d) { return bar_color(d); })
            .attr("clip-path", "url(#clip-" + this.name + ")")
        close_stem.exit().remove();
    };
};
// Inherit from Chart type
CandlestickChart.prototype = Object.create(Chart.prototype);
CandlestickChart.constructor = CandlestickChart;


function BarChart(chartModel) {
    // Call super class constructor
    Chart.call(this, chartModel);

    this.barMargin = chartModel.barMargin;
    this.hasChartPath = true;

    // Chart line path
    this.chartContainer.append("path")
        .attr("class", "chart")
        .datum(this.chartData)
        .attr("clip-path", "url(#clip-" + this.name + ")")
        .attr("d", this.pathFunction)
        .attr("stroke", "black")
        .attr("fill", "none")
        .attr("stroke-width", "0.05%");

    // Update the chart
    //BarChart.prototype.update = function (width, height, translateX, translateY) {
    //    Chart.prototype.update.call(this, width, height, translateX, translateY);

    //    console.log("BarChart update");
    //    this.onBrush(chartContext.brush);
    //}

    // Zoom or pan the context
    BarChart.prototype.onBrush = function (brush) {
        var filtered_data;
        var xDomain;
        var yDomain;

        if (brush.empty()) {
            filtered_data = this.chartData;
            xDomain = d3.extent(this.chartData.map(this.dataMapFuncX));
            yDomain = d3.extent(this.chartData.map(this.dataMapFuncY));
        }
        else {
            var brush_extent = brush.extent();
            filtered_data = this.chartData.filter(function (element, index, array) {
                return (brush_extent[0] <= array[index].x && array[index].x <= brush_extent[1]);
            });

            xDomain = [d3.min(filtered_data, this.dataMapFuncX),
                        d3.max(filtered_data, this.dataMapFuncX)];
            yDomain = d3.extent(filtered_data.map(this.dataMapFuncY));
        }

        this.xScale.domain(xDomain);
        this.yScale.domain(yDomain);


        var bar_width = 0.40 * (this.width - 2 * this.barMargin.side) / filtered_data.length;
        if (filtered_data.length > 0 && bar_width > this.barMargin.side) {
            // Remove the line chart
            //this.chartContainer.select("path").data([new Array()]).attr("d", this.area);
            if (this.hasChartPath === true) {
                this.id = this.chartContainer.select("path.chart").attr("id")
                this.chartContainer.selectAll("path.chart").remove();
                this.hasChartPath = false;
            }

            // Draw the price bars
            this.updateBarChart(filtered_data, bar_width);
        }
        else {
            // Remove the bars
            this.chartContainer.selectAll("rect.bar").remove();

            //this.chartContainer.select("path").data([filtered_data]).attr("d", this.area);
            if (this.hasChartPath === false) {
                this.chartContainer.insert("path", "g.x.axis")
                    .attr("class", "chart")
                    .datum(this.chartData)
                    .attr("clip-path", "url(#clip-" + this.name + ")")
                    .attr("d", this.pathFunction)
                    .attr("id", this.id);   // restore the main path id
                this.hasChartPath = true;
            }
            else {
                this.chartContainer.select("path").attr("d", this.pathFunction);
            }
        }

        this.chartContainer.select(".x.axis").call(this.xAxis);
        this.chartContainer.select(".y.axis").call(this.yAxis);
    }

    BarChart.prototype.updateBarChart = function (filtered_data, bar_width) {
        // Draw volume bars
        var xS = this.xScale;
        var yS = this.yScale;
        //var height = this.height - this.margin.top - this.margin.bottom;

        var bars = this.chartContainer.selectAll("rect.bar").data(filtered_data);
        bars.attr("class", "bar")
            .attr("x", function (d, i) { return xS(d.index) - (bar_width / 2); })
            .attr("y", function (d) { return !isNaN(d.y0) ? yS(d.y0) : 0; })
            .attr("width", bar_width)
            //.attr("height", function (d) {
            //    //return !isNaN(d.y0) ? height - yS(d.y0) : -1;
            //    if (!isNaN(d.y0) && d.y0 != null) {
            //        return height - yS(d.y0);
            //    }
            //    else {
            //        return 1;
            //    }
            //});
            .attr("height", function (d) {
                var y = yS(0);
                return y;
            });
        bars.enter().append("svg:rect")
            .attr("class", "bar")
            .attr("x", function (d, i) { return xS(d.index) - (bar_width / 2); })
            .attr("y", function (d) { return !isNaN(d.y0) ? yS(d.y0) : 0; })
            .attr("width", bar_width)
            //.attr("height", function (d) {
            //    //return !isNaN(d.y0) ? height - yS(d.y0) : -1;
            //    if (!isNaN(d.y0) && d.y0 != null) {
            //        var ys = yS(d.y0);
            //        return height - ys;
            //    }
            //    else {
            //        return 1;
            //    }
            //})
            .attr("height", function (d) {
                var y = yS(0);
                return y;
            })
            .attr("clip-path", "url(#clip-" + this.name + ")");
        bars.exit().remove();
    }
};
// Inherit from Chart type
BarChart.prototype = Object.create(Chart.prototype);
BarChart.constructor = BarChart;



function CanvasCandlestickChart(chartModel) {
    // Call super class constructor
    Chart.call(this, chartModel);

    this.barMargin = chartModel.barMargin;
    this.hasChartPath = true;

    var clipRectHeight = this.height - this.margin.top - this.margin.bottom;

    // HTML5 Canvas
    d3.select("#chart").append("canvas")
        .attr("id", "canvas-" + this.name)
        .attr("style", "position: absolute; left: " + this.translateX + "px; top: " + this.translateY + "px; z-index: -100;")
        //.attr("style", "position: absolute; top: 0; left: 0; border: 1px solid red; z-index: -100;")
        .attr("width", this.width)
        .attr("height", clipRectHeight);

    // Update the chart
    CanvasCandlestickChart.prototype.update = function (width, height, translateX, translateY) {
        Chart.prototype.update.call(this, width, height, translateX, translateY);

        var canvas = document.getElementById("canvas-" + this.name);
        canvas.setAttribute("style", "position: absolute; left: " + this.translateX + "px; top: " + (this.translateY) + "px; z-index: -100;")
    }

    // Zoom or pan the context
    CanvasCandlestickChart.prototype.onBrush = function (brush, xDomain, xRange) {
        var filtered_data;
        //var xDomain;
        var yDomain;

        if (brush.empty()) {
            filtered_data = this.chartData;
            //xDomain = d3.extent(this.chartData.map(this.dataMapFuncX));
            //yDomain = d3.extent(this.chartData.map(this.dataMapFuncY));
        }
        else {
            if (typeof xRange != 'undefined' && xRange != null) {
                filtered_data = this.chartData.slice(xRange[0], xRange[1] + 1);
                //var brush_extent = brush.extent();
                //filtered_data = this.chartData.filter(function (element, index, array) {
                //    return (brush_extent[0] <= array[index].x && array[index].x <= brush_extent[1]);
                //});
            }
            else {
                var brush_extent = brush.extent();
                filtered_data = this.chartData.filter(function (element, index, array) {
                    return (brush_extent[0] <= array[index].x && array[index].x <= brush_extent[1]);
                });
            }

        }

        //xDomain = [d3.min(filtered_data, this.dataMapFuncX),
        //    d3.max(filtered_data, this.dataMapFuncX)];
        if (typeof xDomain == 'undefined' || xDomain == null) {
            xDomain = d3.extent(filtered_data.map(this.dataMapFuncX));
        }
        //else {
        //    console.log("why");
        //}

        var high_prices = filtered_data.map(function (d) { return d.y[1] });
        var low_prices = filtered_data.map(function (d) { return d.y[2] });
        yDomain = [d3.min(low_prices), d3.max(high_prices)];

        xDomain[0] = xDomain[0] - 1;
        xDomain[1] = xDomain[1] + 1;
        // Custom domain range
        if (this.yDomainMin != null) {
            yDomain[0] = this.yDomainMin;
        }
        if (this.yDomainMax != null) {
            yDomain[1] = this.yDomainMax;
        }

        if (this.yDomainPadding > 0) {
            var yDomainDelta = (yDomain[1] - yDomain[0]) * this.yDomainPadding;
            yDomain[0] = yDomain[0] - yDomainDelta;
            yDomain[1] = yDomain[1] + yDomainDelta;
        }

        this.xScale.domain(xDomain);
        this.yScale.domain(yDomain);

        for (var i = 0; i < this.chartIndicators.length; i++) {
            this.chartIndicators[i].onBrush(this.chartContainer, brush, xDomain, xRange);
        }

        var bar_width = 0.40 * (this.width - 2 * this.barMargin.side) / filtered_data.length;

        this.chartContainer.select(".x.axis").call(this.xAxis);
        this.chartContainer.select(".y.axis").call(this.yAxis);

        this.drawSegments();
        if (filtered_data.length > 0 && bar_width > this.barMargin.side) {
            this.hasChartPath = false;
        }
        else {
            this.hasChartPath = true;
        }


        var canvas = document.getElementById("canvas-" + this.name);
        canvas.setAttribute("width", this.width);
        canvas.setAttribute("height", (this.height - this.margin.top - this.margin.bottom));
        canvas.setAttribute("style", "position: absolute; left: " + this.translateX + "px; top: " + this.translateY + "px; z-index: -100;")
        if (canvas.getContext) {
            var ctx = canvas.getContext('2d');

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            if (this.hasChartPath === true) {
                drawLineChart(ctx, this, filtered_data);
            }
            else {
                drawOhlcChart(ctx, this, filtered_data, bar_width);
            }
        } else {
            // canvas-unsupported code here
        }
    }
};
// Inherit from Chart type
CanvasCandlestickChart.prototype = Object.create(Chart.prototype);
CanvasCandlestickChart.constructor = CanvasCandlestickChart;


function CanvasBarChart(chartModel) {
    // Call super class constructor
    Chart.call(this, chartModel);

    this.barMargin = chartModel.barMargin;
    this.hasChartPath = true;

    var clipRectHeight = this.height - this.margin.top - this.margin.bottom;

    // HTML5 Canvas
    d3.select("#chart").append("canvas")
        .attr("id", "canvas-" + this.name)
        .attr("style", "position: absolute; left: " + this.translateX + "px; top: " + this.translateY + "px; z-index: -100;")
        //.attr("style", "position: absolute; top: 0; left: 0; border: 1px solid red; z-index: -100;")
        .attr("width", this.width)
        .attr("height", clipRectHeight);

    // Update the chart
    CanvasBarChart.prototype.update = function (width, height, translateX, translateY) {
        Chart.prototype.update.call(this, width, height, translateX, translateY);

        var canvas = document.getElementById("canvas-" + this.name);
        canvas.setAttribute("style", "position: absolute; left: " + this.translateX + "px; top: " + (this.translateY) + "px; z-index: -100;")
    }

    // Zoom or pan the context
    CanvasBarChart.prototype.onBrush = function (brush, xDomain, xRange) {
        var filtered_data;
        //var xDomain;
        var yDomain;

        if (brush.empty()) {
            filtered_data = this.chartData;
            //xDomain = d3.extent(this.chartData.map(this.dataMapFuncX));
            //yDomain = d3.extent(this.chartData.map(this.dataMapFuncY));
        }
        else {
            if (typeof xRange != 'undefined' && xRange != null) {
                filtered_data = this.chartData.slice(xRange[0], xRange[1] + 1);
            }
            else {
                var brush_extent = brush.extent();
                filtered_data = this.chartData.filter(function (element, index, array) {
                    return (brush_extent[0] <= array[index].x && array[index].x <= brush_extent[1]);
                });
            }            

            //xDomain = d3.extent(filtered_data.map(this.dataMapFuncX));
            //yDomain = d3.extent(filtered_data.map(this.dataMapFuncY));
        }

        yDomain = d3.extent(filtered_data.map(this.dataMapFuncY));
        if (typeof xDomain == 'undefined' || xDomain == null) {
            xDomain = d3.extent(filtered_data.map(this.dataMapFuncX));
        }

        xDomain[0] = xDomain[0] - 1;
        xDomain[1] = xDomain[1] + 1;
        if (this.yDomainMin != null) {
            yDomain[0] = this.yDomainMin;
        }
        if (this.yDomainMax != null) {
            yDomain[1] = this.yDomainMax;
        }

        this.xScale.domain(xDomain);
        this.yScale.domain(yDomain);

        //for (var i = 0; i < this.chartIndicators.length; i++) {
        //    this.chartIndicators[i].onBrush(this.chartContainer, brush);
        //}

        var bar_width = 0.45 * (this.width - 2 * this.barMargin.side) / filtered_data.length;

        this.chartContainer.select(".x.axis").call(this.xAxis);
        this.chartContainer.select(".y.axis").call(this.yAxis);

        this.drawSegments();
        if (filtered_data.length > 0 && bar_width > this.barMargin.side) {
            this.hasChartPath = false;
        }
        else {
            this.hasChartPath = true;
        }


        var canvas = document.getElementById("canvas-" + this.name);
        canvas.setAttribute("width", this.width);
        canvas.setAttribute("height", (this.height - this.margin.top - this.margin.bottom));        
        if (canvas.getContext) {
            var ctx = canvas.getContext('2d');

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            if (this.hasChartPath === true) {
                drawLineChart(ctx, this, filtered_data, this.yDomainMin);
            }
            else {
                drawBarChart(ctx, this, filtered_data, bar_width);
            }
        } else {
            // canvas-unsupported code here
        }
    }
};
// Inherit from Chart type
CanvasBarChart.prototype = Object.create(Chart.prototype);
CanvasBarChart.constructor = CanvasBarChart;