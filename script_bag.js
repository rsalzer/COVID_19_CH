var data;

const cantons = ['AG', 'AI', 'AR', 'BE', 'BL', 'BS', 'FR', 'GE', 'GL', 'GR', 'JU', 'LU', 'NE', 'NW', 'OW', 'SG', 'SH', 'SO', 'SZ', 'TG', 'TI', 'UR', 'VD', 'VS', 'ZG', 'ZH', 'FL'];

const names = {
  "CH": "Ganze Schweiz",
  "AG": "Kanton Aargau",
  "AI": "Kanton Appenzell Innerrhoden",
  "AR": "Kanton Appenzell Ausserrhoden",
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
  "FL": "Fürstentum Liechtenstein"
};

const cartesianAxesTypes = {
  LINEAR: 'linear',
  LOGARITHMIC: 'logarithmic'
};

var verbose = false;
var actualData = [];
var actualDeaths = [];
var actualHospitalisation = [];
var actualIsolation = [];
var data = [];
Chart.defaults.global.defaultFontFamily = "IBM Plex Sans";
document.getElementById("loaded").style.display = 'none';

setLanguageNav();
getBAGCantons();
getBAGTotals();


function processData() {
  //processActualData();
  //processActualDeaths();
  //processActualHospitalisation();
  document.getElementById("loadingspinner").style.display = 'none';
  document.getElementById("loaded").style.display = 'block';
  //getBAGIsolation();
  //barChartAllCH();
  for(var i=0; i<cantons.length; i++) {
    barChartCases(cantons[i]);
  }
  //console.log("End process: "+new Date());
}

var bagData;
function getBAGCantons() {
  d3.csv("https://raw.githubusercontent.com/rsalzer/COVID_19_BAG/master/data/casesPerCanton.csv", function(error, csvdata) {
      if(csvdata!=null) {
          bagData = csvdata;
      }
      processData();
  });
}

function getBAGTotals() {
  d3.csv("https://raw.githubusercontent.com/rsalzer/COVID_19_BAG/master/data/totals.csv", function(error, csvdata) {
      if(csvdata!=null) {
          barChartAllCH(csvdata, true);
      }
  });
}

function processActualIsolation() {
  var sortedActual = Array.from(actualIsolation).sort(function(a, b){return b.current_quarantined-a.current_quarantined});
  var table = document.getElementById("quarantined");
  var totalIsolated = 0;
  var totalQuarantined = 0;
  for(var i=0; i<sortedActual.length; i++) {
    var actual = sortedActual[i];
    if(actual.abbreviation_canton_and_fl!="FL" && actual.current_isolated!=null && actual.current_isolated!="") totalIsolated+=parseInt(actual.current_isolated);
    if(actual.abbreviation_canton_and_fl!="FL" && actual.current_quarantined!=null && actual.current_quarantined!="") totalQuarantined+=parseInt(actual.current_quarantined);

    var tr = document.createElement("tr");
    var td = document.createElement("td");
    var a = document.createElement("a");
    a.className = "flag "+actual.abbreviation_canton_and_fl;
    a.href = "#detail_"+actual.abbreviation_canton_and_fl;
    a.appendChild(document.createTextNode(actual.abbreviation_canton_and_fl));
    td.appendChild(a);
    tr.appendChild(td);
    td = document.createElement("td");
    td.appendChild(document.createTextNode(actual.date));
    tr.appendChild(td);
    td = document.createElement("td");
    text = document.createTextNode(actual.current_isolated);
    td.appendChild(text);
    if(actual.source=="BAG") td.className = "BAG";
    tr.appendChild(td);
    td = document.createElement("td");
    text = document.createTextNode(actual.current_quarantined);
    td.appendChild(text);
    if(actual.source=="BAG") td.className = "BAG";
    tr.appendChild(td);
    td = document.createElement("td");
    if(actual.source && actual.source.substring(0,2)=="ht") {
      a = document.createElement("a");
      a.innerHTML = "&#x2197;&#xFE0E;";
      a.href = actual.source;
      td.appendChild(a);
    }
    else {
      a = document.createElement("a");
      a.innerHTML = "&#x2197;&#xFE0E;";
      a.href = "https://github.com/openZH/covid_19/blob/master/fallzahlen_kanton_total_csv/COVID19_Fallzahlen_Kanton_"+actual.abbreviation_canton_and_fl+"_total.csv";
      text = document.createTextNode(_("BAG"));
      td.className = "BAG";
      td.appendChild(text);
    }
    tr.appendChild(td);
    table.appendChild(tr);
  }
  var tr = document.createElement("tr");
  tr.innerHTML = "<td><a class='flag CH' href='#detail_CH'><b>CH</b></a></span></td><td><b>TOTAL</b></td><td><b>"+totalIsolated+"</b></td><td><b>"+totalQuarantined+"</b></td><td></td>";
  table.append(tr);
}

