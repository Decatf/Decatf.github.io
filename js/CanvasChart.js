function drawLineChart(ctx, chart, data, yMin) {
    var xS = chart.xScale;
    var yS = chart.yScale;

    // drawing code here
    ctx.beginPath();
    var firstX = null;
    for (var i = 0; i < data.length; i++) {
        if (i == 0) {

            var x = xS(chart.dataMapFuncX(data[i]));
            firstX = x;
            var y_value = chart.dataMapFuncY(data[i]);
            if (y_value == null || isNaN(y_value)) continue;
            var y = yS(y_value);
            ctx.moveTo(x, y);
        }
        else {
            var x = xS(chart.dataMapFuncX(data[i]));
            var y_value = chart.dataMapFuncY(data[i]);
            if (y_value == null || isNaN(y_value)) continue;
            var y = yS(y_value);
            ctx.lineTo(x, y);

            // Close and fill the path
            if (i == data.length - 1 && yMin != null) {
                var y2 = yS(yMin);
                ctx.lineTo(x, y2);
                ctx.lineTo(firstX, y2);
                ctx.closePath();
                ctx.fill();
            }
        }
    }
    //ctx.closePath();
    ctx.stroke();
}

function drawOhlcChart(ctx, chart, data, bar_width) {
    var xS = chart.xScale;
    var yS = chart.yScale;

    var bar_color = function (d) {
        return d.y[0] == d.y[3] ?
            'black' : (d.y[0] > d.y[3] ? 'red' : 'green');
    };

    // drawing code here
    ctx.lineWidth = 1.0;

    // offset the coordinate to make the line width rendering consistent
    //https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/Canvas_tutorial/Applying_styles_and_colors#A_lineWidth_example
    var offset;
    offset = (ctx.lineWidth % 2) == 0 ? 0.0 : 0.5;  

    for (var i = 0; i < data.length; i++) {

        ctx.strokeStyle = bar_color(data[i]);
        ctx.beginPath();

        // high/low bar
        //var x = xS(chart.dataMapFuncX(data[i]));
        var x = Math.floor(xS(chart.dataMapFuncX(data[i]))) + offset;
        var y1 = yS(data[i].y[1]);  // high
        var y2 = yS(data[i].y[2]);  // low
        //var y1 = Math.floor(yS(data[i].y[1])) + 0.5;  // high
        //var y2 = Math.floor(yS(data[i].y[2])) + 0.5;  // low
        ctx.moveTo(x, y1);
        ctx.lineTo(x, y2);
        ctx.stroke();

        // open tick
        //y1 = yS(data[i].y[0]);  // open
        y1 = Math.floor(yS(data[i].y[0])) + offset;  // open
        ctx.moveTo(x, y1);
        ctx.lineTo(x - bar_width, y1);
        ctx.stroke();

        // close tick
        //y1 = yS(data[i].y[3]);  // close
        y1 = Math.floor(yS(data[i].y[3])) + offset;  // close
        ctx.moveTo(x, y1);
        ctx.lineTo(x + bar_width, y1);
        ctx.stroke();

        ctx.closePath();
    }
}

function drawBarChart(ctx, chart, data, bar_width) {
    var xS = chart.xScale;
    var yS = chart.yScale;

    var chartHeight = chart.height - chart.margin.top - chart.margin.bottom;
    var bar_color = 'black'

    // drawing code here
    ctx.lineWidth = 1;
    ctx.strokeStyle = bar_color;
    for (var i = 0; i < data.length; i++) {
        ctx.beginPath();

        // high/low bar
        var x = xS(data[i].index) - (bar_width / 2);
        var y;
        if (data[i].y0 != null && !isNaN(data[i].y0)) {
            y = yS(data[i].y0);
        }
        else {
            continue;
        }
        var width = bar_width;
        var height = yS(0);

        ctx.fillRect(x, y, width, height);
    }
}