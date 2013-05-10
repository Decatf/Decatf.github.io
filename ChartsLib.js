
var Type;
var Url;
var Data;
var ContentType;
var DataType;
var ProcessData;

function min(a, b) { return a < b ? a : b; }
function max(a, b) { return a > b ? a : b; }
var parseDate = d3.time.format("%Y%m%d").parse;
function toIntDate(dt) {
    return (dt.getFullYear() * 10000) + ((dt.getMonth() + 1) * 100) + dt.getDate();
}

// Function to call WCF  Service       
function CallService(symbol) {
    Type = "POST";
    Url = "http://localhost:8080/Service.svc/GetSymbol";
    Data = '{"symbol": "' + symbol + '"}';
    ContentType = "application/json; charset=utf-8";
    DataType = "json"; varProcessData = true;

    $.ajaxSetup({
        error: function (x, e) {
            ServiceFailed(x, e);
        }
    });

    $.ajax({
        type: Type, //GET or POST or PUT or DELETE verb
        url: Url, // Location of the service
        data: Data, //Data sent to server
        contentType: ContentType, // content type sent to server
        dataType: DataType, //Expected data format from server
        processdata: ProcessData, //True or False
        success: function (msg) {//On Successfull service call
            ServiceSucceeded(msg);
        }
        //error: ServiceFailed// When Service call fails
    });
}

function ServiceSucceeded(result) {
    if (DataType == "json") {
        var p = document.getElementById("resultText");
        p.innerHTML = result.d["Exchange"] + " " + result.d["Symbol"];

        //$(document.body).append("<br>" + result.d["Close"]);

        //$.each(result.d["Close"], function (index, value) {
        //    $(document.body).append(result.d["Dates"][index] + " " + result.d["Close"][index] + "<br>");
        //});

        var close = result.d["Close"];
        var high = result.d["High"];
        var low = result.d["Low"];
        var open = result.d["Open"];
        var volume = result.d["Volume"];
        var dates = result.d["Dates"];
        data = dates.map(function (element, index) {            
            var dt = parseDate(String(element));
            return {
                index: index,
                date: dt,
                close: close[index],
                high: high[index],
                low: low[index],
                open: open[index],
                volume: volume[index]
            };
        });

        DrawFocusContextChart2(data);

        $.ajax({
            url: "data/" + result.d["Symbol"] + ".txt",
            success: function (data) {
                //console.log(data);
                parsePatternJson(data);
            }
        });
    }
}

function ServiceFailed(x, e) {
    if (x.status == 0) {
        console.log('You are offline!!\n Please Check Your Network.');
    } else if (x.status == 404) {
        console.log('Requested URL not found.');
    } else if (x.status == 500) {
        console.log('Internal Server Error.');
    } else if (e == 'parsererror') {
        console.log('Error.\nParsing JSON Request failed.');
    } else if (e == 'timeout') {
        console.log('Request Time out.');
    } else {
        console.log('Unknow Error.\n' + x.responseText);
    }

    wcf_error = true;

    return;
}

function GetYahooData(symbol) {
    var get_prices = historical_prices();
    var temp = get_prices(symbol, function (array) {
        data = array.map(function (element, index) {
            var adj_close = parseFloat(element["adj close"]);
            var adj_factor = adj_close / element["close"];
            var parseDate = d3.time.format("%Y-%m-%d").parse;
            var dt = parseDate(element["date"]);
            return {              
                index: array.length - 1 - index,
                date: dt,
                close: adj_close,
                high: element["high"] * adj_factor,
                low: element["low"] * adj_factor,
                open: element["open"] * adj_factor,
                volume: parseFloat(element["volume"])
            };
        });

        data = data.reverse();
        console.log(symbol);

        DrawFocusContextChart2(data);

        $.ajax({
            url: "data/" + symbol + ".txt",
            success: function (data) {
                //console.log(data);
                parsePatternJson(data);
            }
        });
    });

   


}

var data;
var bisectData;
var margin, margin1, margin2;
var width, height, height1, height2;
var bar_margin;
var x, x2, y, y1, y2;
var xAxis, xAxis2;
var yAxis;
var brush;
var area;
var area2;
var svg;
var focus, focus_2;
var context;