function processActualHospitalisation() {
  var sortedActual = Array.from(actualHospitalisation).sort(function(a, b){return b.current_hosp-a.current_hosp});
  var secondTable = document.getElementById("hospitalised_2");
  var total = 0;
  var totalicu = 0;
  var totalvent = 0;
  for(var i=0; i<sortedActual.length; i++) {
    var table;
    //if(i<sortedActual.length/2)
    table = secondTable;
    //else table = secondTable;
    var actual = sortedActual[i];
    var now = actual.current_hosp;
    if(actual.abbreviation_canton_and_fl!="FL" && now!="") total+=parseInt(now);
    if(actual.abbreviation_canton_and_fl!="FL" && actual.current_icu!="") totalicu+=parseInt(actual.current_icu);
    if(actual.abbreviation_canton_and_fl!="FL" && actual.current_vent!="") totalvent+=parseInt(actual.current_vent);

    var tr = document.createElement("tr");
    var td = document.createElement("td");
    var a = document.createElement("a");
    a.className = "flag "+actual.abbreviation_canton_and_fl;
    a.href = "#detail_"+actual.abbreviation_canton_and_fl;
    a.appendChild(document.createTextNode(actual.abbreviation_canton_and_fl));
    td.appendChild(a);
    tr.appendChild(td);
    td = document.createElement("td");
    td.appendChild(document.createTextNode(actual.date));
    tr.appendChild(td);
    td = document.createElement("td");
    var text = document.createTextNode(now);
    td.appendChild(text);
    tr.appendChild(td);
    td = document.createElement("td");
    text = document.createTextNode(actual.current_icu);
    td.appendChild(text);
    tr.appendChild(td);
    td = document.createElement("td");
    text = document.createTextNode(actual.current_vent);
    td.appendChild(text);
    tr.appendChild(td);
    td = document.createElement("td");
    if(actual.source && actual.source.substring(0,2)=="ht") {
      a = document.createElement("a");
      a.innerHTML = "&#x2197;&#xFE0E;";
      a.href = actual.source;
      td.appendChild(a);
    }
    else {
      a = document.createElement("a");
      a.innerHTML = "&#x2197;&#xFE0E;";
      a.href = "https://github.com/openZH/covid_19/blob/master/fallzahlen_kanton_total_csv/COVID19_Fallzahlen_Kanton_"+actual.abbreviation_canton_and_fl+"_total.csv";
      td.appendChild(a);
    }
    tr.appendChild(td);
    secondTable.appendChild(tr);
  }
  var tr = document.createElement("tr");
  tr.innerHTML = "<td><a class='flag CH' href='#detail_CH'><b>CH</b></a></span></td><td><b>TOTAL</b></td><td><b>"+total+"</b></td><td><b>"+totalicu+"</b></td><td><b>"+totalvent+"</b></td><td></td>";
  secondTable.append(tr);

  //document.getElementById("last").append(secondTable);
  //document.getElementById("last").append(document.createTextNode("Total CH gemäss Summe Kantone: "+total+ " / "+totalicu+" / "+totalvent));

}

