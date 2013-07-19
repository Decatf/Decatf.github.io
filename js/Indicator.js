function LineChartSeries(indicatorModel) {
    this.indicatorData = indicatorModel.data;
    this.id = indicatorModel.id;
    this.pathFunction = indicatorModel.pathFunction;
    //// SVG Path
    //this.pathFunction = d3.svg.line()
    //    //.interpolate("monotone")
    //    .defined(function (d) { return d != null && d.y0 != null && !isNaN(d.y0); })
    //    .x(function (d) { return xS(d.index); })
    //    .y(function (d) { return yS(d.y0); });
    // Zoom or pan the context
    LineChartSeries.prototype.onBrush = function (chartContainer, brush) {
        if (!brush || brush.empty()) {
            var brush_extent = brush.extent();
            var filtered_data = this.indicatorData.filter(function (element, index, array) {
                return (brush_extent[0] <= array[index].x && array[index].x <= brush_extent[1]);
            });

            chartContainer.selectAll("#" + this.id).datum(this.indicatorData).attr("d", this.pathFunction);
        }
        else {
            chartContainer.selectAll("#" + this.id).attr("d", this.pathFunction);
        }
    }
}