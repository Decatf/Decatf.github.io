﻿
var Type;
var Url;
var Data;
var ContentType;
var DataType;
var ProcessData;

var parseDate = d3.time.format("%Y%m%d").parse;

function toIntDate(dt) {
    return (dt.getFullYear() * 10000) + ((dt.getMonth() + 1) * 100) + dt.getDate();
}

var chartCollection;

// Function to call WCF  Service       
function CallService(symbol) {

    var margin = margin = { top: 10, right: 80, bottom: 10, left: 10 };
    var width = window.innerWidth;
    var height = window.innerHeight;
    width = width - 250;
    var chartCollectionWidth = (width * 9 / 10);// - margin.left - margin.right;
    var chartCollectionHeight = (height * 8 / 10);// - margin.top - margin.bottom;

    // Center the chart container vertically
    var chartContentDiv = document.getElementById("chartContentDiv");
    var marginTop = "-" + ((height - (1 * margin.top) - margin.bottom) / 2) + "px";
    chartContentDiv.style['marginTop'] = marginTop;

    // Create the loading spinner overlay
    var loadingOverlay = document.getElementById("loadOverlay");
    if (loadingOverlay == null) {
        loadingOverlay = document.createElement("div");
        loadingOverlay.setAttribute("id", "loadOverlay");
        //loadingOverlay.setAttribute("style", "background-color: white; border-style: solid; border-width: 2px;");
        loadingOverlay.style.position = "absolute";
        loadingOverlay.style.left = "0px";
        loadingOverlay.style.top = "0px";
        //loadingOverlay.style.left = margin.left + "px";
        //loadingOverlay.style.top = margin.top + "px";
        loadingOverlay.style.width = chartCollectionWidth + "px";
        loadingOverlay.style.height = chartCollectionHeight + "px";
        loadingOverlay.style.backgroundColor = "rgba(200, 200, 200, 0.8)";
        loadingOverlay.style.borderStyle = "solid";
        loadingOverlay.style.borderWidth = "1px";

        //var cell = document.getElementById("chartCell");
        //cell.appendChild(loadingOverlay);

        var chartElement = document.getElementById("chart");
        //chartElement.parentNode.insertBefore(loadingOverlay, chartElement.nextSibling);
        chartElement.appendChild(loadingOverlay);
    }

    var opts = {
        lines: 17, // The number of lines to draw
        length: 2, // The length of each line
        width: 10, // The line thickness
        radius: 30, // The radius of the inner circle
        corners: 1, // Corner roundness (0..1)
        rotate: 0, // The rotation offset
        direction: 1, // 1: clockwise, -1: counterclockwise
        color: '#000', // #rgb or #rrggbb
        speed: 2, // Rounds per second
        trail: 60, // Afterglow percentage
        shadow: false, // Whether to render a shadow
        hwaccel: true, // Whether to use hardware acceleration
        className: 'spinner', // The CSS class to assign to the spinner
        zIndex: 2e9, // The z-index (defaults to 2000000000)
        top: 'auto', // Top position relative to parent in px
        left: 'auto' // Left position relative to parent in px
    };
    var target = document.getElementById('loadOverlay');
    var spinner = new Spinner(opts).spin(target);


    Type = "POST";
    Url = "http://localhost:8080/Service.svc/GetSymbol";
    Data = '{"symbol": "' + symbol + '"}';
    ContentType = "application/json; charset=utf-8";
    DataType = "json";
    varProcessData = true;

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
            var chartCreated = ServiceSucceeded(msg);            

            if (chartCreated) {
                var width = window.innerWidth;
                var height = window.innerHeight;
                width = width - 250;
                chartCollection.update.call(chartCollection, width, height);
            }

            loadingOverlay.parentElement.removeChild(loadingOverlay);
        },
        error: ServiceFailed// When Service call fails
    });
}

