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

getBAGCantons();

var worldData;
function getWorldData(chTotal) {
  d3.csv("https://open-covid-19.github.io/data/data_latest.csv", function(error, csvdata) {
      if(error!=null) {
        console.log(error.responseURL+" not found");
      }

      worldData = csvdata.filter(function(d) { if(d.Key==d.CountryCode) return d; }); //only use countries;
      var ch = worldData.filter(function(d) { if(d.Key=="CH") return d});
      if(ch && ch[0]) ch[0].Confirmed = ""+chTotal;
      parseWorldData();
      getWorldDataRelative(false);
  });
}

function getCanton(i) {
  //console.log("Get Canton "+i+" : "+new Date());
  var url = 'https://raw.githubusercontent.com/openZH/covid_19/master/fallzahlen_kanton_total_csv_v2/COVID19_Fallzahlen_Kanton_'+cantons[i]+'_total.csv';
  if(cantons[i] == "FL") {
    var url = 'https://raw.githubusercontent.com/openZH/covid_19/master/fallzahlen_kanton_total_csv_v2/COVID19_Fallzahlen_FL_total.csv';
  }
  d3.csv(url, function(error, csvdata) {
      if(error!=null) {
        console.log(error.responseURL+" not found");
        actualData.push({
          date: _("Keine Daten"),
          ncumul_conf: "",
          abbreviation_canton_and_fl: cantons[i]
        });
        actualDeaths.push({
          date: _("Keine Daten"),
          ncumul_deceased: "",
          abbreviation_canton_and_fl: cantons[i]
        });
        /*actualHospitalisation.push({
          date: _("Keine Daten"),
          ncumul_deceased: "",
          abbreviation_canton_and_fl: cantons[i]
        });*/
      }
      else {
        for(var x=0; x<csvdata.length; x++) {
          if(!csvdata[x].abbreviation_canton_and_fl) continue;
          if(csvdata[x].date.split(".").length>1) {
            var splitDate = csvdata[x].date.split(".");
            var day = splitDate[0];
            var month = splitDate[1];
            var year = splitDate[2];
            csvdata[x].date = year+"-"+month+"-"+day;
          }
          data.push(csvdata[x]);
        }
        var latestData = csvdata[csvdata.length-1];
        var filteredDataForDeaths = csvdata.filter(function(d) { if(d.ncumul_deceased && d.ncumul_deceased!="") return d});
        if(filteredDataForDeaths.length==0) {
          actualDeaths.push(latestData);
        }
        else {
          actualDeaths.push(filteredDataForDeaths[filteredDataForDeaths.length-1]);
        }
        var filteredDataForHospitalisation = csvdata.filter(function(d) { if(d.current_hosp && d.current_hosp!="") return d});
        if(filteredDataForHospitalisation.length==0) {
          //actualHospitalisation.push(latestData);
        }
        else {
          actualHospitalisation.push(filteredDataForHospitalisation[filteredDataForHospitalisation.length-1]);
        }
        var filteredDataForIsolation = csvdata.filter(function(d) { if((d.current_isolated!=null && d.current_isolated!="") || (d.current_quarantined!=null && d.current_quarantined!="")) return d});
        if(filteredDataForIsolation.length==0) {
          //actualHospitalisation.push(latestData);
        }
        else {
          actualIsolation.push(filteredDataForIsolation[filteredDataForIsolation.length-1]);
        }
        var filteredDataForCases = csvdata.filter(function(d) { if(d.ncumul_conf && d.ncumul_conf!="") return d});
        if(filteredDataForCases.length==0) {
          actualData.push(latestData);
        }
        else {
          actualData.push(filteredDataForCases[filteredDataForCases.length-1]);
        }
        if (verbose) {
          console.log("added "+csvdata.length+" rows for "+cantons[i]);
        }
      }
      if(i<cantons.length-1) {
        getCanton(i+1);
      }
      else {
        processData();
      }
  });
}

function processData() {
  document.getElementById("loadingspinner").style.display = 'none';
  document.getElementById("loaded").style.display = 'block';
  processActualData();
  for(var i=0; i<cantons.length; i++) {
    barChartCases(cantons[i]);
  }
  //console.log("End process: "+new Date());
}


var bagData;
function getBAGCantons() {
  d3.csv("https://raw.githubusercontent.com/rsalzer/COVID_19_AGE/master/data/casesPerCanton.csv", function(error, csvdata) {
      if(csvdata!=null) {
          bagData = csvdata;
      }
      getCanton(0);
  });
}