function initChart() {
    data = new Array();
    bisectData = d3.bisector(function (d) { return d.index; }).left;

    margin = { top: 10, right: 40, bottom: 190, left: 10 },
    margin1 = { top: 435, right: 40, bottom: 115, left: 10 },
    margin2 = { top: 520, right: 40, bottom: 20, left: 10 },
    width = 960 - margin.left - margin.right,
    height = 600 - margin.top - margin.bottom,
    height1 = 600 - margin1.top - margin1.bottom,
    height2 = 600 - margin2.top - margin2.bottom;
    bar_margin = { side: 1, top: 10 };

    //var x = d3.time.scale().range([0, width]),
    //x2 = d3.time.scale().range([0, width]),
    //    x2 = d3.scale.linear().range([0, width]),
    x = d3.scale.linear().range([0, width]),
            x2 = d3.time.scale().range([0, width]),
    //var x = d3.scale.ordinal().rangePoints([0, width]),
    //        x2 = d3.time.scale().range([0, width]),

        y = d3.scale.linear().range([height, 0]),
        y1 = d3.scale.linear().range([height1, 0]),
        y2 = d3.scale.linear().range([height2, 0]);

    xAxis = d3.svg.axis().scale(x).orient("bottom"),
    xAxis2 = d3.svg.axis().scale(x2).orient("bottom"),
    yAxis = d3.svg.axis().scale(y).orient("right");

    brush = d3.svg.brush()
        .x(x2)
        .on("brush", brushed)

    area = d3.svg.area()
        //.interpolate("monotone")
        .x(function (d) { return x(d.index); })
        .y0(height)
        .y1(function (d) { return y(d.close); });

    area2 = d3.svg.area()
        //.interpolate("monotone")
        .x(function (d) { return x2(d.date); })
        .y0(height2)
        .y1(function (d) { return y2(d.close); });

    svg = d3.select("#chart")
        .append("svg")
        .attr("class", "chart")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);

    svg.append("defs").append("clipPath")
        .attr("id", "clip")
        .append("rect")
        .attr("width", width)
        .attr("height", height);

    svg.append("defs").append("clipPath")
        .attr("id", "clip2")
        .append("rect")
        .attr("width", width)
        .attr("height", height1)
        .attr("transform", "translate(" + margin1.left + "," + margin1.top + ")");

    focus = svg.append("g")
        .attr("class", "top_area")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .attr("width", width - margin.right - margin.left);

    focus_2 = svg.append("g")
        .attr("class", "volume_area")
        .attr("transform", "translate(" + margin1.left + "," + margin1.top + ")")
        .attr("width", width - margin1.right - margin1.left);

    context = svg.append("g")
        .attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");
}

function brushed() {
    focus.select("line.cursor").style("stroke-opacity", 0);
    focus_2.select("line.cursor").style("stroke-opacity", 0);

    var brush_extent = brush.extent();
    var filtered_data = data.filter(function (element, index, array) {
        return (brush_extent[0] <= (array[index].date) && (array[index].date) <= brush_extent[1]);
        //return (x(element) >= brush_extent[0] && x(element) <= brush_extent[1]);
    });
    x.domain(brush.empty() ? d3.extent(data.map(function (d) { return d.index; })) :
        [d3.min(filtered_data, function (d) { return d.index; }),
        d3.max(filtered_data, function (d) { return d.index; })]);

    //x.domain(brush.empty() ? d3.range(data.length) :                
    //    filtered_data.map(function (d) { return d.date.getDate(); }));

    var high_prices = filtered_data.map(function (array) { return array.high });
    var low_prices = filtered_data.map(function (array) { return array.low });
    y.domain(filtered_data.length > 0 ? [d3.min(low_prices), d3.max(high_prices)] : y2.domain());

    y1.domain(filtered_data.length > 0 ?
        [d3.min(filtered_data.map(function (array) { return array.volume })),
            d3.max(filtered_data.map(function (array) { return array.volume }))] : y2.domain());

    var bar_width = 0.40 * (width - 2 * bar_margin.side) / filtered_data.length;

    if (filtered_data.length > 0 && bar_width > bar_margin.side) {
        // Don't draw line chart
        focus.select("path").data([new Array()]);
        focus.select("path").attr("d", area);

        // Draw candlesticks
        var stem = focus.selectAll("line.stem")
                        .data(filtered_data);
        stem.attr("x1", function (d) { return x(d.index) })
            .attr("x2", function (d) { return x(d.index); })
            .attr("y1", function (d) { return y(d.high); })
            .attr("y2", function (d) { return y(d.low); })
            .attr("stroke", function (d) { return d.open > d.close ? "red" : "green"; });
        stem.enter().append("svg:line")
            .attr("class", "stem")
            .attr("x1", function (d) { return x(d.index) })
            .attr("x2", function (d) { return x(d.index); })
            .attr("y1", function (d) { return y(d.high); })
            .attr("y2", function (d) { return y(d.low); })
            .attr("stroke", function (d) { return d.open > d.close ? "red" : "green"; })
        stem.exit().remove();

        var candleBody = focus.selectAll("rect.candlebody")
                        .data(filtered_data);
        candleBody.attr("x", function (d) { return x(d.index) - bar_width; })
                .attr("y", function (d) { return y(max(d.open, d.close)); })
                .attr("height", function (d) {
                    var body_height = y(min(d.open, d.close)) - y(max(d.open, d.close));
                    body_height = body_height != 0 ? body_height : 1;
                    return body_height;
                })
                .attr("width", function (d) { return 2 * bar_width; })
                .attr("fill", function (d) {
                    return d.open != d.close ? (d.open > d.close ? "red" : "green") : "black";
                });
        candleBody.enter().append("svg:rect")
            .attr("class", "candlebody")
            .attr("x", function (d) { return x(d.index) - bar_width; })
            .attr("y", function (d) { return y(max(d.open, d.close)); })
            .attr("height", function (d) {
                var body_height = y(min(d.open, d.close)) - y(max(d.open, d.close));
                body_height = body_height != 0 ? body_height : 1;
                return body_height;
            })
            .attr("width", function (d) { return 2 * bar_width; })
            .attr("fill", function (d) { return d.open != d.close ? (d.open > d.close ? "red" : "green") : "black"; });

        candleBody.exit().remove();
    }
    else {
        focus.selectAll("rect.candlebody").remove();
        focus.selectAll("line.stem").remove();

        // Draw line chart
        focus.select("path").data([filtered_data]);
        focus.select("path").attr("d", area);
    }

    // Draw volume bars
    var volBars = focus_2.selectAll("rect.bar").data(filtered_data);
    volBars.attr("class", "bar")
        .attr("x", function (d, i) { return x(d.index) - (bar_width / 2); })
        .attr("y", function (d) { return y1(d.volume); })
        .attr("width", bar_width)
        .attr("height", function (d) { return height1 - y1(d.volume); });
    volBars.enter().append("svg:rect")
        .attr("class", "bar")
        .attr("x", function (d, i) { return x(d.index) - (bar_width / 2); })
        .attr("y", function (d) { return y1(d.volume); })
        .attr("width", bar_width)
        .attr("height", function (d) { return height1 - y1(d.volume); });
    volBars.exit().remove();

    drawSegments();

    focus.select(".x.axis").call(xAxis);
    focus.select(".y.axis").call(yAxis);
}

