Highcharts.stockChart('container', {

    title: {
        text: 'Start at the first of January, 2009'
    },

    rangeSelector: {
        selected: 1
    },

    series: [{
        name: 'Temperature',
        data: temperatures,
        pointStart: '2009-01-01', // first of April
        pointInterval: 3600 * 1000, // hourly data
        tooltip: {
            valueDecimals: 1,
            valueSuffix: '°C'
        }
    }]
});