/*
d3.json('https://api.github.com/repos/openZH/covid_19/commits?path=COVID19_Cases_Cantons_CH_total.csv&page=1&per_page=1', function(error, data) {
  var lastUpdateDiv = document.getElementById('latestUpdate');
  lastUpdateDiv.innerHTML = "<i>Letztes Update der offiziellen Daten: "+data[0].commit.committer.date.substring(0,10)+" ("+data[0].commit.message+")</i>";
});
*/

/*
d3.csv('https://raw.githubusercontent.com/daenuprobst/covid19-cases-switzerland/master/covid19_cases_switzerland.csv', function(error, csvdata) {
  var div = document.getElementById("inofficial");
  var canvas = document.createElement("canvas");
  //canvas.className  = "myClass";
  canvas.id = 'chinofficial';
  canvas.height=300;
  canvas.width=300+csvdata.length*30;
  div.appendChild(canvas);
  var dateLabels = csvdata.map(function(d) {return d.Date});
  var testedPos = csvdata.map(function(d) {return d.CH});
  var chart = new Chart('chinofficial', {
    type: 'bar',
    options: {
      responsive: false,
      legend: {
        display: false
      },
      title: {
        display: true,
        text: _('Unbestätigte Fälle Schweiz')
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
          data: testedPos,
          backgroundColor: '#F15F36',
          borderWidth: 1,
          label: "Positiv getestet"
        }
      ]
    }
  });
});
*/

Chart.Tooltip.positioners.custom = function(elements, eventPosition) { //<-- custom is now the new option for the tooltip position
    /** @type {Chart.Tooltip} */
    var tooltip = this;

    /* ... */

    var half = eventPosition.x - 81 - 10;
    if(half< 81 + 60) half = 81 + 60;
    return {
        x: half,
        y: 30
    };
}

function barChartAllCH(alldata, all) {
  place = "CH";
  var article = document.getElementById("detail_"+place);
  var h3 = document.createElement("h3");
  h3.className = "flag "+place;
  var text = document.createTextNode(_(names[place]));
  h3.appendChild(text);
  var a = document.createElement("a");
  a.href = "#top";
  a.innerHTML = "&#x2191;&#xFE0E;";
  a.className = "toplink";
  h3.appendChild(a);
  article.appendChild(h3);
  var div = document.createElement("div");
  div.className = "canvas-dummy";
  div.id = "container_"+place;
  var canvas = document.createElement("canvas");
  canvas.id = place;
  // canvas.className = "bagcanvas"
  canvas.height=250;
  div.appendChild(canvas);
  article.appendChild(div);
  div.scrollLeft = 1700;
  var filterBAG = alldata;
  var bagCantonData = filterBAG.map(function(d) {
    var dateSplit = d.date.split("-");
    var day = parseInt(dateSplit[2]);
    var month = parseInt(dateSplit[1])-1;
    var year = parseInt(dateSplit[0]);
    var date = new Date(year,month,day);
    var obj = {};
    obj.x = date;
    obj.y = d.new_cases;
    obj.total = d.total_cases;
    return obj;
  });
  var chart = new Chart(canvas.id, {
    type: 'bar',
    options: {
      layout: {
          padding: {
              right: 20
          }
      },
      responsive: false,
      legend: {
        display: false
      },
      title: {
        display: true,
        text: _('Neue Fälle')
      },
      tooltips: {
        enabled: true,
        intersect: false,
        mode: 'x',
        position: 'nearest',
        bodyFontFamily: 'IBM Plex Mono',
        callbacks: {
         afterLabel: function(t, d) {
            var datasetLabel = d.datasets[t.datasetIndex].label;
            var yLabel = Math.abs(t.yLabel);
            return "Gesamtfälle" + ': ' + bagCantonData[t.index].total;
         }
       }
      },
      scales: {
        xAxes: [{
          stacked: true,
          type: 'time',
          time: {
            tooltipFormat: 'DD.MM.YYYY',
            unit: 'day',
            displayFormats: {
              day: 'DD.MM'
            }
          },
          ticks: {
            min: new Date("2020-02-23T22:00:00"),
            max: new Date(),
          },
          gridLines: {
              color: inDarkMode() ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'
          }
        }],
        yAxes: [{
          type: cartesianAxesTypes.LINEAR,
          stacked: true,
          position: 'right',
          ticks: {
            beginAtZero: true,
            suggestedMax: 10,
            callback: function(t, i) {
                   return t < 0 ? Math.abs(t) : t;
            }
          },
          gridLines: {
              color: inDarkMode() ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'
          }
        }]
      },
      plugins: {
        datalabels: getDataLabels()
      }
  },
  data: {
    datasets: [
      {
        label: _('Neue Fälle'),
        data: bagCantonData,
        fill: false,
        cubicInterpolationMode: 'monotone',
        spanGaps: true,
        borderColor: '#FF0000',
        backgroundColor: '#FF0000',
        datalabels: {
          align: 'top',
          anchor: 'end'
        }
      }
    ]
  }
  });
  addAxisButtons(canvas, chart);
}

