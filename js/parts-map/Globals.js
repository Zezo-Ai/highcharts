
var Axis = Highcharts.Axis,
	Chart = Highcharts.Chart,
	Color = Highcharts.Color,
	Point = Highcharts.Point,
	Pointer = Highcharts.Pointer,
	Legend = Highcharts.Legend,
	LegendSymbolMixin = Highcharts.LegendSymbolMixin,
	Series = Highcharts.Series,
	SVGRenderer = Highcharts.SVGRenderer,
	VMLRenderer = Highcharts.VMLRenderer,
	
	addEvent = Highcharts.addEvent,
	each = Highcharts.each,
	error = Highcharts.error,
	extendClass = Highcharts.extendClass,
	defaultOptions = Highcharts.getOptions(),
	defaultPlotOptions = defaultOptions.plotOptions,
	wrap = Highcharts.wrap;