function mousemove() {
    var x0 = x.invert(d3.mouse(this)[0]),
        i = bisectData(data, x0, 1),
        d0 = data[i - 1],
        d1 = data[i],
        d = x0 - d0.index > d1.index - x0 ? d1 : d0;
    //console.log(d.date)
    focus.select("text.date")
        .text(d.date.toDateString() +
        " - O: " + d.open +
        " H: " + d.high +
        " L: " + d.low +
        " C: " + d.close);

    focus.select("line.cursor")
        .style("stroke-opacity", .125)
        .attr("x1", x(d.index))
        .attr("x2", x(d.index));
    focus_2.select("line.cursor")
        .style("stroke-opacity", .125)
        .attr("x1", x(d.index))
        .attr("x2", x(d.index));
}

function DrawFocusContextChart2(data) {

    focus.selectAll("*").remove();
    focus_2.selectAll("*").remove();
    context.selectAll("*").remove();

    $("#pattern_list").children().remove();


    //x.domain(data.map(function (d) { return d.date; }));
    //x.domain(d3.range(data.length));
    x.domain(d3.extent(data.map(function (d) { return d.index; })));
    //y.domain([0, d3.max(data.map(function (d) { return d.price; }))]);
    y.domain(d3.extent(data.map(function (d) { return d.close; })));
    y1.domain(d3.extent(data.map(function (d) { return d.volume; })));
    x2.domain(d3.extent(data.map(function (d) { return d.date; })));
    y2.domain(y.domain());

    // Catch mouse move events with this overlay
    var overlay = focus.append("rect")
        .attr("class", "overlay")
        .attr("width", width)
        .attr("height", height)
        //.on("mouseover", function () { focus.style("display", null); })
        //.on("mouseout", function () { focus.style("display", "none"); })
        .on("mousemove", mousemove);

    focus.append("svg:line")
        .attr("class", "cursor")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", 0)
        .attr("y2", height);
    
    focus_2.append("svg:line")
        .attr("class", "cursor")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", 0)
        .attr("y2", height1);

    focus.append("text")
        .text("Label")
        .attr("class", "date")
        .attr("x", 10)
        .attr("y", 10)
        .attr("font-family", "sans-serif")
        .attr("font-size", "11px")
        .attr("fill", "black");


    var chartBody = focus.append("g")
        .attr("class", "chart_body_path")
        //.datum(data)
        .attr("clip-path", "url(#clip)")
        //.attr("d", area);

    var chartVolumeBody = focus_2.append("g")
        .attr("class", "chart_volume_path")
        .attr("clip-path", "url(#clip2)");

    focus.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    focus.append("g")
        .attr("class", "y axis")
        .attr("transform", "translate(" + (width + margin.left) + ", 0)")
        .call(yAxis);

    context.append("path")
        .datum(data)
        .attr("d", area2);

    context.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height2 + ")")
        .call(xAxis2);

    context.append("g")
        .attr("class", "x brush")
        .call(brush)
      .selectAll("rect")
        .attr("y", -6)
        .attr("height", height2 + 7);

    // Line chart
    var line = d3.svg.line()
        .x(function (d, i) { return x(d.index); })
        .y(function (d) { return y(d.close); });

    chartBody.append("svg:path")
        .data([data])
        .attr("class", "path")
        .attr("d", line);
}