function barChartCases(place) {
  var section = document.getElementById("detail");
  var article = document.createElement("article");
  article.id="detail_"+place;
  var h3 = document.createElement("h3");
  h3.className = "flag "+place;
  var text = document.createTextNode(_(names[place]));
  h3.appendChild(text);
  var a = document.createElement("a");
  a.href = "#top";
  a.innerHTML = "&#x2191;&#xFE0E;";
  a.className = "toplink";
  h3.appendChild(a);
  article.appendChild(h3);
  var div = document.createElement("div");
  div.className = "canvas-dummy";
  div.id = "container_"+place;
  var canvas = document.createElement("canvas");
  canvas.id = place;
  canvas.className = "bagcanvas"
  canvas.height=250;
  div.appendChild(canvas);
  article.appendChild(div);
  section.appendChild(article);
  div.scrollLeft = 1700;
  var filterBAG = bagData.filter(function(d) { var dateSplit = d.date.split("-"); var day = parseInt(dateSplit[2]); var month = parseInt(dateSplit[1]); if(d[place]!="" && (month>5 || month==5 && day ==31) ) return d});
  var bagCantonData = filterBAG.map(function(d) {
    var dateSplit = d.date.split("-");
    var day = parseInt(dateSplit[2]);
    var month = parseInt(dateSplit[1])-1;
    var year = parseInt(dateSplit[0]);
    var date = new Date(year,month,day);
    var obj = {};
    obj.x = date;
    obj.total = d[place];
    return obj;
  });
  bagCantonData[0].y = 0;
  bagCantonData[0].diff = 0;
  for (var i = 1; i < bagCantonData.length; i++) {
    bagCantonData[i].y = bagCantonData[i].total - bagCantonData[i - 1].total;
    bagCantonData[i].diff = bagCantonData[i].y;
  }
  var chart = new Chart(canvas.id, {
    type: 'bar',
    options: {
      layout: {
          padding: {
              right: 20
          }
      },
      responsive: false,
      legend: {
        display: false
      },
      title: {
        display: true,
        text: _('Neue Fälle')
      },
      tooltips: {
        enabled: true,
        intersect: false,
        mode: 'x',
        position: 'nearest',
        bodyFontFamily: 'IBM Plex Mono',
        callbacks: {
         afterLabel: function(t, d) {
            var datasetLabel = d.datasets[t.datasetIndex].label;
            var yLabel = Math.abs(t.yLabel);
            return "Gesamtfälle" + ': ' + bagCantonData[t.index].total;
         },
         beforeLabel: function(t, d) {
            return false;
            var datasetLabel = d.datasets[t.datasetIndex].label;
            var yLabel = Math.abs(t.yLabel);
            return "Neue Fälle" + ': ' + bagCantonData[t.index].diff;
         }
       }
      },
      scales: {
        xAxes: [{
          stacked: true,
          type: 'time',
          time: {
            tooltipFormat: 'DD.MM.YYYY',
            unit: 'day',
            displayFormats: {
              day: 'DD.MM'
            }
          },
          ticks: {
            min: new Date("2020-05-31T12:00:00"),
            max: new Date(),
          },
          gridLines: {
              color: inDarkMode() ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'
          }
        }],
        yAxes: [{
          type: cartesianAxesTypes.LINEAR,
          stacked: true,
          position: 'right',
          ticks: {
            beginAtZero: true,
            suggestedMax: 10,
            callback: function(t, i) {
                   return t < 0 ? Math.abs(t) : t;
            }
          },
          gridLines: {
              color: inDarkMode() ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'
          }
        }]
      },
      plugins: {
        datalabels: getDiffDataLabels()
      }
  },
  data: {
    datasets: [
      {
        label: _('Neue Fälle'),
        data: bagCantonData,
        fill: false,
        cubicInterpolationMode: 'monotone',
        spanGaps: true,
        borderColor: '#FF0000',
        backgroundColor: '#FF0000',
        datalabels: {
          align: 'top',
          anchor: 'end'
        }
      }
    ]
  }
});


}

