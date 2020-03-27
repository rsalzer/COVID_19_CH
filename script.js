var data;

var cantons = ['AG', 'AI', 'AR', 'BE', 'BL', 'BS', 'FR', 'GE', 'GL', 'GR', 'JU', 'LU', 'NE', 'NW', 'OW', 'SG', 'SH', 'SO', 'SZ', 'TG', 'TI', 'UR', 'VD', 'VS', 'ZG', 'ZH', 'FL'];

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
  "FL": "Fürstentum Liechtenstein"
};

var actualData = [];
var actualDeaths = [];
var actualHospitalisation = [];
var data = [];

getCanton(0);

function getCanton(i) {
  var url = 'https://raw.githubusercontent.com/openZH/covid_19/master/fallzahlen_kanton_total_csv/COVID19_Fallzahlen_Kanton_'+cantons[i]+'_total.csv'
  if(cantons[i] == "FL") {
    url = 'https://raw.githubusercontent.com/openZH/covid_19/master/fallzahlen_kanton_total_csv/COVID19_Fallzahlen_FL_total.csv'
  }
  d3.csv(url, function(error, csvdata) {
      if(error!=null) {
        console.log(error.responseURL+" not found");
        actualData.push({
          date: "Keine Daten",
          ncumul_conf: "",
          abbreviation_canton_and_fl: cantons[i]
        });
        actualDeaths.push({
          date: "Keine Daten",
          ncumul_deceased: "",
          abbreviation_canton_and_fl: cantons[i]
        });
        /*actualHospitalisation.push({
          date: "Keine Daten",
          ncumul_deceased: "",
          abbreviation_canton_and_fl: cantons[i]
        });*/
      }
      else {
        for(var x=0; x<csvdata.length; x++) {
          data.push(csvdata[x]);
        }
        var latestData = csvdata[csvdata.length-1];
        var filteredDataForDeaths = csvdata.filter(function(d) { if(d.ncumul_deceased!="") return d});
        if(filteredDataForDeaths.length==0) {
          actualDeaths.push(latestData);
        }
        else {
          actualDeaths.push(filteredDataForDeaths[filteredDataForDeaths.length-1]);
        }
        var filteredDataForHospitalisation = csvdata.filter(function(d) { if(d.ncumul_hosp!="") return d});
        if(filteredDataForHospitalisation.length==0) {
          //actualHospitalisation.push(latestData);
        }
        else {
          actualHospitalisation.push(filteredDataForHospitalisation[filteredDataForHospitalisation.length-1]);
        }
        if(latestData.ncumul_conf)
          actualData.push(latestData);
        else {
          if(csvdata.length>1 && csvdata[csvdata.length-2].ncumul_conf) //Special case for FR
            actualData.push(csvdata[csvdata.length-2]);
          else {
            actualData.push(latestData);
          }
        }
        console.log("added "+csvdata.length+" rows for "+cantons[i]);
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
  console.log("Plotting data");
  processActualData();
  processActualDeaths();
  processActualHospitalisation();
  for(var i=0; i<cantons.length; i++) {
    barChartCases(cantons[i]);
    barChartHospitalisations(cantons[i]);
  }
}

function processActualData() {
  var h3 = document.createElement("h3");
  var text = document.createTextNode("Aktueller Stand der positiv getesteten Fälle gemäss Daten der Kantone");
  h3.appendChild(text);
  document.getElementById("last").append(h3);
  var sortedActual = Array.from(actualData).sort(function(a, b){return b.ncumul_conf-a.ncumul_conf});
  var head = "<tr><th>Kanton</th><th>Datum</th><th># Fälle</th></tr>"
  var firstTable = document.createElement("table");
  firstTable.innerHTML = head;
  firstTable.id = "firstTable";
  var secondTable = document.createElement("table");
  secondTable.id = "secondTable";
  secondTable.innerHTML = head;
  var total = 0;
  for(var i=0; i<sortedActual.length; i++) {
    var table;
    if(i<sortedActual.length/2) table = firstTable;
    else table = secondTable;
    var actual = sortedActual[i];
    var now = actual.ncumul_conf;
    if(actual.abreviation_canton_and_fl!="FL" && now!="") total+=parseInt(now);
    /*
    var last = actual.last;
    var diff = now-last;
    var diffStr = diff>=0 ? "+"+diff : diff;
    var lastDate = actual.lastDate;
    var changeRatio = Math.round(diff/last * 100);
    var changeRatioStr = changeRatio>=0 ? "+"+changeRatio+"%" : changeRatio+"%";
    if(!last || last==0) changeRatioStr = "";
    var alert = "";
    if(lastDate!=chLastDate) alert = "(Daten vom "+lastDate+") ";
    //console.log(lastDate+" : "+cantons[i]+": "+actual+" ("+diffStr+")");
    */
    var image = document.createElement("img");
    image.height = 15;
    image.src = "wappen/"+actual.abbreviation_canton_and_fl+".png";
    var tr = document.createElement("tr");
    var td = document.createElement("td");
    td.appendChild(image);
    var a = document.createElement("a");
    a.href = "#div_"+actual.abbreviation_canton_and_fl;
    a.appendChild(document.createTextNode(" "+actual.abbreviation_canton_and_fl+":"));
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
    td.style["font-size"] = "small";
    if(actual.source.substring(0,2)=="ht") {
      a = document.createElement("a");
      a.href = actual.source;
      a.appendChild(document.createTextNode("(Quelle)"));
      td.appendChild(a);
    }
    else {
      a = document.createElement("a");
      a.href = "https://github.com/openZH/covid_19/blob/master/fallzahlen_kanton_total_csv/COVID19_Fallzahlen_Kanton_"+actual.abbreviation_canton_and_fl+"_total.csv";
      a.appendChild(document.createTextNode("(Quelle)"));
      td.appendChild(a);
    }
    tr.appendChild(td);
    /*
    td = document.createElement("td");
    td.appendChild(text);
    tr.appendChild(td);
    td = document.createElement("td");
    text = document.createTextNode(diffStr);
    td.appendChild(text);
    tr.appendChild(td);
    td = document.createElement("td");
    text = document.createTextNode(changeRatioStr);
    td.appendChild(text);
    tr.appendChild(td);
    */
    table.appendChild(tr);
  }
  var tr = document.createElement("tr");
  tr.id = "latestrow";
  tr.innerHTML = "<td><img src='wappen/CH.png' height=15/> CH</td><td>TOTAL</td><td>"+total+"</td>";
  secondTable.append(tr);
  document.getElementById("last").append(firstTable);
  document.getElementById("last").append(secondTable);
  //document.getElementById("last").append(document.createTextNode("Total CH gemäss Summe Kantone: "+total));
}

function processActualDeaths() {
  var h3 = document.createElement("h3");
  var text = document.createTextNode("Verstorbene gemäss Daten der Kantone");
  h3.appendChild(text);
  document.getElementById("last").append(h3);
  var sortedActual = Array.from(actualDeaths).sort(function(a, b){return b.ncumul_deceased-a.ncumul_deceased});
  var head = "<tr><th>Kanton</th><th>Datum</th><th># Fälle</th></tr>"
  var firstTable = document.createElement("table");
  firstTable.innerHTML = head;
  firstTable.id = "firstTable";
  var secondTable = document.createElement("table");
  secondTable.id = "secondTable";
  secondTable.innerHTML = head;
  var total = 0;
  for(var i=0; i<sortedActual.length; i++) {
    var table;
    if(i<sortedActual.length/2) table = firstTable;
    else table = secondTable;
    var actual = sortedActual[i];
    var now = actual.ncumul_deceased;
    if(actual.abreviation_canton_and_fl!="FL" && now!="") total+=parseInt(now);
    /*
    var last = actual.last;
    var diff = now-last;
    var diffStr = diff>=0 ? "+"+diff : diff;
    var lastDate = actual.lastDate;
    var changeRatio = Math.round(diff/last * 100);
    var changeRatioStr = changeRatio>=0 ? "+"+changeRatio+"%" : changeRatio+"%";
    if(!last || last==0) changeRatioStr = "";
    var alert = "";
    if(lastDate!=chLastDate) alert = "(Daten vom "+lastDate+") ";
    //console.log(lastDate+" : "+cantons[i]+": "+actual+" ("+diffStr+")");
    */
    var image = document.createElement("img");
    image.height = 15;
    image.src = "wappen/"+actual.abbreviation_canton_and_fl+".png";
    var tr = document.createElement("tr");
    var td = document.createElement("td");
    td.appendChild(image);
    var a = document.createElement("a");
    a.href = "#div_"+actual.abbreviation_canton_and_fl;
    a.appendChild(document.createTextNode(" "+actual.abbreviation_canton_and_fl+":"));
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
    td.style["font-size"] = "small";
    if(actual.source.substring(0,2)=="ht") {
      a = document.createElement("a");
      a.href = actual.source;
      a.appendChild(document.createTextNode("(Quelle)"));
      td.appendChild(a);
    }
    else {
      a = document.createElement("a");
      a.href = "https://github.com/openZH/covid_19/blob/master/fallzahlen_kanton_total_csv/COVID19_Fallzahlen_Kanton_"+actual.abbreviation_canton_and_fl+"_total.csv";
      a.appendChild(document.createTextNode("(Quelle)"));
      td.appendChild(a);
    }
    tr.appendChild(td);
    /*
    td = document.createElement("td");
    td.appendChild(text);
    tr.appendChild(td);
    td = document.createElement("td");
    text = document.createTextNode(diffStr);
    td.appendChild(text);
    tr.appendChild(td);
    td = document.createElement("td");
    text = document.createTextNode(changeRatioStr);
    td.appendChild(text);
    tr.appendChild(td);
    */
    table.appendChild(tr);
  }
  var tr = document.createElement("tr");
  tr.id = "latestrow";
  tr.innerHTML = "<td><img src='wappen/CH.png' height=15/> CH</td><td>TOTAL</td><td>"+total+"</td>";
  secondTable.append(tr);
  document.getElementById("last").append(firstTable);
  document.getElementById("last").append(secondTable);
  //document.getElementById("last").append(document.createTextNode("Total CH gemäss Summe Kantone: "+total));
}

function processActualHospitalisation() {
  var h3 = document.createElement("h3");
  var text = document.createTextNode("Fälle in Spitalbehandlung");
  h3.appendChild(text);
  document.getElementById("last").append(h3);
  var sortedActual = Array.from(actualHospitalisation).sort(function(a, b){return b.ncumul_hosp-a.ncumul_hosp});
  var head = "<tr><th>Kanton</th><th>Datum</th><th>Hospitalisiert</th><th>In Intensivbehandlung</th><th>Künstlich beatmet</th></tr>"
  /*
  var firstTable = document.createElement("table");
  firstTable.innerHTML = head;
  firstTable.id = "firstTable";
  */
  var secondTable = document.createElement("table");
  secondTable.class = "hospitalisationtable"
  secondTable.id = "secondTable";
  secondTable.innerHTML = head;

  var total = 0;
  var totalicu = 0;
  var totalvent = 0;
  for(var i=0; i<sortedActual.length; i++) {
    var table;
    //if(i<sortedActual.length/2)
    table = secondTable;
    //else table = secondTable;
    var actual = sortedActual[i];
    var now = actual.ncumul_hosp;
    if(actualHospitalisation.abreviation_canton_and_fl!="FL" && now!="") total+=parseInt(now);
    if(actualHospitalisation.abreviation_canton_and_fl!="FL" && actual.ncumul_ICU!="") totalicu+=parseInt(actual.ncumul_ICU);
    if(actualHospitalisation.abreviation_canton_and_fl!="FL" && actual.ncumul_vent!="") totalvent+=parseInt(actual.ncumul_vent);
    /*
    var last = actual.last;
    var diff = now-last;
    var diffStr = diff>=0 ? "+"+diff : diff;
    var lastDate = actual.lastDate;
    var changeRatio = Math.round(diff/last * 100);
    var changeRatioStr = changeRatio>=0 ? "+"+changeRatio+"%" : changeRatio+"%";
    if(!last || last==0) changeRatioStr = "";
    var alert = "";
    if(lastDate!=chLastDate) alert = "(Daten vom "+lastDate+") ";
    //console.log(lastDate+" : "+cantons[i]+": "+actual+" ("+diffStr+")");
    */
    var image = document.createElement("img");
    image.height = 15;
    image.src = "wappen/"+actual.abbreviation_canton_and_fl+".png";
    var tr = document.createElement("tr");
    var td = document.createElement("td");
    td.appendChild(image);
    var a = document.createElement("a");
    a.href = "#div_"+actual.abbreviation_canton_and_fl;
    a.appendChild(document.createTextNode(" "+actual.abbreviation_canton_and_fl+":"));
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
    text = document.createTextNode(actual.ncumul_ICU);
    td.appendChild(text);
    tr.appendChild(td);
    td = document.createElement("td");
    text = document.createTextNode(actual.ncumul_vent);
    td.appendChild(text);
    tr.appendChild(td);
    td = document.createElement("td");
    td.style["font-size"] = "small";
    if(actual.source.substring(0,2)=="ht") {
      a = document.createElement("a");
      a.href = actual.source;
      a.appendChild(document.createTextNode("(Quelle)"));
      td.appendChild(a);
    }
    else {
      a = document.createElement("a");
      a.href = "https://github.com/openZH/covid_19/blob/master/fallzahlen_kanton_total_csv/COVID19_Fallzahlen_Kanton_"+actual.abbreviation_canton_and_fl+"_total.csv";
      a.appendChild(document.createTextNode("(Quelle)"));
      td.appendChild(a);
    }
    tr.appendChild(td);
    /*
    td = document.createElement("td");
    td.appendChild(text);
    tr.appendChild(td);
    td = document.createElement("td");
    text = document.createTextNode(diffStr);
    td.appendChild(text);
    tr.appendChild(td);
    td = document.createElement("td");
    text = document.createTextNode(changeRatioStr);
    td.appendChild(text);
    tr.appendChild(td);
    */
    table.appendChild(tr);
  }
  var tr = document.createElement("tr");
  tr.id = "latestrow";
  tr.innerHTML = "<td><img src='wappen/CH.png' height=15/> CH</td><td>TOTAL</td><td>"+total+"</td><td>"+totalicu+"</td><td>"+totalvent+"</b></td>";
  secondTable.append(tr);
  document.getElementById("last").append(secondTable);
  document.getElementById("last").append(document.createElement("p"));
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
        text: 'Unbestätigte Fälle Schweiz'
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

function barChartCases(place) {
  var filteredData = data.filter(function(d) { if(d.abbreviation_canton_and_fl==place) return d});
  var div = document.createElement("div");
  div.height = 400;
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
  if(filteredData.length==0) {
    div.appendChild(document.createTextNode("Keine Daten"));
  }
  else if(filteredData.length==1) {
    div.appendChild(document.createTextNode("Ein Datensatz: "+filteredData[0].ncumul_conf+" Fälle am "+filteredData[0].date));
  }
  else {
    canvas.id = place;
    canvas.height=300;
    //canvas.width=350+filteredData.length*40;
    div.appendChild(canvas);
  }
  document.getElementById("cantons").appendChild(div);
  if(!filteredData || filteredData.length<2) return;
  var moreFilteredData = filteredData.filter(function(d) { if(d.ncumul_conf!="") return d});
  var dateLabels = moreFilteredData.map(function(d) {
    var dateSplit = d.date.split("-");
    var day = parseInt(dateSplit[2]);
    var month = parseInt(dateSplit[1])-1;
    var year = parseInt(dateSplit[0]);
    var date = new Date(year,month,day);
    return date;
  });
  var cases = moreFilteredData.map(function(d) {return d.ncumul_conf});
  var chart = new Chart(canvas.id, {
    type: 'line',
    options: {
      responsive: false,
      legend: {
        display: false
      },
      title: {
        display: true,
        text: 'Bestätigte Fälle'
      },
      scales: {
            xAxes: [{
                type: 'time',
                time: {
                    tooltipFormat: 'D.MM.YYYY',
                    unit: 'day',
                    displayFormats: {
                        day: 'D.MM'
                    }
                }
            }]
        },
      plugins: {
          datalabels: {
  						color: 'black',
  						font: {
  							weight: 'bold'
  						},
  						formatter: function(value, context) {
                var index = context.dataIndex;
                if(index==0) return "";
                var lastValue = context.dataset.data[index-1];
                var percentageChange = value/lastValue - 1;
                var rounded = Math.round(percentageChange * 100);
                var label = ""+rounded;
                if(rounded >= 0) label = "+"+label+"%";
                else label = "-"+label+"%";

                var change = value-lastValue;
                var label = change>0 ? "+"+change : change;
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
          fill: false,
          cubicInterpolationMode: 'monotone',
          spanGaps: true,
          borderColor: '#F15F36',
          backgroundColor: '#F15F36',
          datalabels: {
						align: 'end',
						anchor: 'end'
					}
        }
      ]
    }
  });
}

function barChartHospitalisations(place) {
  var filteredData = data.filter(function(d) { if(d.abbreviation_canton_and_fl==place && d.ncumul_hosp!="") return d});
  if(filteredData.length==0) return;
  var div = document.getElementById("div_"+place);
  var canvas = document.createElement("canvas");
  //canvas.className  = "myClass";
  if(filteredData.length==1) {
    var text = filteredData[0].date+": "+filteredData[0].ncumul_hosp+" hospitalisiert";
    if(filteredData[0].ncumul_ICU!="") text+=" , "+filteredData[0].ncumul_ICU+" in Intensivbehandlung";
    if(filteredData[0].ncumul_vent!="") text+=" , "+filteredData[0].ncumul_vent+" künstlich beatmet";
    div.appendChild(document.createElement("br"));
    div.appendChild(document.createTextNode(text));
  }
  else {
    canvas.id = "hosp"+place;
    canvas.height=300;
    //canvas.width=350+filteredData.length*40;
    div.appendChild(canvas);
  }
  if(!filteredData || filteredData.length<2) return;
  var moreFilteredData = filteredData.filter(function(d) { if(d.ncumul_hosp!="") return d});
  var dateLabels = moreFilteredData.map(function(d) {
    var dateSplit = d.date.split("-");
    var day = parseInt(dateSplit[2]);
    var month = parseInt(dateSplit[1])-1;
    var year = parseInt(dateSplit[0]);
    var date = new Date(year,month,day);
    return date;
  });
  var datasets = [];
  var casesHosp = moreFilteredData.map(function(d) {return d.ncumul_hosp});
  datasets.push({
    label: 'Hospitalisiert',
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
  var filteredForICU = moreFilteredData.filter(function(d) { if(d.ncumul_ICU!="") return d});
  if(filteredForICU.length>0) {
    var casesICU = moreFilteredData.map(function(d) {if(d.ncumul_ICU=="") return null; return d.ncumul_ICU});
    datasets.push({
      label: 'In Intensivbehandlung',
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
  var filteredForVent = moreFilteredData.filter(function(d) { if(d.ncumul_vent!="") return d});
  if(filteredForVent.length>0) {
    var casesVent = moreFilteredData.map(function(d) {if(d.ncumul_vent=="") return null; return d.ncumul_vent});
    datasets.push({
      label: 'Künstlich beatmet',
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
  var chart = new Chart(canvas.id, {
    type: 'line',
    options: {
      responsive: false,
      legend: {
        display: true,
        position: 'bottom'
      },
      title: {
        display: true,
        text: 'Hospitalisierte Fälle'
      },
      tooltips: {
            mode: 'index',
            axis: 'y'
      },
      scales: {
            xAxes: [{
                type: 'time',
                time: {
                    tooltipFormat: 'D.MM.YYYY',
                    unit: 'day',
                    displayFormats: {
                        day: 'D.MM'
                    }
                }
            }],
            yAxes: [{
              ticks: {
                beginAtZero: true,
                suggestedMax: 10,
              },
            }]
        },
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
