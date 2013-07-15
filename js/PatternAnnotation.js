// Breakouts list
var patternBreakouts = [];
// Array of dates with symbols that have breakouts
var breakoutDayDict;

function readJsonFile(data) {
    //console.log(this.result);

    var obj = JSON.parse(data);

    // dictionary of symbols containing the breakouts for each symbol
    patternJsonData = obj[1];

    // Breakouts list
    var breakoutsList = obj[0];
    breakoutsList.sort(function (a, b) {
        return parseInt(b[1]) - parseInt(a[1]);
    });

    for (var i = 1; i < breakoutsList.length; i++) {
        var entries = breakoutsList[i];
        var pb = new PatternBreakouts(entries[0], entries[1]);
        patternBreakouts.push(pb);
    }
}

// Parse the breakouts list.
// Format: "symbol   date"
function parsePatternBreakouts(data) {
    var rows = data.split("\r\n");
    for (var i = 1; i < rows.length; i++) {
        var entries = rows[i].split("\t");
        var pb = new PatternBreakouts(entries[0], entries[1]);
        patternBreakouts.push(pb);
    }
}

var PatternBreakouts = (function () {
    // constructor
    function PatternBreakouts(symbol, date) {
        this._symbol = symbol;
        this._date = date
    };

    // add the methods to the prototype so that all of the 
    // Foo instances can access the private static
    PatternBreakouts.prototype.getSymbol = function () {
        return this._symbol;
    };
    PatternBreakouts.prototype.setSymbol = function (symbol) {
        this._symbol = symbol;
    };

    PatternBreakouts.prototype.getDate = function () {
        return this._date;
    };
    PatternBreakouts.prototype.setDate = function (date) {
        this._date = date;
    };

    return PatternBreakouts;
})();

// Get an array of dates with symbol breakouts for each date
function getPatternBreakoutsByDate() {    
    var dict = [];
    var dates = [];
    for (var i = 0; i < patternBreakouts.length; i++) {
        var date = patternBreakouts[i].getDate();
        var symbol = patternBreakouts[i].getSymbol();
        if (dict[date] == null) {
            dict[date] = [];
        }

        if ($.inArray(date, dates) == -1) {
            dates.push(date);
        }
        if ($.inArray(symbol, dict[date]) == -1) {
            dict[date].push(symbol);
        }
    }

    return { "dates": dates, "dict": dict }
}

function parsePatternJson(data) {
    var obj = JSON.parse(data);
    var patternAnnotations = []

    for (var i = 0; i < obj.length; i++) {
        var pattern = obj[i];
        var name = pattern["Name"];

        // Add pattern names to sidebar list
        $("<li>")
            .attr("class", "pattern_item")
            .attr("onmouseover", "listItemMouseOver(this)")
            .attr("onmouseout", "listItemMouseOut(this)")
            .attr("onclick", "listItemClick(this)")
            .attr("segment_id", i)
            .append(name)
            .appendTo("#pattern_list");

        var patternAnnotation = new PatternAnnotation();
        patternAnnotation.patternId = i;
        for (var j = 0; j < pattern["PointCount"] - 1; j++) {
            var patternSegment = new PatternSegment(pattern["PointDates"][j], pattern["PointDates"][j + 1]);
            patternAnnotation.patternSegments.push(patternSegment);
        }
        patternAnnotations.push(patternAnnotation);
    }

    return patternAnnotations;
}

function PatternSegment(startDate, endDate) {
    this.startDate = startDate;
    this.endDate = endDate;
}

function PatternAnnotation() {
    this.patternId = -1;
    this.patternSegments = [];
}

function updateAnnotationLists(reader) {
    patternBreakouts = [];
    readJsonFile(reader.result);
    // Dictionary - key: Date, value: List of symbols                        
    breakoutDayDict = getPatternBreakoutsByDate();

    var list_cell = document.getElementById("breakout_day_cell");

    if (list_cell == null) {
        var table_row = document
            .getElementById("symbol_table")
            .getElementsByTagName("tbody")[0]
            .getElementsByTagName("tr")[0];

        var cell = document.createElement("td");
        cell.setAttribute("id", "breakout_day_cell");
        var content = document.createElement("div");
        content.setAttribute("style", "height: 300px; padding-left: 10px; padding-right: 10px; overflow:scroll;")
        var list = document.createElement("ul");
        list.setAttribute("id", "breakout_date_list");
        content.appendChild(list);
        cell.appendChild(content);
        table_row.insertBefore(cell, table_row.children[0]);

        cell = document.createElement("td");
        cell.setAttribute("id", "symbol_list_cell");
        content = document.createElement("div");
        content.setAttribute("style", "height: 300px; width: 75px; overflow:scroll;")
        list = document.createElement("ul");
        list.setAttribute("id", "symbol_list");
        content.appendChild(list);
        cell.appendChild(content);
        table_row.insertBefore(cell, table_row.children[1]);

        cell = document.createElement("td");
        cell.setAttribute("id", "pattern_list_cell");
        content = document.createElement("div");
        content.setAttribute("style", "height: 300px; width: 150px; overflow:scroll;")
        list = document.createElement("ul");
        list.setAttribute("id", "pattern_list");
        content.appendChild(list);
        cell.appendChild(content);
        table_row.insertBefore(cell, table_row.children[2]);
    }
    else {
        $("#breakout_date_list .breakout_date_item").remove();
        $("#symbol_list .symbol_item").remove();
        $("#pattern_list .pattern_item").remove();
        $("#pattern_list .pattern_item_selected").remove();
    }

    var dict = breakoutDayDict;
    $(dict["dates"]).each(function (i) {
        $("<li>")
            .attr("class", "breakout_date_item")
            .attr("onmouseover", "listItemMouseOver(this)")
            .attr("onmouseout", "listItemMouseOut(this)")
            .attr("onclick", "breakoutDayItemClick(this)")
            .append(dict["dates"][i])
            .appendTo("#breakout_date_list");
    });
}

function breakoutDayItemClick(item) {
    var symbols = breakoutDayDict["dict"][item.textContent]
    //console.log(item.textContent);

    $("#symbol_list .symbol_item").remove();

    $(symbols).each(function (i) {
        $("<li>")
            .attr("class", "symbol_item")
            .attr("onmouseover", "listItemMouseOver(this)")
            .attr("onmouseout", "listItemMouseOut(this)")
            .attr("onclick", "symbolItemClick(this)")
            .append(symbols[i])
            .appendTo("#symbol_list");
    });
}

function listItemMouseOver(item) {
    item.style.backgroundColor = "Blue";
}
function listItemMouseOut(item) {
    item.style.backgroundColor = "";
}
function listItemClick(item) {
    if (item.getAttribute("class") == "pattern_item") {
        item.setAttribute("class", "pattern_item_selected");

        var segment_id = item.getAttribute("segment_id");
        chartCollection.charts[0].showPatternAnnotation(segment_id);
    }
    else if (item.getAttribute("class") == "pattern_item_selected") {
        item.setAttribute("class", "pattern_item");

        var segment_id = item.getAttribute("segment_id");
        chartCollection.charts[0].hidePatternAnnotation(segment_id);
    }
    chartCollection.charts[0].drawSegments();
}

function symbolItemClick(item) {
    var new_symbol = item.textContent
    if (symbol == null || symbol != new_symbol) {
        symbol = new_symbol;
        CallService(symbol);
    }
}