function barChartHospitalisations(place) {
  var filteredData = data.filter(function(d) { if(d.abbreviation_canton_and_fl==place) return d});
  var hospitalFiltered = filteredData.filter(function(d) { if(d.current_hosp!="") return d});
  if(hospitalFiltered.length==0) return;
  var div = document.getElementById("container_"+place);
  var canvas = document.createElement("canvas");
  //canvas.className  = "myClass";
  if(filteredData.length==1) {
    var text = filteredData[0].date+": "+filteredData[0].current_hosp+" hospitalisiert";
    if(filteredData[0].current_icu!="") text+=" , "+filteredData[0].current_icu+" in Intensivbehandlung";
    if(filteredData[0].current_vent!="") text+=" , "+filteredData[0].current_vent+" künstlich beatmet";
    div.appendChild(document.createElement("br"));
    div.appendChild(document.createTextNode(text));
  }
  else {
    canvas.id = "hosp"+place;
    canvas.height=250;
    div.appendChild(canvas);
    //canvas.width=350+filteredData.length*40;
  }
  if(!filteredData || filteredData.length<2) return;
  var moreFilteredData = filteredData; //.filter(function(d) { if(d.ncumul_conf!="") return d});
  var dateLabels = moreFilteredData.map(function(d) {
    var dateSplit = d.date.split("-");
    var day = parseInt(dateSplit[2]);
    var month = parseInt(dateSplit[1])-1;
    var year = parseInt(dateSplit[0]);
    var date = new Date(year,month,day);
    return date;
  });
  var datasets = [];
  var casesHosp = moreFilteredData.map(function(d) {if(d.current_hosp=="") return null; return d.current_hosp});
  datasets.push({
    label: _('Hospitalisiert'),
    data: casesHosp,
    fill: false,
    cubicInterpolationMode: 'monotone',
    spanGaps: true,
    borderColor: '#CCCC00',
    backgroundColor: '#CCCC00',
    datalabels: {
      align: 'end',
      anchor: 'end'
    }
  });
  var filteredForICU = moreFilteredData.filter(function(d) { if(d.current_icu!="") return d});
  if(filteredForICU.length>0) {
    var casesICU = moreFilteredData.map(function(d) {if(d.current_icu=="") return null; return d.current_icu});
    datasets.push({
      label: _('In Intensivbehandlung'),
      data: casesICU,
      fill: false,
      cubicInterpolationMode: 'monotone',
      spanGaps: true,
      borderColor: '#CF5F5F',
      backgroundColor: '#CF5F5F',
      datalabels: {
        align: 'end',
        anchor: 'end'
      }
    });
  }
  var filteredForVent = moreFilteredData.filter(function(d) { if(d.current_vent!="") return d});
  if(filteredForVent.length>0) {
    var casesVent = moreFilteredData.map(function(d) {if(d.current_vent=="") return null; return d.current_vent});
    datasets.push({
      label: _('Künstlich beatmet'),
      data: casesVent,
      fill: false,
      cubicInterpolationMode: 'monotone',
      spanGaps: true,
      borderColor: '#115F5F',
      backgroundColor: '#115F5F',
      datalabels: {
        align: 'end',
        anchor: 'end'
      }
    });
  }
  var filteredForIsolated = moreFilteredData.filter(function(d) { if(d.current_isolated!="") return d});
  if(filteredForIsolated.length>0) {
    var casesIsolated = moreFilteredData.map(function(d) {if(d.current_isolated=="") return null; return d.current_isolated});
    datasets.push({
      label: _('In Isolation'),
      data: casesIsolated,
      fill: false,
      cubicInterpolationMode: 'monotone',
      spanGaps: true,
      borderColor: '#AF5500',
      backgroundColor: '#AF5500',
      datalabels: {
        align: 'end',
        anchor: 'end'
      }
    });
  }
  var filteredForQuarantined = moreFilteredData.filter(function(d) { if(d.current_quarantined!="") return d});
  if(filteredForQuarantined.length>0) {
    var casesQuarantined = moreFilteredData.map(function(d) {if(d.current_quarantined=="") return null; return d.current_quarantined});
    datasets.push({
      label: _('In Quarantäne'),
      data: casesQuarantined,
      fill: false,
      cubicInterpolationMode: 'monotone',
      spanGaps: true,
      borderColor: '#3333AA',
      backgroundColor: '#3333AA',
      datalabels: {
        align: 'end',
        anchor: 'end'
      }
    });
  }
  var chart = new Chart(canvas.id, {
    type: 'line',
    options: {
      responsive: false,
      layout: {
          padding: {
              right: 20
          }
      },
      legend: {
        display: true,
        position: 'bottom'
      },
      title: {
        display: true,
        text: _('Hospitalisierte Fälle')
      },
      tooltips: {
        mode: 'index',
        intersect: false,
        bodyFontFamily: 'IBM Plex Mono',
        callbacks: {
          label: function(tooltipItems, data) {
            var value = tooltipItems.value;
            var index = tooltipItems.index;
            var datasetIndex = tooltipItems.datasetIndex;
            var changeStr = "";
            var maxLength = 0;
            for(var i=0; i<data.datasets.length; i++) {
              var titleToTest = data.datasets[i].label;
              if(titleToTest.length>maxLength) maxLength = titleToTest.length;
            }
            var title = data.datasets[datasetIndex].label+": ";
            var titlepadding = " ".repeat(maxLength+2-title.length);
            if(index>0) {
                var change = parseInt(value)-parseInt(data.datasets[datasetIndex].data[index-1]);
                var label = change>0 ? "+"+change : change;
                changeStr = " ("+label+")";
                if(Number.isNaN(change)) changeStr = "";
            }
            var tabbing = 3-value.length;
            var padding = " ".repeat(tabbing);
            return title+titlepadding+value+padding+changeStr;
          }
        }
      },
      scales: getScales(),
      plugins: {
        datalabels: false
      }
    },
    data: {
      labels: dateLabels,
      datasets: datasets
    }
  });


}