function processActualData() {
  var sortedActual = Array.from(actualData).sort(function(a, b){return b.ncumul_conf-a.ncumul_conf});
  var table = document.getElementById("confirmed_1");
  var total = 0;
  var totalBAG = 0;
  for(var i=0; i<sortedActual.length; i++) {
    var actual = sortedActual[i];
    if(actual.abbreviation_canton_and_fl=='FL') continue;
    var now = actual.ncumul_conf;
    if(now!="") {
      total+=parseInt(now);
    }
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
    text = document.createTextNode(bagData[bagData.length-1].date);
    td.className = "BAG left";
    td.appendChild(text);
    tr.appendChild(td);
    td = document.createElement("td");
    var text = document.createTextNode(now);
    td.appendChild(text);
    tr.appendChild(td);
    td = document.createElement("td");
    var bagNr = bagData[bagData.length-1][actual.abbreviation_canton_and_fl];
    text = document.createTextNode(bagNr);
    td.appendChild(text);
    tr.appendChild(td);
    table.appendChild(tr);
    td = document.createElement("td");
    totalBAG += parseInt(bagNr);
    var diff = parseInt(bagNr) - parseInt(now);
    text = document.createTextNode(diff);
    td.appendChild(text);
    tr.appendChild(td);
    table.appendChild(tr);
  }
  var tr = document.createElement("tr");
  var formattedTotal = total.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "’");
  var formattedBAGTotal = totalBAG.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "’");
  var formattedDiff = (totalBAG-total).toString().replace(/\B(?=(\d{3})+(?!\d))/g, "’");
  tr.innerHTML = "<td><a class='flag CH' href='#detail_CH'></a></a></td><td><b>TOTAL CH</b></td><td></td><td><b>"+formattedTotal+"</b></td><td><b>"+formattedBAGTotal+"</b></td><td>"+formattedDiff+"</td>";
  table.append(tr);
}


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

function barChartAllCH() {
  date = new Date(Date.UTC(2020, 1, 25));
  var now = new Date();
  //alert(now.toISOString());
  var dataPerDay = [];
  while(date<now) {
    var dateString = date.toISOString();
    dateString = dateString.substring(0,10);
    if (verbose) {
      console.log(dateString);
    }
    var singleDayObject = {};
    singleDayObject.date = dateString;
    singleDayObject.data = [];
    for(var i=0; i<cantons.length-1; i++) { //without FL
      var canton = cantons[i];
      var cantonTotal = getNumConf(canton, date, "ncumul_conf");
      singleDayObject.data.push(cantonTotal);
    }
    var total = singleDayObject.data.reduce(function(acc, val) { return acc + val.ncumul_conf; }, 0);
    singleDayObject.total = total;
    dataPerDay.push(singleDayObject);
    date = new Date(Date.UTC(date.getFullYear(),date.getMonth(),date.getDate()+1));
  }
  //console.log(dataPerDay);
  var place = "CH";
  var section = document.getElementById("detail");
  var article = document.createElement("article");
  article.id="detail_"+place;
  var h3 = document.createElement("h3");
  h3.className = "flag "+place;
  var text = document.createTextNode(_(names[place]));
  h3.appendChild(text);
  article.appendChild(h3);
  var div = document.createElement("div");
  div.className = "canvas-dummy";
  div.id = "container_"+place;
  var canvas = document.createElement("canvas");
  canvas.id = place;
  canvas.height=470;
  div.appendChild(canvas);
  article.appendChild(div);
  section.appendChild(article);
  div.scrollLeft = 1700;
  var dateLabels = dataPerDay.map(function(d) {
    var dateSplit = d.date.split("-");
    var day = parseInt(dateSplit[2]);
    var month = parseInt(dateSplit[1])-1;
    var year = parseInt(dateSplit[0]);
    var date = new Date(year,month,day);
    return date;
  });
  var cases = dataPerDay.map(function(d) {return d.total});
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
        display: false
      },
      title: {
        display: true,
        text: _('Bestätigte Fälle')
      },
      tooltips: {
        mode: 'nearest',
        intersect: false,
        position : 'custom',
        caretSize: 0,
        bodyFontFamily: 'IBM Plex Mono',
        callbacks: {
          label: function(tooltipItems, data) {
            var value = tooltipItems.value;
            var index = tooltipItems.index;
            var changeStr = "";
            if(index>0) {
                var change = parseInt(value)-parseInt(cases[index-1]);
                var label = change>0 ? "+"+change : change;
                changeStr = " ("+label+")";
            }
            var tabbing = 6-value.length;
            var padding = " ".repeat(tabbing);
            return padding+value+changeStr;
          },
          afterBody: function(tooltipItems, data) {
            //console.log(tooltipItems);
            //console.log(data);
            multistringText = [""];
            var index = tooltipItems[0].index;
            var dataForThisDay = dataPerDay[index];
            var sorted = Array.from(dataForThisDay.data).sort(function(a, b){return b.ncumul_conf-a.ncumul_conf});
            sorted.forEach(function(item) {
              var tabbing = 5-(""+item.ncumul_conf).length;
              var padding = " ".repeat(tabbing);
              multistringText.push(item.canton+":"+padding+item.ncumul_conf+" ("+item.date+")");
            });

            return multistringText;
          }
        }
      },
      scales: getScales(),
      plugins: {
        datalabels: getDataLabels()
      }
  },
  data: {
    labels: dateLabels,
    datasets: [
      {
        data: cases,
        fill: false,
        cubicInterpolationMode: 'monotone',
        spanGaps: true,
        borderColor: '#F15F36',
        backgroundColor: '#F15F36',
        datalabels: {
          align: /*'end',*/ function (context) {
                var index = context.dataIndex;
                return index % 2 == 0 ? 'top' : 'bottom';
          },
          offset: function (context) {
                var index = context.dataIndex;
                return index % 2 == 0 ? 5 : 10;
          },
          anchor: 'end'
        }
      }
    ]
  }
});

  addAxisButtons(canvas, chart);
}

