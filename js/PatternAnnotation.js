// Breakouts list
var patternBreakouts = [];
// Array of dates with symbols that have breakouts
var breakoutDayDict;


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

/* 
    Parse the main pattern json file
    args: json text data
    global:
        patternJsonData: Data of each breakout
        breakoutsList: List of breakout day and symbol
        patternBreakouts: 
*/
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

    var patternBreakouts = [];
    for (var i = 0; i < breakoutsList.length; i++) {
        var breakout = breakoutsList[i];
        var pb = new PatternBreakouts(breakout[0], breakout[1]);    // symbol, date
        patternBreakouts.push(pb);
    }

    return patternBreakouts;
}

/* 
    Organize the patterns by breakout day.
*/
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



function PatternSegment(startDate, endDate) {
    this.startDate = startDate;
    this.endDate = endDate;
}

function PatternAnnotation() {
    this.patternId = -1;
    this.patternName = "";
    this.patternSegments = [];
}

/*
    Parse the patterns for a particular symbol.
    returns: Array of PatternAnnotation objects.
*/
function parsePatternJson(jsonPatterns) {
    var patternAnnotations = []

    for (var i = 0; i < jsonPatterns.length; i++) {
        var pattern = jsonPatterns[i];
        var name = pattern["Name"];

        // Create new pattern annotation objects
        var patternAnnotation = new PatternAnnotation();
        patternAnnotation.patternName = name;
        patternAnnotation.patternId = i;
        for (var j = 0; j < pattern["PointCount"] - 1; j++) {
            var patternSegment = new PatternSegment(pattern["PointDates"][j], pattern["PointDates"][j + 1]);
            patternAnnotation.patternSegments.push(patternSegment);
        }
        patternAnnotations.push(patternAnnotation);
    }

    return patternAnnotations;
}

/*
    Create the dijit TabContainer holding the lists of pattern breakouts.
*/
function createAnnotationTabPages() {

    // Create a new cell for the tab page
    //var table_row = document
    //    .getElementById("symbol_table")
    //    .getElementsByTagName("tbody")[0]
    //    .getElementsByTagName("tr")[0];

    //var cell = document.createElement("td");
    //cell.setAttribute("id", "tabpage_cell");
    //table_row.insertBefore(cell, table_row.children[0]);

    // Create div elements for the tab page
    //var annotationsDiv = document.createElement("div");
    //annotationsDiv.setAttribute("id", "annotationsTabDiv");
    var annotationsDiv = document.getElementById("annotationsTabDiv");
   
    //cell.appendChild(annotationsDiv);


    require(["dijit/layout/TabContainer", "dijit/layout/ContentPane", "dojo/domReady!"], function (TabContainer, ContentPane) {

        var tabContainerHeight = 270;

        var tc = new TabContainer({
            id: "annotationsTabContainer",
            style: "height: " + tabContainerHeight + "px; width: 290px;"
        }, "annotationsTabDiv");

        var breakoutDayList = document.createElement("ul");
        breakoutDayList.setAttribute("id", "tabpane_breakoutday_list");
        var cp1 = new ContentPane({
            id: "breakoutDayTabContentPane",
            title: "Breakout Day",
            content: breakoutDayList,
            startup: updateAnnotationsTabs,
            //style: "height: 100%; width: 100%;"
        });
        tc.addChild(cp1);

        var symbolList = document.createElement("ul");
        symbolList.setAttribute("id", "tabpane_symbol_list");
        var cp2 = new ContentPane({
            id: "symbolsTabContentPane",
            title: "Symbols",
            content: symbolList
        });
        tc.addChild(cp2);

        var annotationList = document.createElement("ul");
        annotationList.setAttribute("id", "tabpane_annotation_list");
        var cp3 = new ContentPane({
            id: "annotationsTabContentPane",
            title: "Annotations",
            content: annotationList
        });
        tc.addChild(cp3);

        tc.startup();

        // Center the tab container vertically
        var annotationsTabDiv = document.getElementById("annotationsTabContentDiv");
        var marginTop = "-" + (tabContainerHeight / 2) + "px";
        annotationsTabDiv.style['marginTop'] = marginTop;


        hasTabPage = true;
    });
}

/*
    Populate the list in the breakout day tab pane.
*/
function updateAnnotationsTabs() {
    require(["dojo"], function (dojo) {
        //var myWidget = dojo.byId("breakoutDayTabContentPane");
        //console.log("myWidget");

        $("#tabpane_breakoutday_list .breakout_date_item").remove();

        var dict = breakoutDayDict;
        $(dict["dates"]).each(function (i) {
            $("<li>")
                .attr("class", "breakout_date_item")
                .attr("onmouseover", "listItemMouseOver(this)")
                .attr("onmouseout", "listItemMouseOut(this)")
                .attr("onclick", "breakoutDayItemClick(this)")
                .append(dict["dates"][i])
                .appendTo("#tabpane_breakoutday_list");
            //.appendTo(list);
        });
    });
}

function updateAnnotationLists() {

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

/*
    Populate the list of breakouts for the symbol
*/
function updateSymbolAnnotationsList(symbol) {

    if (typeof patternJsonData != 'undefined' && patternJsonData != null) {

        var jsonPatterns = patternJsonData[symbol];
        if (jsonPatterns != null) {
            //var patternAnnotations = [];
            var patternAnnotations = parsePatternJson(jsonPatterns)

            // Populate the list of breakouts for the symbol
            for (var i = 0; i < patternAnnotations.length; i++) {
                var name = patternAnnotations[i].patternName;
                var id = patternAnnotations[i].patternId;
                // Add pattern names to sidebar list
                $("<li>")
                    .attr("class", "pattern_item")
                    .attr("onmouseover", "listItemMouseOver(this)")
                    .attr("onmouseout", "listItemMouseOut(this)")
                    .attr("onclick", "annotationItemClick(this)")
                    .attr("segment_id", id)
                    .append(name)
                    .appendTo("#pattern_list");

                $("<li>")
                    .attr("class", "pattern_item")
                    .attr("onmouseover", "listItemMouseOver(this)")
                    .attr("onmouseout", "listItemMouseOut(this)")
                    .attr("onclick", "annotationItemClick(this)")
                    .attr("segment_id", id)
                    .append(name)
                    .appendTo("#tabpane_annotation_list");
            }
        }
        return patternAnnotations;
    }
    return null;
}

/* 
    Populate the symbols list for a specific breakout day
*/
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


    $("#tabpane_symbol_list  .symbol_item").remove();
    $(symbols).each(function (i) {
        $("<li>")
            .attr("class", "symbol_item")
            .attr("onmouseover", "listItemMouseOver(this)")
            .attr("onmouseout", "listItemMouseOut(this)")
            .attr("onclick", "symbolItemClick(this)")
            .append(symbols[i])
            .appendTo("#tabpane_symbol_list");
    });
}

function symbolItemClick(item) {
    var new_symbol = item.textContent
    if (symbol == null || symbol != new_symbol) {
        symbol = new_symbol;
        // Create a chart for the new symbol
        CallService(symbol);
    }
}

function annotationItemClick(item) {
    item.style.backgroundColor = "";

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

function listItemMouseOver(item) {
    item.style.backgroundColor = "Blue";
}
function listItemMouseOut(item) {
    item.style.backgroundColor = "";
}