function getScales() {
  return {
    xAxes: [{
      type: 'time',
      time: {
        tooltipFormat: 'DD.MM.YYYY',
        unit: 'day',
        displayFormats: {
          day: 'DD.MM'
        }
      },
      ticks: {
        min: new Date("2020-02-24T23:00:00"),
        max: new Date(),
      },
      gridLines: {
          color: inDarkMode() ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'
      }
    }],
    yAxes: [{
      type: cartesianAxesTypes.LINEAR,
      position: 'right',
      ticks: {
        beginAtZero: true,
        suggestedMax: 10,
        callback: function(t, i) {
               return t < 0 ? Math.abs(t) : t;
        }
      },
      gridLines: {
          color: inDarkMode() ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'
      }
    }]
  };
}

function getDataLabels() {
  if(getDeviceState()==2) return false;
  return {
      color: inDarkMode() ? '#ccc' : 'black',
      font: {
        weight: 'bold',
      },
      formatter: function(value, context) {
        var index = context.dataIndex;
        if(index==0) return "";
        var lastValue = context.dataset.data[index-1].y;
        var change = value.y-lastValue;
        var label = change>0 ? "+"+change : change;
        return Math.abs(value.y);
      },
      offset: function (context) {
            var index = context.dataIndex;
            return index % 2 == 0 ? 10 : 30;
      },
  };
}

