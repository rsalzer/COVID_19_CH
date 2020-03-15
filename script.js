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
  var chLastDate = actualData[0].lastDate;
  var h3 = document.createElement("h3");
  var text = document.createTextNode("Aktueller Stand der positiv getesteten Fälle ("+chLastDate+") und Veränderung gegenüber dem Vortag");
  h3.appendChild(text);
  document.getElementById("last").append(h3);
  var sortedActual = Array.from(actualData).sort(function(a, b){return b.actual-a.actual});
  var p = document.createElement("p");
  for(var i=0; i<sortedActual.length; i++) {
    var actual = sortedActual[i];
    var now = actual.actual;
    var last = actual.last;
    var diff = now-last;
    var diffStr = diff>=0 ? "+"+diff : diff;
    var lastDate = actual.lastDate;
    var changeRatio = Math.round(diff/last * 100);
    var changeRatioStr = changeRatio>=0 ? " / +"+changeRatio+"%" : " / "+changeRatio+"%";
    if(!last || last==0) changeRatioStr = "";
    var alert = "";
    if(lastDate!=chLastDate) alert = "(Daten vom "+lastDate+") ";
    //console.log(lastDate+" : "+cantons[i]+": "+actual+" ("+diffStr+")");
    var image = document.createElement("img");
    image.height = 15;
    image.src = "wappen/"+actual.canton+".png";
    p.appendChild(image);
    var text = document.createTextNode(" "+now+" ("+diffStr+changeRatioStr+")");
    var a = document.createElement("a");
    a.href = "#div_"+actual.canton;
    p.appendChild(document.createTextNode(alert));
    a.appendChild(document.createTextNode(" "+actual.canton+":"));
    p.appendChild(a);
    p.appendChild(text);
    p.appendChild(document.createElement("br"));
  }
  document.getElementById("last").append(p);
});

var actualData = [];

function barChartCases(place) {
  var filteredData = data.filter(function(d) { if(d.canton==place) return d});
  var div = document.createElement("div");
  div.id="div_"+place;
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
  var actual = {};
  actual.canton = place;
  actual.actual = parseInt(testedPos[testedPos.length-1]);
  if(testedPos.length<2) {
    actual.last = 0
  }
  else {
    actual.last = parseInt(testedPos[testedPos.length-2]);
  }
  actual.lastDate = dateLabels[dateLabels.length-1];
  actualData.push(actual);
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