function barChartCases(place) {
  var filteredData = data.filter(function(d) { if(d.abbreviation_canton_and_fl==place) return d});
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
  //canvas.className  = "myClass";
  if(filteredData.length==0) {
    div.appendChild(document.createTextNode(_("Keine Daten")));
  }
  else if(filteredData.length==1) {
    div.appendChild(document.createTextNode(_("Ein Datensatz")+": "+filteredData[0].ncumul_conf+" " + _("Fälle am")+" "+filteredData[0].date));
  }
  else {
    canvas.id = place;
    canvas.height=250;
    //canvas.width=350+filteredData.length*40;
    div.appendChild(canvas);
  }
  article.appendChild(div);
  section.appendChild(article);
  div.scrollLeft = 1700;
  if(!filteredData || filteredData.length<2) return;
  var moreFilteredData = filteredData.filter(function(d) { if(d.ncumul_conf!="") return d});
  var chartData = moreFilteredData.map(function(d) {
    var dateSplit = d.date.split("-");
    var day = parseInt(dateSplit[2]);
    var month = parseInt(dateSplit[1])-1;
    var year = parseInt(dateSplit[0]);
    var date = new Date(year,month,day);
    var obj = {};
    obj.x = date;
    obj.y = d.ncumul_conf;
    return obj;
  });
  //chartData[0].y = 0;
  //for (var i = 1; i < chartData.length; i++) chartData[i].y = chartData[i].total - chartData[i - 1].total;
  var filterBAG = bagData.filter(function(d) { if(d[place]!="") return d});
  var bagCantonData = filterBAG.map(function(d) {
    var dateSplit = d.date.split("-");
    var day = parseInt(dateSplit[2]);
    var month = parseInt(dateSplit[1])-1;
    var year = parseInt(dateSplit[0]);
    var date = new Date(year,month,day);
    var obj = {};
    obj.x = date;
    obj.y = -d[place];
    return obj;
  });
  // bagCantonData[0].y = 0;
  // for (var i = 1; i < bagCantonData.length; i++) bagCantonData[i].y = -(bagCantonData[i].total - bagCantonData[i - 1].total);
  var cases = moreFilteredData.map(function(d) {return d.ncumul_conf});

  var chart = new Chart(canvas.id, {
    type: 'line',
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
        text: _('Bestätigte Fälle')
      },
      tooltips: {
        enabled: true,
        intersect: false,
        mode: 'x',
        position: 'nearest',
        bodyFontFamily: 'IBM Plex Mono',
        callbacks: {
         label: function(t, d) {
            var datasetLabel = d.datasets[t.datasetIndex].label;
            var yLabel = Math.abs(t.yLabel);
            return datasetLabel + ': ' + yLabel;
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
            min: new Date("2020-02-24T23:00:00"),
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
        //labels: dateLabels,
        label: _('Fälle gem. Kanton'),
        data: chartData,
        fill: false,
        cubicInterpolationMode: 'monotone',
        spanGaps: true,
        borderColor: '#F15F36',
        backgroundColor: '#F15F36',
        datalabels: {
          align: 'top',
          anchor: 'end'
        }
      },
      {
        label: _('Fälle gem. BAG'),
        data: bagCantonData,
        fill: false,
        cubicInterpolationMode: 'monotone',
        spanGaps: true,
        borderColor: '#FF0000',
        backgroundColor: '#FF0000',
        datalabels: {
          align: 'bottom',
          anchor: 'start'
        }
      }
    ]
  }
});

  addAxisButtons(canvas, chart);
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

  addAxisButtons(canvas, chart);
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
        var change = Math.abs(value.y-lastValue);
        var label = change>0 ? "+"+change : change;
        return label;
      }
  };
}

function getDiffDataLabels() {
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

/* var language;
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
*/

function addAxisButtons(elementAfter, chart) {
  var div = document.createElement('div');
  div.className = "chartButtons";
  addAxisButton(div, chart, _('Logarithmisch'), cartesianAxesTypes.LOGARITHMIC, false);
  addAxisButton(div, chart, _('Linear'), cartesianAxesTypes.LINEAR, true);
  elementAfter.before(div);
}

function addAxisButton(container, chart, name, cartesianAxisType, isActive) {
  var button = document.createElement('button');
  button.className = "chartButton";
  if (isActive) button.classList.add('active');
  button.innerHTML = name;
  button.addEventListener('click', function() {
    this.classList.add('active');
    getSiblings(this, '.chartButton.active').forEach(element => element.classList.remove('active'));

    chart.options.scales.yAxes[0].type = cartesianAxisType;
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