function getDiffDataLabels() {
  //if(getDeviceState()==2) return false;
  return {
      color: inDarkMode() ? '#ccc' : 'black',
      font: {
        weight: 'bold',
      },
      formatter: function(value, context) {
        var index = context.dataIndex;
        if(index==0) return "";
        var lastValue = context.dataset.data[index-1].y;
        var change = value.y-lastValue;
        var label = change>0 ? "+"+change : change;
        return Math.abs(value.y);
      }
  };
}

// Create the state-indicator element
var indicator = document.createElement('div');
indicator.className = 'state-indicator';
document.body.appendChild(indicator);

// Create a method which returns device state
function getDeviceState() {
    return parseInt(window.getComputedStyle(indicator).getPropertyValue('z-index'), 10);
}

var language;
function setLanguageNav() {
  var lang = window.navigator.userLanguage || window.navigator.language;
  var langParameter = getParameterValue("lang");
  if (langParameter != "") lang = langParameter;
  lang = lang.split("-")[0]; //not interested in de-CH de-DE etc.
  switch(lang) {
    case 'de':
    case 'fr':
    case 'it':
      break;
    default:
      lang = 'en';
  }
  language = lang;
  var href;
  var ul = document.getElementsByTagName("ul")[0];
  var li = document.createElement("li");
  if(lang=="de") {
    li.className = "here";
    href = "#"
  }
  else {
    href = "index.html?lang=de";
  }
  li.innerHTML = '<a href="'+href+'">DE</a>';
  ul.appendChild(li);
  li = document.createElement("li");
  if(lang=="fr") {
    li.className = "here";
    href = "#"
  }
  else {
    href = "index.html?lang=fr";
  }
  li.innerHTML = '<a href="'+href+'">FR</a>';
  ul.appendChild(li);
  li = document.createElement("li");
  if(lang=="it") {
    li.className = "here";
    href = "#"
  }
  else {
    href = "index.html?lang=it";
  }
  li.innerHTML = '<a href="'+href+'">IT</a>';
  ul.appendChild(li);
  li = document.createElement("li");
  if(lang=="en") {
    li.className = "here";
    href = "#"
  }
  else {
    href = "index.html?lang=en";
  }
  li.innerHTML = '<a href="'+href+'">EN</a>';
  ul.appendChild(li);
}

function addAxisButtons(elementAfter, chart) {
  var div = document.createElement('div');
  div.className = "chartButtons";
  addAxisButton(div, chart, _('Gesamt'), true, true);
  addAxisButton(div, chart, _('Ab 1. Juni'), false, false);
  elementAfter.before(div);
}

function addAxisButton(container, chart, name, all, isActive) {
  var button = document.createElement('button');
  button.className = "chartButton";
  if (isActive) button.classList.add('active');
  button.innerHTML = name;
  button.addEventListener('click', function() {
    this.classList.add('active');
    getSiblings(this, '.chartButton.active').forEach(element => element.classList.remove('active'));
    chart.options.scales.xAxes[0].ticks.min = all ? new Date("2020-02-23T22:00:00") : new Date("2020-05-31T22:00:00");
    chart.options.scales.yAxes[0].ticks.max = all ? 1600 : 200;
    chart.update();
  });
  container.append(button);
}

function getSiblings(element, selector) {
	var siblings = [];
  var sibling = element.parentNode.firstChild;

	while (sibling) {
		if (sibling.nodeType === 1 && sibling !== element && sibling.matches(selector)) {
			siblings.push(sibling);
		}
		sibling = sibling.nextSibling
	}

	return siblings;
}

function inDarkMode() {
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return true;
  }
  return false;
}
