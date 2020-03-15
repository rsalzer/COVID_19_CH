var data;

var cantons = ['CH', 'AG', 'AI', 'AR', 'BE', 'BL', 'BS', 'FR', 'GE', 'GL', 'GR', 'JU', 'LU', 'NE', 'NW', 'OW', 'SG', 'SH', 'SO', 'SZ', 'TG', 'TI', 'UR', 'VD', 'VS', 'ZG', 'ZH', 'FL'];

var names = {
  "CH": "Ganze Schweiz",
  "AG": "Kanton Aargau",
  "AI": "Kanton Appenzell Innerhoden",
  "AR": "Kanton Appenzell Ausserhoden",
  "BE": "Kanton Bern",
  "BL": "Kanton Basel Land",
  "BS": "Kanton Basel Stadt",
  "FR": "Kanton Freiburg",
  "GE": "Kanton Genf",
  "GL": "Kanton Glarus",
  "GR": "Kanton Graubünden",
  "JU": "Kanton Jura",
  "LU": "Kanton Luzern",
  "NE": "Kanton Neuenburg",
  "NW": "Kanton Nidwalden",
  "OW": "Kanton Obwalden",
  "SG": "Kanton St. Gallen",
  "SH": "Kanton Schaffhausen",
  "SO": "Kanton Solothurn",
  "SZ": "Kanton Schwyz",
  "TG": "Kanton Thurgau",
  "TI": "Kanton Tessin",
  "UR": "Kanton Uri",
  "VD": "Kanton Waadt",
  "VS": "Kanton Wallis",
  "ZG": "Kanton Zug",
  "ZH": "Kanton Zürich",
  "FL": "Fürstentum Lichtenstein"
};

d3.csv('https://raw.githubusercontent.com/openZH/covid_19/master/COVID19_Cases_Cantons_CH_total.csv', function (error, csvdata) {
  data = csvdata;
  for(var i=0; i<cantons.length; i++) {
    barChartCases(cantons[i]);
  }
});

function barChartCases(place) {
  var filteredData = data.filter(function(d) { if(d.canton==place) return d});
  var div = document.createElement("div");
  var h2 = document.createElement("h2");
  var image = document.createElement("img");
  image.width = 20;
  image.src = "wappen/"+place+".png";
  h2.appendChild(image);
  var text = document.createTextNode(" "+names[place]);
  h2.appendChild(text);
  div.appendChild(h2);
  var canvas = document.createElement("canvas");
  //canvas.className  = "myClass";
  canvas.id = place;
  canvas.height=300;
  canvas.width=300+filteredData.length*30;
  div.appendChild(canvas);
  document.getElementsByTagName('body')[0].appendChild(div);
  var dateLabels = filteredData.map(function(d) {return d.date});
  var testedPos = filteredData.map(function(d) {if(d.tested_pos=="NA") return 0; return d.tested_pos});
  var confirmed = filteredData.map(function(d) {if(d.confirmed=="NA") return 0; return d.confirmed});
  var chart = new Chart(place, {
    type: 'bar',
    options: {
      responsive: false,
      legend: {
        display: false
      },
      title: {
        display: true,
        text: 'Positive / Bestätigte Fälle '+names[place]
      },
      tooltips: {
						mode: "index",
						intersect: true,
			},
      scales: {
        xAxes: [{
                  stacked: true,
                  id: "bar-x-axis1"
                }],
      yAxes: [{
        stacked: false,
        ticks: {
          beginAtZero: true,
          suggestedMax: 10,
        },
      }]
  }
  /*
      /*,
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
        */
    },
    data: {
      labels: dateLabels,
      datasets: [
        {
          data: confirmed,
          backgroundColor: 'rgba(200,20,20,120)',
          borderWidth: 1,
          label: "Bestätigt"
        },
        {
          data: testedPos,
          backgroundColor: '#F15F36',
          borderWidth: 1,
          label: "Positiv getestet"
        }
      ]
    }
  });
}
