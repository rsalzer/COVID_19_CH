var data;

d3.csv('https://raw.githubusercontent.com/openZH/covid_19/master/COVID19_Cases_Cantons_CH_total.csv', function (error, csvdata) {
  data = csvdata;
  barChartCases('CH');
});

function barChartCases(place) {
  var dateLabels = data.filter(function(d) { if(d.canton==place) return d}).map(function(d) {return d.date});
  var testedPos = data.filter(function(d) { if(d.canton==place) return d}).map(function(d) {return d.tested_pos});
  var chart = new Chart(place, {
    type: 'bar',
    options: {
      responsive: true,
      legend: {
        display: false
      },
      title: {
        display: true,
        text: 'Positive / Bestätigte Fälle '+place
      },
      plugins: {
        labels: {
          render: function (args) {
               var index = args.index;
               var value = args.value;
               if(index==0) return "";
               var lastValue = args.dataset.data[index-1];
               var percentageChange = value/lastValue - 1;
               var rounded = Math.round(percentageChange * 100);
               var label = ""+rounded;
               if(rounded >= 0) label = "+"+label+"%";
               else label = "-"+label+"%";
               return label;
            }
          }
        }
    },
    data: {
      labels: dateLabels,
      datasets: [
        {
          data: cases,
          backgroundColor: '#F15F36'
        }
      ]
    }
  });
}