function ServiceSucceeded(result) {
    if (DataType == "json" && result.d != null) {

        var symbol = result.d["Symbol"];
        var exchange = result.d["Exchange"];

        $(".chart").remove();
        $("#chart").children("canvas").remove();
        $(".pattern_item").remove();
        $(".pattern_item_selected").remove();

        var p = document.getElementById("resultText");
        p.innerHTML = exchange + " : " + symbol;

        var close = result.d["Close"];
        var high = result.d["High"];
        var low = result.d["Low"];
        var open = result.d["Open"];
        var volume = result.d["Volume"];
        var dates = result.d["Dates"];
        //data = dates.map(function (element, index) {            
        //    var dt = parseDate(String(element));
        //    return {
        //        index: index,
        //        date: dt,
        //        close: close[index],
        //        high: high[index],
        //        low: low[index],
        //        open: open[index],
        //        volume: volume[index]
        //    };
        //});

        // Pad the end with empty data
        //var delta_date = parseDate(String(dates[dates.length - 1])) - parseDate(String(dates[dates.length - 2]));
        //var format = d3.time.format("%Y%m%d")
        //var new_date = parseDate((String(dates[dates.length - 1])));
        //new_date = new_date.getTime();
        ////var delta_dt = new Date(ms = delta_date)
        //new_date += delta_date;
        //new_date = new Date(new_date);
        //var new_date_string = format(new_date);
        //dates.push(new_date_string);
        //open.push(null);
        //high.push(null);
        //low.push(null);
        //close.push(null);
        //volume.push(null);

        var data = dates.map(function (element, index) {            
            var dt = parseDate(String(element));
            return {
                index: index,
                x: dt,
                y: [open[index],
                    high[index],
                    low[index],
                    close[index]],
                y0: close[index],
            };
        });        

        var volume_data = dates.map(function (element, index) {
            var dt = parseDate(String(element));
            return {
                index: index,
                x: dt,
                y: [volume[index]],
                y0: volume[index],
            };
        });



        chartCollection = new ChartCollection(data, volume_data);

        if (typeof ta_asm != 'undefined') {
            // Add moving average
            var ma = new Array(close.length);
            var ref_si = new JSIL.BoxedVariable();
            var ref_num = new JSIL.BoxedVariable();

            var ma_period = 20;
            var si, num;
            //ta_asm.TicTacTec.TA.Library.Core.MovingAverage(
            //    0, close.length - 1,
            //    close,
            //    ma_period,
            //    ta_asm.TicTacTec.TA.Library.Core_MAType.Sma,
            //    ref_si, ref_num, ma);

            //var skip_num = ref_si.get() + 1;
            //var result_data = (Array.apply(null, new Array(skip_num)).map(Number.prototype.valueOf, NaN)).concat(ma);
            ////result_data = result_data.splice(close.length, skip_num);

            //var ma_data = result_data.map(function (element, index) {
            //    return {
            //        index: index,
            //        x: dates[index],
            //        y: [element],
            //        y0: element
            //    };
            //});


            var lowerBand = new Array(close.length);
            var midBand = new Array(close.length);
            var upperBand = new Array(close.length);
            ta_asm.TicTacTec.TA.Library.Core.Bbands(
                0, close.length - 1,
                close,
                ma_period,
                2.0, 2.0,
                ta_asm.TicTacTec.TA.Library.Core_MAType.Sma,
                ref_si, ref_num,
                lowerBand, midBand, upperBand);

            var skip_num = ref_si.get() + 1;
            var lowerBand = (Array.apply(null, new Array(skip_num)).map(Number.prototype.valueOf, NaN)).concat(lowerBand);
            var midBand = (Array.apply(null, new Array(skip_num)).map(Number.prototype.valueOf, NaN)).concat(midBand);
            var upperBand = (Array.apply(null, new Array(skip_num)).map(Number.prototype.valueOf, NaN)).concat(upperBand);

            var chartAreaName = "CandleStickChart";
            var chart = chartCollection.charts[chartAreaName];
            var chartIndicatorName = "Bband_Lower";
            mappedData = lowerBand.map(function (element, index) {
                return {
                    index: index,
                    x: parseDate(String(dates[index])),
                    y: [element],
                    y0: element
                };
            });
            var indicator = new LineChartSeries({
                data: mappedData,
                id: chartIndicatorName,
                pathFunction: chart.pathFunction,
            });
            chart.addIndicator(indicator);
            mappedData = midBand.map(function (element, index) {
                return {
                    index: index,
                    x: parseDate(String(dates[index])),
                    y: [element],
                    y0: element
                };
            });
            chartIndicatorName = "Bband_Mid";
            indicator = new LineChartSeries({
                data: mappedData,
                id: chartIndicatorName,
                pathFunction: chart.pathFunction,
            });
            chart.addIndicator(indicator);
            chartIndicatorName = "Bband_Upper";
            mappedData = upperBand.map(function (element, index) {
                return {
                    index: index,
                    x: parseDate(String(dates[index])),
                    y: [element],
                    y0: element
                };
            });
            indicator = new LineChartSeries({
                data: mappedData,
                id: chartIndicatorName,
                pathFunction: chart.pathFunction,
            });
            chart.addIndicator(indicator);
        }



        // Get pattern annotations from the dictionary      
        if (typeof patternJsonData != 'undefined' && patternJsonData != null) {
            var patternAnnotations = updateSymbolAnnotationsList(symbol);
            chartCollection.charts[0].patternAnnotations = patternAnnotations;
        }

        return true;
    }
    return false;
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
    // Fallback data source
    if (wcf_error == true) {
        GetYahooData(symbol);
    }

    return;
}

// Get historical data from finance.yahoo.com
function GetYahooData(symbol) {
    var get_prices = historical_prices();
    var temp = get_prices(symbol, function (array) {

        if (array == null) {
            $(".chart").remove();
            $("#chart").children("canvas").remove();
            $(".pattern_item").remove();
            $(".pattern_item_selected").remove();

            var p = document.getElementById("resultText");
            p.innerHTML = symbol;

            var loadingOverlay = document.getElementById("loadOverlay");
            loadingOverlay.parentElement.removeChild(loadingOverlay);
        }


        $(".chart").remove();
        $("#chart").children("canvas").remove();
        $(".pattern_item").remove();
        $(".pattern_item_selected").remove();

        var p = document.getElementById("resultText");
        p.innerHTML = symbol;

        // Pad the end with empty data
        //var len = array.length;
        //var parseDate = d3.time.format("%Y-%m-%d").parse;
        //var delta_date = parseDate(array[0]["date"]) - parseDate(array[1]["date"]);
        //var format = d3.time.format("%Y-%m-%d");
        //var new_date = parseDate(String(array[0]["date"]));
        //new_date = new_date.getTime();
        //new_date += delta_date;
        //new_date = new Date(new_date);
        //var new_date_string = format(new_date);
        //array.splice(0, 0, {
        //    "adj close": null,
        //    "close": null,
        //    "date": new_date_string,
        //    "high": null,
        //    "low": null,
        //    "volume": null,
        //});
        //dates.push(new_date_string);
        //open.push(null);
        //high.push(null);
        //low.push(null);
        //close.push(null);
        //volume.push(null);


        data = array.map(function (element, index) {
            var adj_close = parseFloat(element["adj close"]);
            var adj_factor = adj_close / element["close"];
            var parseDate = d3.time.format("%Y-%m-%d").parse;
            var dt = parseDate(element["date"]);
            return {              
                index: array.length - 1 - index,
                x: dt,
                y: [element["open"] * adj_factor,
                    element["high"] * adj_factor,
                    element["low"] * adj_factor,
                    adj_close],
                y0: adj_close,
                volume: parseFloat(element["volume"])
            }
        });
        data = data.reverse();

        volume_data = array.map(function (element, index) {
            var adj_close = parseFloat(element["adj close"]);
            var adj_factor = adj_close / element["close"];
            var parseDate = d3.time.format("%Y-%m-%d").parse;
            var dt = parseDate(element["date"]);
            return {
                index: array.length - 1 - index,
                x: dt,
                y: [parseFloat(element["volume"])],
                y0: parseFloat(element["volume"]),
            }
        });
        volume_data = volume_data.reverse();


        chartCollection = new ChartCollection(data, volume_data);

        // Get pattern annotations from the dictionary      
        if (typeof patternJsonData != 'undefined' && patternJsonData != null) {
            var patternAnnotations = updateSymbolAnnotationsList(symbol);
            chartCollection.charts[0].patternAnnotations = patternAnnotations;
        }

        if (typeof chartCollection != 'undefined' && chartCollection != null) {
            var width = window.innerWidth;
            var height = window.innerHeight;
            width = width - 250;
            chartCollection.update.call(chartCollection, width, height);
        }

        var loadingOverlay = document.getElementById("loadOverlay");
        loadingOverlay.parentElement.removeChild(loadingOverlay);
    });
}