var data;

var oldDate = null;
console.logCopy = console.log.bind(console);
console.log = function(arguments)
{
    if (arguments.length)
    {
        var d = new Date();
        if(oldDate==null) timestamp = '';
        else {
          var diff = d-oldDate;
          var msec = diff;
          var ss = Math.floor(msec / 1000);
          msec -= ss * 1000;
          var timestamp = '[' + ss + ':' + msec + '] ';
        }
        oldDate = d;
        this.logCopy(timestamp, arguments);
    }
};

const cantons = ['AG', 'AI', 'AR', 'BE', 'BL', 'BS', 'FR', 'GE', 'GL', 'GR', 'JU', 'LU', 'NE', 'NW', 'OW', 'SG', 'SH', 'SO', 'SZ', 'TG', 'TI', 'UR', 'VD', 'VS', 'ZG', 'ZH', 'FL'];
const population = {
  "CH": 8619259,
  "AG": 687491,
  "AI": 16136,
  "AR": 55388,
  "BE": 1040412,
  "BL": 289534,
  "BS": 196386,
  "FR": 322658,
  "GE": 504205,
  "GL": 40713,
  "GR": 198787,
  "JU": 73490,
  "LU": 414364,
  "NE": 176340,
  "NW": 43039,
  "OW": 37906,
  "SG": 511811,
  "SH": 82454,
  "SO": 275661,
  "SZ": 160289,
  "TG": 280068,
  "TI": 350887,
  "UR": 36732,
  "VD": 808652,
  "VS": 345875,
  "ZG": 127387,
  "ZH": 1542594,
  "FL": 38749
};
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
var data = [];

Chart.defaults.global.defaultFontFamily = "IBM Plex Sans";
document.getElementById("loaded").style.display = 'none';

setLanguageNav();

//console.log("START");
getCanton(0);

function getCanton(i) {
  var url = "https://raw.githubusercontent.com/openZH/covid_19/master/COVID19_Fallzahlen_CH_total_v2.csv";
  d3.csv(url, function(error, csvdata) {
      if(error!=null) {
        alert("Daten konnten nicht geladen werden");
      }
      else {
        data = csvdata;
        processData();
      }
  });
}

function processData() {
  var start = new Date();
  //console.log("Process actual");
  prepareData();
  var filter = filterAllCH(getDeviceState()==2 ? 2 : 1);


  processActualData(filter, "ncumul_conf");
  processActualDeaths(filter);
  processActualHospitalisation(filter);
  // console.log("End actual");
  //getBAGIsolation();
  // console.log("Start All CH");

  barChartAllCH(filter);
  // console.log("End All CH / Start Deaths");
  // console.log("End Deaths CH / Start Hosp");
  //barChartAllCHHospitalisations();
  // console.log("End Hosp CH");
  //console.log("Start Cantons");
  for(var i=0; i<cantons.length; i++) {
    barChartCases(i);
  }
  //console.log("End Single Cantons");
  document.getElementById("loadingspinner").style.display = 'none';
  document.getElementById("loaded").style.display = 'block';
}

var total;
function processActualData(filter, mode) {
  if(filter==null) filter = activeFilter;
  var selectedHead = document.getElementById("head_"+mode);
  selectedHead.classList.add("active");
  getSiblings(selectedHead, "th.active").forEach(element => element.classList.remove('active'));
  var todaysData = filter.dataPerDay[filter.dataPerDay.length-1].data;
  //var sortedActual = Array.from(actualData).sort(function(a, b){return b.ncumul_conf-a.ncumul_conf});

  // var timeNow = new Date();
  // timeNow.setMinutes(timeNow.getMinutes()-timeNow.getTimezoneOffset()); //correct offset to UTC
  // timeNow.setHours(timeNow.getHours()-7); //show old date till 7am
  for(var j=0; j<todaysData.length; j++) {
    var today = todaysData[j];
    var perCantonToday = today.ncumul_conf;
    var dateSplit = today.date_ncumul_conf.split("-");
    var day = parseInt(dateSplit[2]);
    var month = parseInt(dateSplit[1])-1;
    var year = parseInt(dateSplit[0]);
    var d = new Date(Date.UTC(year,month,day))
    d.setDate(d.getDate() - 13);
    dateString = d.toISOString();
    dateString = dateString.substring(0,10);
    var perCanton14DaysAgo = filter.dataPerDay.filter(d => d.date == dateString)[0].data[j].ncumul_conf;
    today.cases14DaysDiff = perCantonToday - perCanton14DaysAgo;
    today.incidence = Math.round(today.cases14DaysDiff / population[cantons[j]] * 100000);
    //console.log("Canton: "+cantons[j]+" Two weeks: "+today.cases14DaysDiff+" incidence: "+today.incidence);
  }
  var sortedActual = Array.from(todaysData).sort(function(a, b){return b[mode]-a[mode]});
  var firstTable = document.getElementById("confirmed_1");
  firstTable.innerHTML = "";
  var secondTable = document.getElementById("confirmed_2");
  secondTable.innerHTML = "";
  var diffTotal = 0;
  var cases14DaysTotal = 0;
  for(var i=0; i<sortedActual.length; i++) {
    var table;
    if(i<sortedActual.length/2) table = firstTable;
    else table = secondTable;
    var actual = sortedActual[i];
    var now = actual.ncumul_conf;
    var tr = document.createElement("tr");
    var td = document.createElement("td");
    var a = document.createElement("a");
    a.className = "flag "+actual.canton;
    a.href = "#detail_"+actual.canton;
    a.appendChild(document.createTextNode(actual.canton));
    td.appendChild(a);
    tr.appendChild(td);
    td = document.createElement("td");
    td.appendChild(document.createTextNode(actual.date_ncumul_conf.replace("2020-", "")));
    tr.appendChild(td);
    td = document.createElement("td");
    var text = document.createTextNode(now);
    td.appendChild(text);
    tr.appendChild(td);
    td = document.createElement("td");
    td.appendChild(document.createTextNode(actual.diff_ncumul_conf!=null?actual.diff_ncumul_conf:""));
    tr.appendChild(td);
    var risk = "low";
    if(actual.incidence>=60) risk = "medium";
    if(actual.incidence>=120) risk = "high";
    cases14DaysTotal += actual.cases14DaysDiff
    td = document.createElement("td");
    td.innerHTML = actual.cases14DaysDiff;
    tr.appendChild(td);
    td = document.createElement("td");
    td.innerHTML = "<span class=\"newrisk "+risk+"\">"+actual.incidence+"</span>";
    tr.appendChild(td);

    /*
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
    */
    table.appendChild(tr);
  }
  var tr = document.createElement("tr");
  var formattedTotal = filter.dataPerDay[filter.dataPerDay.length-1].total_ncumul_conf.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "’");
  var formatted14DayCases = cases14DaysTotal.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "’");
  var formattedDiff = filter.dataPerDay[filter.dataPerDay.length-1].diffTotal_ncumul_conf.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "’");
  var incidenceCH = Math.round(cases14DaysTotal / population["CH"] * 100000);
  var riskCH = "low";
  if(incidenceCH>=60) riskCH = "medium";
  if(incidenceCH>=120) riskCH = "high";
  tr.innerHTML = "<td><a class='flag CH' href='#detail_CH'><b>CH</b></a></td><td><b>TOTAL</b></td><td><b>"+formattedTotal+"</b></td><td><b>"+formattedDiff+"</b></td><td><b>"+formatted14DayCases+"</b></td><td><span class=\"newrisk "+riskCH+"\">"+incidenceCH+"</span></td>";
  secondTable.append(tr);
  //document.getElementById("last").append(firstTable);
  //document.getElementById("last").append(secondTable);
  //document.getElementById("last").append(document.createTextNode("Total CH gemäss Summe Kantone: "+total));
}

var totalDeaths;
function processActualDeaths(filter) {
  var sortedActual = Array.from(filter.dataPerDay[filter.dataPerDay.length-1].data).sort(function(a, b){return b.ncumul_deceased-a.ncumul_deceased});
  var firstTable = document.getElementById("death_1");
  var secondTable = document.getElementById("death_2");
  for(var i=0; i<sortedActual.length; i++) {
    var table;
    if(i<sortedActual.length/2) table = firstTable;
    else table = secondTable;
    var actual = sortedActual[i];
    var now = actual.ncumul_deceased;
    var tr = document.createElement("tr");
    var td = document.createElement("td");
    var a = document.createElement("a");
    a.className = "flag "+actual.canton;
    a.href = "#detail_"+actual.canton;
    a.appendChild(document.createTextNode(actual.canton));
    td.appendChild(a);
    tr.appendChild(td);
    td = document.createElement("td");
    td.appendChild(document.createTextNode(actual.date_ncumul_deceased));
    tr.appendChild(td);
    td = document.createElement("td");
    var text = document.createTextNode(now);
    td.appendChild(text);
    tr.appendChild(td);
    td = document.createElement("td");
    var change = document.createTextNode(actual.diff_ncumul_deceased!=null?actual.diff_ncumul_deceased:"");
    td.appendChild(change);
    tr.appendChild(td);
    table.appendChild(tr);
  }
  var tr = document.createElement("tr");
  tr.innerHTML = "<td><a class='flag CH' href='#detail_CH'><b>CH</b></a></td><td><b>TOTAL</b></td><td><b>"+filter.dataPerDay[filter.dataPerDay.length-1].total_ncumul_deceased+"</b></td><td><b>"+filter.dataPerDay[filter.dataPerDay.length-1].diffTotal_ncumul_deceased+"</b></td>";
  secondTable.append(tr);
  totalDeaths = filter.dataPerDay[filter.dataPerDay.length-1].total_ncumul_deceased;
  //document.getElementById("last").append(document.createTextNode("Total CH gemäss Summe Kantone: "+total));
}

function getBAGIsolation() {
  d3.csv("https://raw.githubusercontent.com/rsalzer/COVID_19_BAG/master/data/current_isolated.csv", function(error, csvdata) {
      if(csvdata!=null) {
        for(var i=0; i<csvdata.length; i++) {
          var row = csvdata[i];
          var canton = row.abbreviation_canton_and_fl;
          if(actualIsolation.filter(function(d) { if(d.abbreviation_canton_and_fl==canton) return d}).length==0) {
            row.source = "BAG";
            actualIsolation.push(row);
          }
        }
        processActualIsolation();
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

function processActualHospitalisation(filter) {
  var today = filter.dataPerDay[filter.dataPerDay.length-1];
  var sortedActual = Array.from(today.data).sort(function(a, b){return b.current_hosp-a.current_hosp});
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
    if(actual.date_current_hosp.charAt(0)!='2') continue;
    var now = actual.current_hosp;
    if(actual.canton!="FL" && now!=null) total+=parseInt(now);
    if(actual.canton!="FL" && actual.current_icu!=null) totalicu+=parseInt(actual.current_icu);
    if(actual.canton!="FL" && actual.current_vent!=null) totalvent+=parseInt(actual.current_vent);

    var tr = document.createElement("tr");
    var td = document.createElement("td");
    var a = document.createElement("a");
    a.className = "flag "+actual.canton;
    a.href = "#detail_"+actual.canton;
    a.appendChild(document.createTextNode(actual.canton));
    td.appendChild(a);
    tr.appendChild(td);
    td = document.createElement("td");
    td.appendChild(document.createTextNode(getDeviceState()==2?actual.date_current_hosp.replace("2020-", ""):actual.date_current_hosp));
    tr.appendChild(td);
    td = document.createElement("td");
    var text = document.createTextNode(now);
    td.appendChild(text);
    tr.appendChild(td);

    var hospDiff = actual.diff_current_hosp!=null?parseInt(actual.diff_current_hosp)>0?"(+"+actual.diff_current_hosp+")":"("+actual.diff_current_hosp+")":"";
    td = document.createElement("td");
    text = document.createTextNode(hospDiff);
    td.appendChild(text);
    tr.appendChild(td);

    td = document.createElement("td");
    text = document.createTextNode(actual.current_icu!=null?actual.current_icu:"");
    td.appendChild(text);
    tr.appendChild(td);

    var icuDiff = actual.diff_current_icu!=null?parseInt(actual.diff_current_icu)>0?"(+"+actual.diff_current_icu+")":"("+actual.diff_current_icu+")":"";
    td = document.createElement("td");
    text = document.createTextNode(icuDiff);
    td.appendChild(text);
    tr.appendChild(td);

    td = document.createElement("td");
    text = document.createTextNode(actual.current_vent!=null?actual.current_vent:"");
    td.appendChild(text);
    tr.appendChild(td);

    var ventDiff = actual.diff_current_vent!=null?parseInt(actual.diff_current_vent)>0?"(+"+actual.diff_current_vent+")":"("+actual.diff_current_vent+")":"";
    td = document.createElement("td");
    text = document.createTextNode(ventDiff);
    td.appendChild(text);
    tr.appendChild(td);
    // td = document.createElement("td");
    // if(actual.source && actual.source.substring(0,2)=="ht") {
    //   a = document.createElement("a");
    //   a.innerHTML = "&#x2197;&#xFE0E;";
    //   a.href = actual.source;
    //   td.appendChild(a);
    // }
    // else {
    //   a = document.createElement("a");
    //   a.innerHTML = "&#x2197;&#xFE0E;";
    //   a.href = "https://github.com/openZH/covid_19/blob/master/fallzahlen_kanton_total_csv/COVID19_Fallzahlen_Kanton_"+actual.abbreviation_canton_and_fl+"_total.csv";
    //   td.appendChild(a);
    // }
    // tr.appendChild(td);
    secondTable.appendChild(tr);
  }
  var tr = document.createElement("tr");
  var totalDiffHosp = today.diffTotal_current_hosp>0?"(+"+today.diffTotal_current_hosp+")":"("+today.diffTotal_current_hosp+")";
  var totalDiffIcu = today.diffTotal_current_icu>0?"(+"+today.diffTotal_current_icu+")":"("+today.diffTotal_current_icu+")";
  var totalDiffVent = today.diffTotal_current_vent>0?"(+"+today.diffTotal_current_vent+")":"("+today.diffTotal_current_vent+")";
  tr.innerHTML = "<td><a class='flag CH' href='#detail_CH'><b>CH</b></a></span></td><td><b>TOTAL</b></td><td><b>"+total+"</b></td><td><b>"+totalDiffHosp+"</b></td><td><b>"+totalicu+"</b></td><td><b>"+totalDiffIcu+"</b></td><td><b>"+totalvent+"</b></td><td><b>"+totalDiffVent+"</b></td>"; //"<td></td>";
  secondTable.append(tr);

  //document.getElementById("last").append(secondTable);
  //document.getElementById("last").append(document.createTextNode("Total CH gemäss Summe Kantone: "+total+ " / "+totalicu+" / "+totalvent));

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

Chart.Tooltip.positioners.custombar = function(elements, eventPosition) { //<-- custom is now the new option for the tooltip position
    /** @type {Chart.Tooltip} */
    var tooltip = this;

    /* ... */

    var half = eventPosition.x - 150;
    if(half< 100) half = eventPosition.x + 150;
    return {
        x: half,
        y: 30
    };
}

var mainData;
function prepareData() {
  //console.log("Start Processing Data");
  var mode = 0;
  var date = new Date();
  date.setTime(getDateForMode(mode).getTime());
  date.setDate(date.getDate()); //3.6. is better as start...
  var now = new Date();
  now.setMinutes(now.getMinutes()-now.getTimezoneOffset());
  //alert(now.toISOString());
  var dataPerDay = [];
  var emptyFirst = {};
  emptyFirst.data = [];
  for(var j=0; j<cantons.length; j++) {
    var canton = cantons[j];
    var cantonTotal = {
      canton: canton,
      date_ncumul_conf: _("Keine Daten"),
      date_ncumul_deceased: _("Keine Daten"),
      date_current_hosp: _("Keine Daten"),
      ncumul_conf: 0,
      ncumul_deceased: 0,
      current_hosp: 0,
      current_icu: 0,
      current_vent: 0
    };
    emptyFirst.data.push(cantonTotal);
  }
  dataPerDay.push(emptyFirst);
  var completeIndex = 0;
  // console.log("Start preping CH cases");
  while(date<now) {
    var dateString = date.toISOString();
    dateString = dateString.substring(0,10);
    // if(dateString=="2020-06-02") {
    //   console.log("2020-06-02: Index: "+dataPerDay.length);
    // }
    var singleDayObject = {};
    singleDayObject.date = dateString;
    singleDayObject.data = [];
    for(var i=0; i<cantons.length; i++) {
      var canton = cantons[i];
      var cantonTotal = getDataForDay(canton, date);
      if(cantonTotal==null) {
        cantonTotal = Object.assign({}, dataPerDay[dataPerDay.length-1].data[i]);
        cantonTotal.diff_ncumul_deceased = null;
        cantonTotal.diff_ncumul_conf = null;
        cantonTotal.diff_current_hosp = null;
        cantonTotal.diff_current_vent = null;
        cantonTotal.diff_current_icu = null;
        cantonTotal.diffAvg7Days = null;
        cantonTotal.incidences14Days = null;
      }
      else {
          if(Number.isNaN(cantonTotal.ncumul_conf)) {
            cantonTotal.ncumul_conf = dataPerDay[dataPerDay.length-1].data[i].ncumul_conf;
            cantonTotal.date_ncumul_conf = dataPerDay[dataPerDay.length-1].data[i].date_ncumul_conf;
            cantonTotal.diff_ncumul_conf = null;
            cantonTotal.diffAvg7Days = null;
            cantonTotal.incidences14Days = null;
            //console.log("Old ncumul conf for: "+canton+" date: "+dateString);
          }
          else {
            cantonTotal.diff_ncumul_conf = cantonTotal.ncumul_conf - dataPerDay[dataPerDay.length-1].data[i].ncumul_conf;
            if(dataPerDay.length>9) {
              var diff7Days = cantonTotal.ncumul_conf - dataPerDay[dataPerDay.length-7].data[i].ncumul_conf;
              cantonTotal.diffAvg7Days = Math.round(diff7Days / 7);
              if(dataPerDay.length>15) {
                var diff14Days = cantonTotal.ncumul_conf - dataPerDay[dataPerDay.length-14].data[i].ncumul_conf;
                cantonTotal.incidences14Days = Math.round(diff14Days / population[canton] * 100000);
              }
            }
          }
          if(Number.isNaN(cantonTotal.ncumul_deceased)) {
            cantonTotal.ncumul_deceased = dataPerDay[dataPerDay.length-1].data[i].ncumul_deceased;
            cantonTotal.date_ncumul_deceased = dataPerDay[dataPerDay.length-1].data[i].date_ncumul_deceased;
            cantonTotal.diff_ncumul_deceased = null;
            //console.log("Old ncumul death for: "+canton+" date: "+dateString);
          }
          else {
            cantonTotal.diff_ncumul_deceased = cantonTotal.ncumul_deceased - dataPerDay[dataPerDay.length-1].data[i].ncumul_deceased;
          }

          if(Number.isNaN(cantonTotal.current_hosp)) {
            cantonTotal.current_hosp = dataPerDay[dataPerDay.length-1].data[i].current_hosp;
            cantonTotal.current_vent = dataPerDay[dataPerDay.length-1].data[i].current_vent;
            cantonTotal.current_icu = dataPerDay[dataPerDay.length-1].data[i].current_icu;
            cantonTotal.date_current_hosp = dataPerDay[dataPerDay.length-1].data[i].date_current_hosp;
            cantonTotal.diff_current_hosp = null;
            cantonTotal.diff_current_vent = null;
            cantonTotal.diff_current_icu = null;
            //console.log("Old ncumul death for: "+canton+" date: "+dateString);
          }
          else {
            cantonTotal.diff_current_hosp = cantonTotal.current_hosp - dataPerDay[dataPerDay.length-1].data[i].current_hosp;
            if(cantonTotal.current_vent!=null) cantonTotal.diff_current_vent = cantonTotal.current_vent - dataPerDay[dataPerDay.length-1].data[i].current_vent;
            else cantonTotal.diff_current_vent = null;
            if(cantonTotal.current_icu!=null) cantonTotal.diff_current_icu = cantonTotal.current_icu - dataPerDay[dataPerDay.length-1].data[i].current_icu;
            else cantonTotal.diff_current_icu = null;
          }
      }
      singleDayObject.data.push(cantonTotal);
    }
    singleDayObject.total_ncumul_conf = singleDayObject.data.reduce(function(acc, val) { return val.canton!="FL"? acc + val.ncumul_conf : acc; }, 0);
    singleDayObject.total_ncumul_deceased = singleDayObject.data.reduce(function(acc, val) { return val.canton!="FL" ? acc + val.ncumul_deceased : acc; }, 0);
    singleDayObject.total_current_hosp = singleDayObject.data.reduce(function(acc, val) { return val.canton!="FL"? acc + val.current_hosp: acc; }, 0);
    singleDayObject.total_current_icu = singleDayObject.data.reduce(function(acc, val) { return val.canton!="FL"? acc + val.current_icu: acc; }, 0);
    singleDayObject.total_current_vent = singleDayObject.data.reduce(function(acc, val) { return val.canton!="FL"? acc + val.current_vent: acc; }, 0);
    singleDayObject.diffTotal_ncumul_conf = singleDayObject.data.reduce(function(acc, val) { return val.canton!="FL" ? acc + val.diff_ncumul_conf: acc; }, 0);
    singleDayObject.diffTotal_ncumul_deceased = singleDayObject.data.reduce(function(acc, val) { return val.canton!="FL" ? acc + val.diff_ncumul_deceased: acc; }, 0);
    singleDayObject.diffTotal_current_hosp = singleDayObject.data.reduce(function(acc, val) { return val.canton!="FL" ? acc + val.diff_current_hosp: acc; }, 0);
    singleDayObject.diffTotal_current_icu = singleDayObject.data.reduce(function(acc, val) { return val.canton!="FL" ? acc + val.diff_current_icu: acc; }, 0);
    singleDayObject.diffTotal_current_vent = singleDayObject.data.reduce(function(acc, val) { return val.canton!="FL" ? acc + val.diff_current_vent: acc; }, 0);
    var isComplete = singleDayObject.data.reduce(
      function(acc, val) {
        return acc+(val.date_ncumul_conf==singleDayObject.date?1:0);
      }, 0);
    if(isComplete>=singleDayObject.data.length-1) completeIndex = dataPerDay.length;
    singleDayObject.diffAvg7Days = null;
    if(dataPerDay.length>9) {
      var diff7Days = singleDayObject.total_ncumul_conf - dataPerDay[dataPerDay.length-7].total_ncumul_conf;
      singleDayObject.diffAvg7Days = Math.round(diff7Days / 7);
      var diffDeath7Days = singleDayObject.total_ncumul_deceased - dataPerDay[dataPerDay.length-7].total_ncumul_deceased;
      singleDayObject.diffDeathAvg7Days = Math.round(diffDeath7Days * 10 / 7) / 10;
    }
    dataPerDay.push(singleDayObject);
    date = new Date(Date.UTC(date.getFullYear(),date.getMonth(),date.getDate()+1));
  }
  dataPerDay.splice(0,1);
  mainData = {};
  mainData.days = dataPerDay;
  mainData.completeIndex = dataPerDay.length - completeIndex;
  total = mainData.days[mainData.days.length-1].total_ncumul_conf;
  //console.log("CompleteIndex: " + mainData.completeIndex);
  //console.log("Finished processing data");
}

var activeFilter;
function filterAllCH(mode) {
  var dataPerDay;
  switch (mode) {
    case 0:
      dataPerDay = mainData.days.slice(0);
      break;
    case 1:
      dataPerDay = mainData.days.slice(99);
      break;
    case 2:
      dataPerDay = mainData.days.slice(mainData.days.length-30);
      break;
  }
  var dateLabels = dataPerDay.map(function(d) {
    var dateSplit = d.date.split("-");
    var day = parseInt(dateSplit[2]);
    var month = parseInt(dateSplit[1])-1;
    var year = parseInt(dateSplit[0]);
    var date = new Date(year,month,day);
    return date;
  });
  //console.log("Finished filtering");
  //console.log(dataPerDay);
  activeFilter = {
    "dataPerDay": dataPerDay,
    "dateLabels": dateLabels
  };
  return activeFilter;
}

function addFilterLengthButtonsCH(div, chart, chartDeaths, chartHosp) {
  var place = "CH";
  if(getDeviceState()==2) addFilterLengthButtonCH(div, place, _('Letzte 30 Tage'), 2, getDeviceState()==2, chart, chartDeaths, chartHosp);
  addFilterLengthButtonCH(div, place, _('Ab Juni'), 1, getDeviceState()!=2, chart, chartDeaths, chartHosp);
  addFilterLengthButtonCH(div, place, _('Ab März'), 0, false, chart, chartDeaths, chartHosp);
}

function addFilterLengthButtonCH(container, place, name, mode, isActive, chart, chartDeaths, chartHosp) {
  var button = document.createElement('button');
  button.className = "chartButton";
  if (isActive) button.classList.add('active');
  button.innerHTML = name;
  button.addEventListener('click', function() {
    this.classList.add('active');
    getSiblings(this, '.chartButton.active').forEach(element => element.classList.remove('active'));
    var filter = filterAllCH(mode);
    var diff = filter.dataPerDay.map(function(d) {return d.diffTotal_ncumul_conf});
    var avgs = filter.dataPerDay.map(d => d.diffAvg7Days);
    var completeIndex = mainData.completeIndex;
    avgs.splice(avgs.length-completeIndex, completeIndex);
    var backgroundColors = filter.dataPerDay.map(function (d, index) { return (index<=diff.length-completeIndex-1)?"#F15F36":"#999999aa";});
    chart.data.labels = filter.dateLabels;
    chart.data.datasets[0].data = avgs;
    chart.data.datasets[1].data = diff;
    chart.data.datasets[1].backgroundColor = backgroundColors;
    chart.options.scales.xAxes[0].ticks.min = getDateForMode(mode);
    chart.options.tooltips.callbacks = getCHCallbacks(filter, "ncumul_conf");
    chart.options.plugins.datalabels = (mode==0 || (getDeviceState()==2 && mode!=2)) ? false : { display: false, color: inDarkMode() ? '#ccc' : 'black', font: { weight: 'bold'} };
    chart.update(0);

    var deathDiff = filter.dataPerDay.map(function(d) {return d.diffTotal_ncumul_deceased});
    chartDeaths.data.labels = filter.dateLabels;
    var avgDeaths = filter.dataPerDay.map(d => d.diffDeathAvg7Days);
    var completeIndex = mainData.completeIndex;
    avgDeaths.splice(avgDeaths.length-completeIndex, completeIndex);
    chartDeaths.data.datasets[0].data = avgDeaths;
    chartDeaths.data.datasets[1].data = deathDiff;
    chartDeaths.options.scales.xAxes[0].ticks.min = getDateForMode(mode);
    chartDeaths.options.tooltips.callbacks = getCHCallbacks(filter, "ncumul_deceased");
    chartDeaths.options.plugins.datalabels = (mode==0 || (getDeviceState()==2 && mode!=2)) ? false : { display: false, color: inDarkMode() ? '#ccc' : 'black', font: { weight: 'bold'} };
    chartDeaths.update(0);

    var totalHosp = filter.dataPerDay.map(function(d) {return d["total_"+hospitalisationMode]});
    chartHosp.data.labels = filter.dateLabels;
    chartHosp.data.datasets[0].data = totalHosp;
    chartHosp.options.scales.xAxes[0].ticks.min = getDateForMode(mode);
    chartHosp.options.tooltips.callbacks = getCHCallbacks(filter, hospitalisationMode);
    chartHosp.options.plugins.datalabels = (mode==0 || (getDeviceState()==2 && mode!=2)) ? false : getDataLabels();
    chartHosp.update(0);

    // chartHosp.data.labels = filter.dateLabels;
    // chartHosp.data.datasets = filter.datasets;
    // chartHosp.options.scales.xAxes[0].ticks.min = getDateForMode(mode);
    // chartHosp.update(0);
  });
  container.append(button);
}

function getCHCallbacks(filter, variable) {
  return {
    title: function(tooltipItems, data) {
      var str = tooltipItems[0].label;
      str = str.replace("Mon", _("Montag"));
      str = str.replace("Tue", _("Dienstag"));
      str = str.replace("Wed", _("Mittwoch"));
      str = str.replace("Thu", _("Donnerstag"));
      str = str.replace("Fri", _("Freitag"));
      str = str.replace("Sat", _("Samstag"));
      str = str.replace("Sun", _("Sonntag"));
      return str;
    },
    label: function(tooltipItems, data) {
      var value = tooltipItems.value;
      if(data.datasets.length>1 && tooltipItems.datasetIndex==0) return "            7d-Avg: +"+value;
      var index = tooltipItems.index;
      var totalPerDay = filter.dataPerDay[index]["total_"+variable];
      var changeStr = "";
      var tabbing = 6-(""+totalPerDay).length;
      var padding = " ".repeat(tabbing);
      var diffString = filter.dataPerDay[index]["diffTotal_"+variable];
      if(filter.dataPerDay[index]["diffTotal_"+variable]>=0) diffString = "+"+diffString;
      return padding+totalPerDay+"        Diff: "+diffString;
    },
    afterBody: function(tooltipItems, data) {
      //console.log(tooltipItems);
      //console.log(data);
      if(data.datasets.length>1 && tooltipItems.datasetIndex==0) return "";
      multistringText = [""];
      var index = tooltipItems[0].index;
      var dataForThisDay = filter.dataPerDay[index];
      var sorted = Array.from(dataForThisDay.data).sort(function(a, b){ if(a[variable]==b[variable]) return b.canton<a.canton;  return b[variable]-a[variable]});
      var emptyCantons = [];
      sorted.forEach(function(item) {
        if(item.canton!="FL") {
          var singleItem = item[variable];
          var date = item["date_"+variable];
          if(variable.startsWith("current_")) date = item["date_current_hosp"];
          if(singleItem==null) {
            emptyCantons.push(item.canton);
            return;
          }
          var tabbing = 5-(""+singleItem).length;
          var padding = " ".repeat(tabbing);
          var diffStr = item["diff_"+variable]!=null?(item["diff_"+variable]>=0?"+"+item["diff_"+variable]:item["diff_"+variable]):""
          multistringText.push(item.canton+":"+padding+singleItem+" ("+date+") "+diffStr);
        }
      });
      emptyCantons.forEach(function(item) {
        var date = _("Keine Daten");
        var singleItem = 0;
        var tabbing = 5-(""+singleItem).length;
        var padding = " ".repeat(tabbing);
        var diffStr = item["diff_"+variable]!=null?(item["diff_"+variable]>=0?"+"+item["diff_"+variable]:item["diff_"+variable]):""
        multistringText.push(item+":"+padding+singleItem+" ("+date+") "+diffStr);
      });

      return multistringText;
    }
  };
}

function barChartAllCH(filter) {
  // console.log("End preping CH cases");
  //console.log(dataPerDay);
  var diff = filter.dataPerDay.map(function(d) {return d.diffTotal_ncumul_conf});
  var avgs = filter.dataPerDay.map(d => d.diffAvg7Days);
  var completeIndex = mainData.completeIndex;
  avgs.splice(avgs.length-completeIndex, completeIndex);
  var backgroundColors = filter.dataPerDay.map(function (d, index) { return (index<=diff.length-completeIndex-1)?"#F15F36":"#999999aa";});
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
  var chart = new Chart(canvas.id, {
    type: 'bar',
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
        mode: 'index',
        intersect: false,
        position : 'custombar',
        caretSize: 0,
        bodyFontFamily: 'IBM Plex Mono',
        callbacks: getCHCallbacks(filter, "ncumul_conf")
      },
      scales: getScales((getDeviceState()==2) ? 2 : 1),
      plugins: {
        datalabels: {
          display: false,
          color: inDarkMode() ? '#ccc' : 'black',
          font: {
            weight: 'bold'
          }
        }
      }
  },
  data: {
    labels: filter.dateLabels,
    datasets: [
      {
        label: '7d-Avg',
        data: avgs,
        backgroundColor: inDarkMode() ? '#FFFFFF80' : '#77777780',
        borderColor: inDarkMode() ? '#FFFFFF80' : '#77777780',
        pointRadius: 0,
        fill: false,
        type: 'line'
      },
      {
        data: diff,
        fill: false,
        cubicInterpolationMode: 'monotone',
        spanGaps: true,
        borderColor: '#F15F36',
        backgroundColor: backgroundColors,
        datalabels: {
          display: true,
          align: 'top',
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

  var chartHosp = barChartAllCHHospitalisations(filter);
  var chartDeaths = barChartAllCHDeaths(filter);
  var div = addAxisButtons(canvas, chart, chartDeaths, chartHosp);
  addFilterLengthButtonsCH(div, chart, chartDeaths, chartHosp);
}

function barChartAllCHDeaths(filter) {
  var diff = filter.dataPerDay.map(d => d.diffTotal_ncumul_deceased);
  var avgs = filter.dataPerDay.map(d => d.diffDeathAvg7Days);
  var completeIndex = mainData.completeIndex;
  avgs.splice(avgs.length-completeIndex, completeIndex);
  //console.log(dataPerDay);
  var place = "CH";
  var section = document.getElementById("detail");
  var div = document.getElementById("container_CH");
  var canvas = document.createElement("canvas");
  canvas.id = place+"_deaths";
  canvas.height=470;
  div.appendChild(canvas);

  var chart = new Chart(canvas.id, {
    type: 'bar',
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
        text: _('Verstorbene')
      },
      tooltips: {
        mode: 'index',
        intersect: false,
        position : 'custombar',
        caretSize: 0,
        bodyFontFamily: 'IBM Plex Mono',
        callbacks: getCHCallbacks(filter, "ncumul_deceased")
      },
      scales: getScales((getDeviceState()==2) ? 2 : 1),
      plugins: {
        datalabels: {
          display: false,
          color: inDarkMode() ? '#ccc' : 'black',
          font: {
            weight: 'bold'
          }
        }
      }
  },
  data: {
    labels: filter.dateLabels,
    datasets: [
      {
        label: '7d-Avg',
        data: avgs,
        backgroundColor: inDarkMode() ? '#FFFFFF80' : '#77777780',
        borderColor: inDarkMode() ? '#FFFFFF80' : '#77777780',
        pointRadius: 0,
        fill: false,
        type: 'line'
      },
      {
        data: diff,
        fill: false,
        cubicInterpolationMode: 'monotone',
        spanGaps: true,
        borderColor: inDarkMode() ? 'rgba(150, 150, 150, 1)' : '#010101',
        backgroundColor: inDarkMode() ? 'rgba(150, 150, 150, 1)' : '#010101',
        datalabels: {
          display: true,
          align: 'top',
          anchor: 'end'
        }
      }
    ]
  }
});

  return chart;
}

function barChartAllCHHospitalisations(filter) {
  var cases = filter.dataPerDay.map(function(d) {return d.total_current_hosp});
  var place = "CH";
  var section = document.getElementById("detail");
  var div = document.getElementById("container_CH");
  var buttonsDiv = document.createElement('div');
  buttonsDiv.className = "chartButtons";
  div.appendChild(buttonsDiv);
  var canvas = document.createElement("canvas");
  canvas.id = place+"_hosp";
  canvas.height=470;
  div.appendChild(canvas);

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
        text: _('Hospitalisierte Fälle')
      },
      tooltips: {
        mode: 'nearest',
        intersect: false,
        position : 'custombar',
        caretSize: 0,
        bodyFontFamily: 'IBM Plex Mono',
        callbacks: getCHCallbacks(filter, "current_hosp")
      },
      scales: getScales((getDeviceState()==2) ? 2 : 1),
      plugins: {
        datalabels: getDataLabels()
      }
    },
    data: {
      labels: filter.dateLabels,
      datasets: [
        {
          data: cases,
          fill: false,
          cubicInterpolationMode: 'monotone',
          spanGaps: true,
          borderColor: '#CCCC00',
          backgroundColor: '#CCCC00',
          datalabels: {
            align: 'end',
            anchor: 'end'
          }
        }
      ]
    }
  });

  addHospitalisationButtons(buttonsDiv, chart);
  return chart;
}

var hospitalisationMode = "current_hosp";
function addHospitalisationButtons(div, chart) {
  addHospitalisationButton(div, _('Hospitalisiert'), "current_hosp", true, chart, '#CCCC00');
  addHospitalisationButton(div, _('In Intensivbehandlung'), "current_icu", false, chart, '#CF5F5F');
  addHospitalisationButton(div, _('Künstlich beatmet'), "current_vent", false, chart, '#115F5F');
}

function addHospitalisationButton(container, name, mode, isActive, chartHosp, color) {
  var button = document.createElement('button');
  button.className = "chartButton";
  if (isActive) button.classList.add('active');
  button.innerHTML = name;
  button.addEventListener('click', function() {
    hospitalisationMode = mode;
    this.classList.add('active');
    getSiblings(this, '.chartButton.active').forEach(element => element.classList.remove('active'));
    var totalHosp = activeFilter.dataPerDay.map(function(d) {return d["total_"+mode]});
    chartHosp.data.labels = activeFilter.dateLabels;
    chartHosp.data.datasets[0].data = totalHosp;
    chartHosp.data.datasets[0].borderColor = color;
    chartHosp.data.datasets[0].backgroundColor = color;
    chartHosp.options.tooltips.callbacks = getCHCallbacks(activeFilter, mode);
    chartHosp.update(0);
  });
  container.append(button);
}


function getDataForDay(canton, date) {
  var dateString = date.toISOString();
  dateString = dateString.substring(0,10);
  var filteredData = data.filter(function(d) { if(d.abbreviation_canton_and_fl==canton && d.date==dateString) return d});
  if(filteredData.length>0) {
    if(filteredData.length>1) console.log("More then 1 line for "+canton+" date: "+dateString);
    var obj = {
      canton: canton,
      ncumul_conf: parseInt(filteredData[filteredData.length-1].ncumul_conf),
      ncumul_deceased: parseInt(filteredData[filteredData.length-1].ncumul_deceased),
      current_hosp: parseInt(filteredData[filteredData.length-1].current_hosp),
      current_icu: filteredData[filteredData.length-1].current_icu!=""?parseInt(filteredData[filteredData.length-1].current_icu):null,
      current_vent: filteredData[filteredData.length-1].current_vent!=""?parseInt(filteredData[filteredData.length-1].current_vent):null,
      date_ncumul_conf: dateString,
      date_ncumul_deceased: dateString,
      date_current_hosp: dateString
    };
    return obj;
  }
  return null;
}

function getNumConf(canton, date, variable) {
  var dateString = date.toISOString();
  dateString = dateString.substring(0,10);
  var filteredData = data.filter(function(d) { if(d.abbreviation_canton_and_fl==canton && d.date==dateString && d[variable]!="") return d});
  if(filteredData.length>0) {
    if(filteredData.length>1) console.log("More then 1 line for "+canton+" date: "+dateString);
    var obj = {
      canton: canton,
      date: dateString,
    };
    obj[variable] = parseInt(filteredData[filteredData.length-1][variable]);
    return obj;
  }
  return null;
}

var dateNOW = new Date();
dateNOW.setDate(dateNOW.getDate()-30);
function getDateForMode(mode) {
  switch(mode) {
    case 0:
      //return new Date("2020-02-24T23:00:00");
      return new Date(Date.UTC(2020,1,25))
    case 1:
      //return new Date("2020-05-31T23:00:00");
      return new Date(Date.UTC(2020,5,2))
    case 2:
      return dateNOW;
  }
}


function filterCases(placenr, mode) {
  var place = cantons[placenr];
  //var filteredData = data.filter(function(d) { if(d.abbreviation_canton_and_fl==place) return d});
  var filteredData = mainData.days.map(function(d) { var canton = d.data[placenr]; canton.date = d.date; return canton;});
  //console.log(testData);
  if(!filteredData || filteredData.length<2) return;
  var moreFilteredData = filteredData.filter(function(d) { if(d.ncumul_conf!=null) return d});
  if(mode!=0) {
    var referenceDate = getDateForMode(mode);
    moreFilteredData = moreFilteredData.filter(function(d) {
      var dateSplit = d.date.split("-");
      var day = parseInt(dateSplit[2])+1; //So we dont get 0 for first diff
      var month = parseInt(dateSplit[1])-1;
      var year = parseInt(dateSplit[0]);
      var date = new Date(year,month,day);
      if(date>referenceDate) return true;
    });
  }
  var dateLabels = moreFilteredData.map(function(d) {
    var dateSplit = d.date.split("-");
    var day = parseInt(dateSplit[2]);
    var month = parseInt(dateSplit[1])-1;
    var year = parseInt(dateSplit[0]);
    var date = new Date(year,month,day);
    return date;
  });
  var cases = moreFilteredData.map(d => d.ncumul_conf);
  var diff = moreFilteredData.map(d => d.diff_ncumul_conf);
  var avgs = moreFilteredData.map(d => d.diffAvg7Days);
  var incidences = moreFilteredData.map(d => d.incidences14Days);

  //Hospitalisations:
  var datasets = [];
  var casesHosp = moreFilteredData.map(function(d) {if(d.diff_current_hosp==null) return null; return d.current_hosp});
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
  var filteredForICU = moreFilteredData.filter(function(d) { if(d.diff_current_icu!=null) return d});
  if(filteredForICU.length>0) {
    var casesICU = moreFilteredData.map(function(d) {if(d.diff_current_icu==null) return null; return d.current_icu});
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
  var filteredForVent = moreFilteredData.filter(function(d) { if(d.diff_current_vent!=null) return d});
  if(filteredForVent.length>0) {
    var casesVent = moreFilteredData.map(function(d) {if(d.diff_current_vent==null) return null; return d.current_vent});
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
  return {
    "cases": cases,
    "dateLabels": dateLabels,
    "diff": diff,
    "avgs": avgs,
    "incidences": incidences,
    "datasets": datasets
  }
}

function barChartCases(placenr) {
  var place = cantons[placenr];
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
  if(getDeviceState()==2) {
    canvas.height=200;
  }
  else {
    canvas.height=250;
  }
  div.appendChild(canvas);
  article.appendChild(div);
  section.appendChild(article);
  div.scrollLeft = 1700;
  var filter = filterCases(placenr, (getDeviceState()==2) ? 2 : 1);
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
        text: _('Bestätigte Fälle')
      },
      tooltips: {
        mode: 'index',
        intersect: false,
        bodyFontFamily: 'IBM Plex Mono',
        callbacks: getCallbacks(filter),
      },
      scales: getScales((getDeviceState()==2) ? 2 : 1),
      plugins: {
        datalabels: {
          display: false,
          color: inDarkMode() ? '#ccc' : 'black',
          font: {
            weight: 'bold'
          }
        }
      }
  },
  data: {
    labels: filter.dateLabels,
    datasets: [
      {
        label: '7d-Avg',
        data: filter.avgs,
        cubicInterpolationMode: 'monotone',
        spanGaps: true,
        pointRadius: 0,
        borderWidth: 2,
        backgroundColor: inDarkMode() ? '#FFFFFF80' : '#77777780',
        borderColor: inDarkMode() ? '#FFFFFF80' : '#77777780',
        fill: false,
        type: 'line'
      },
      {
        label: 'Diff. ',
        data: filter.diff,
        fill: false,
        cubicInterpolationMode: 'monotone',
        spanGaps: true,
        borderColor: '#F15F36',
        backgroundColor: '#F15F36',
        datalabels: {
          align: 'end',
          anchor: 'end',
          display: true
        }
      }
    ]
  }
});

  var canvas2 = document.createElement("canvas");
  canvas2.id = "hosp"+place;
  canvas2.height=250;
  div.appendChild(canvas2);
  var chartHosp = new Chart(canvas2.id, {
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
          title: function(tooltipItems, data) {
            var str = tooltipItems[0].label;
            str = str.replace("Mon", _("Montag"));
            str = str.replace("Tue", _("Dienstag"));
            str = str.replace("Wed", _("Mittwoch"));
            str = str.replace("Thu", _("Donnerstag"));
            str = str.replace("Fri", _("Freitag"));
            str = str.replace("Sat", _("Samstag"));
            str = str.replace("Sun", _(""));
            return str;
          },
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
            var tabbing = 4-value.length;
            var padding = " ".repeat(tabbing);
            return title+titlepadding+value+padding+changeStr;
          }
        }
      },
      scales: getScales((getDeviceState()==2) ? 2 : 1),
      plugins: {
        datalabels: false
      }
    },
    data: {
      labels: filter.dateLabels,
      datasets: filter.datasets
    }
  });
  addFilterLengthButtons(canvas, placenr, chart, chartHosp);
}

function getCallbacks(filter) {
  return {
    title: function(tooltipItems, data) {
      var str = tooltipItems[0].label;
      str = str.replace("Mon", _("Montag"));
      str = str.replace("Tue", _("Dienstag"));
      str = str.replace("Wed", _("Mittwoch"));
      str = str.replace("Thu", _("Donnerstag"));
      str = str.replace("Fri", _("Freitag"));
      str = str.replace("Sat", _("Samstag"));
      str = str.replace("Sun", _("Sonntag"));
      return str;
    },
    afterLabel: function(tooltipItems, data) {
      if(tooltipItems.datasetIndex==0) return "";
      var index = tooltipItems.index;
      var value = filter.cases[index];
      return "Total : "+value;
    }
  };
}

function getScales(mode) {
  return {
    xAxes: [{
      type: 'time',
      time: {
        tooltipFormat: 'ddd DD.MM.YYYY',
        unit: 'day',
        displayFormats: {
          day: 'DD.MM'
        }
      },
      ticks: {
        min: getDateForMode(mode),
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
        suggestedMax: 7,
      },
      gridLines: {
          color: inDarkMode() ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'
      }
    }]
  };
}

function getDataLabels() {
  return {
      color: inDarkMode() ? '#ccc' : 'black',
      font: {
        weight: 'bold',
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

function addFilterLengthButtons(elementAfter, placenr, chart, chartHosp) {
  var div = document.createElement('div');
  div.className = "chartButtons";
  addFilterLengthButton(div, placenr, _('Inz/100k'), -1, false, chart, chartHosp, true);
  if(getDeviceState()==2) addFilterLengthButton(div, placenr, _('Letzte 30 Tage'), 2, getDeviceState()==2, chart, chartHosp, false);
  addFilterLengthButton(div, placenr, _('Ab Juni'), 1, getDeviceState()!=2, chart, chartHosp, false);
  addFilterLengthButton(div, placenr, _('Ab März'), 0, false, chart, chartHosp, false);
  elementAfter.before(div);
}

function addFilterLengthButton(container, placenr, name, mode, isActive, chart, chartHosp, isIncidenceButton) {
  var button = document.createElement('button');
  button.className = "chartButton";
  if (isActive) button.classList.add('active');
  button.innerHTML = name;
  button.addEventListener('click', function() {
    if(isIncidenceButton) {
      if(this.classList.contains('active')) {
        this.classList.remove('active');
        chart.showIncidences = false;
      }
      else {
        this.classList.add('active');
        chart.showIncidences = true;
      }
    }
    else {
      this.classList.add('active');
      getSiblings(this, '.chartButton.active').forEach(element => element.classList.remove('active'));
    }
    if(mode==-1) {
      chart.mode = chart.mode!=undefined?chart.mode:(getDeviceState()==2?2:1);
    }
    else {
      chart.mode = mode;
    }
    var filter = filterCases(placenr, chart.mode);
    chart.data.labels = filter.dateLabels;
    var pointBackgroundColor = filter.incidences.map(function (d) { return (d<60)?"green":(d>=120?"red":"orange");});
    chart.data.datasets[0].data = chart.showIncidences?filter.incidences:filter.avgs;
    chart.data.datasets[0].label = chart.showIncidences?_('Inz/100k'):_('7d-Avg');
    chart.data.datasets[0].pointBackgroundColor = pointBackgroundColor;
    chart.data.datasets[0].pointBorderColor = pointBackgroundColor;
    chart.data.datasets[0].pointRadius = chart.showIncidences?4:0;
    chart.data.datasets[1].data = chart.showIncidences?null:filter.diff;
    chart.options.title.text = chart.showIncidences?_('Inzidenz per 100k über die letzten 14 Tage'):_('Bestätigte Fälle');
    chart.data.datasets[1].datalabels.display = (chart.mode==0 || (getDeviceState()==2 && chart.mode!=2)) ? false : true; //{ display: true, color: inDarkMode() ? '#ccc' : 'black', font: { weight: 'bold'} };
    chart.options.scales.xAxes[0].ticks.min = getDateForMode(mode);
    chart.options.tooltips.callbacks = getCallbacks(filter);
    chart.update(0);

    chartHosp.data.labels = filter.dateLabels;
    chartHosp.data.datasets = filter.datasets;
    chartHosp.options.scales.xAxes[0].ticks.min = getDateForMode(mode);
    chartHosp.update(0);
  });
  if(isIncidenceButton) {
    var span = document.createElement('span');
    span.append(button);
    container.append(span);
  }
  else
    container.append(button);
}

function addAxisButtons(elementAfter, chart, chartDeaths, chartHosp) {
  var div = document.createElement('div');
  div.className = "chartButtons";
  var span = document.createElement("span");
  addAxisButton(span, chart, chartDeaths, chartHosp, _('Logarithmisch'), cartesianAxesTypes.LOGARITHMIC, false);
  addAxisButton(span, chart, chartDeaths, chartHosp, _('Linear'), cartesianAxesTypes.LINEAR, true);
  div.append(span);
  elementAfter.before(div);
  return div;
}

function addAxisButton(container, chart, chartDeaths, chartHosp, name, cartesianAxisType, isActive) {
  var button = document.createElement('button');
  button.className = "chartButton";
  if (isActive) button.classList.add('active');
  button.innerHTML = name;
  button.addEventListener('click', function() {
    this.classList.add('active');
    getSiblings(this, '.chartButton.active').forEach(element => element.classList.remove('active'));

    chart.options.scales.yAxes[0].type = cartesianAxisType;
    chart.update();

    chartDeaths.options.scales.yAxes[0].type = cartesianAxisType;
    chartDeaths.update();

    chartHosp.options.scales.yAxes[0].type = cartesianAxisType;
    chartHosp.update();
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

function showInternational() {
  getWorldData();
  var div = document.getElementById("internationalData");
  div.style.display = "block";
  var a = document.getElementById("internationalLink");
  a.style.display = "none";
}

var worldData;
function getWorldData() {
  d3.csv("https://open-covid-19.github.io/data/data_latest.csv", function(error, csvdata) {
      if(error!=null) {
        console.log(error.responseURL+" not found");
      }

      worldData = csvdata.filter(function(d) { if(d.Key==d.CountryCode) return d; }); //only use countries;
      var ch = worldData.filter(function(d) { if(d.Key=="CH") return d});
      if(ch && ch[0]) ch[0].Confirmed = ""+total;
      parseWorldData();
      getWorldDataRelative(false);
  });
}

var countryPage = 0;
function worldDataForward() {
  if(countryPage==10) return;
  countryPage++;
  parseWorldData();
}

function worldDataBackward() {
  if(countryPage==0) return;
  countryPage--;
  parseWorldData();
}

var countryPageRelative = 0;
function worldDataRelativeForward() {
  if(countryPageRelative==10) return;
  countryPageRelative++;
  getWorldDataRelative(withoutSmallCountries);
}

function worldDataRelativeBackward() {
  if(countryPageRelative==0) return;
  countryPageRelative--;
  getWorldDataRelative(withoutSmallCountries);
}

function formatCountryName(name) {
  var country = name.replace(" of America","").replace("Democratic Republic", "DR.").replace("Republic", "Rep.");
  if(country.length>=19) country = country.substring(0,18)+".";
  return country;
}

function parseWorldData() {
      var start = countryPage*20;
      var end = start+20;
      var sorted = Array.from(worldData).sort(function(a, b){return b.Confirmed-a.Confirmed}).slice(start,end);
      //var sortedPerCapita = Array.from(worldData).sort(function(a, b){return parseFloat(b.Confirmed)/parseFloat(b.Population)-parseFloat(a.Confirmed)/parseFloat(a.Population)}).slice(0,25);
      //console.log("Sorted per Capita:");
      //console.log(sortedPerCapita);

      var firstTable = document.getElementById("international1");
      firstTable.innerHTML = "";
      for(var i=0; i<20; i++) {
        var single = sorted[i];
        var date = single.Date;
        var splitDate = date.split("-");
        var year = splitDate[0];
        var month = parseInt(splitDate[1]);
        var day = parseInt(splitDate[2]);
        var dateString = day+"."+month+"."+year;
        var country = formatCountryName(single.CountryName);
        var cases = ""+parseInt(single.Confirmed);
        var formattedCases = cases.replace(/\B(?=(\d{3})+(?!\d))/g, "’");
        var short = single.CountryCode.toLowerCase();
        var countryFlag = '<span class="flag flag-icon-'+short+' flag-icon-squared">'+country+'</span>'
        var tr = document.createElement("tr");
        if(short=="ch") {
          tr.innerHTML = "<td><b>"+(start+i+1)+".</b></td><td><b>"+countryFlag+"</b></td><td><b>"+formattedCases+"</b></td>";
          tr.className = "ch";
        }
        else {
          tr.innerHTML = "<td>"+(start+i+1)+".</td><td>"+countryFlag+"</td><td>"+formattedCases+"</td>";
        }
        firstTable.appendChild(tr);
      }
      getWorldDeaths(totalDeaths);
}

var withoutSmallCountries = false;
function getWorldDataRelative(withoutSmall) {
      withoutSmallCountries = withoutSmall;
      var start = countryPageRelative*20;
      var end = start+20;
      var all = Array.from(worldData);
      all = all.filter(function(d) { if(d.Population!="0" && d.Population!="") return d });
      if(withoutSmall) {
        all = all.filter(function(d) { if(parseInt(d.Population) > 100000) return d });
        document.getElementById("withoutSmallButton").classList.add('active');
        document.getElementById("withSmallButton").classList.remove('active');
      }
      else {
        document.getElementById("withSmallButton").classList.add('active');
        document.getElementById("withoutSmallButton").classList.remove('active');
      }
      var sortedPerCapita = all.sort(function(a, b){return parseFloat(b.Confirmed)/parseFloat(b.Population)-parseFloat(a.Confirmed)/parseFloat(a.Population)}).slice(start,end);
      var firstTable = document.getElementById("relative1");
      firstTable.innerHTML = "";
      for(var i=0; i<20; i++) {
        var single = sortedPerCapita[i];
        var date = single.Date;
        var splitDate = date.split("-");
        var year = splitDate[0];
        var month = parseInt(splitDate[1]);
        var day = parseInt(splitDate[2]);
        var dateString = day+"."+month+"."+year;
        var country = formatCountryName(single.CountryName);
        var confirmed = parseFloat(single.Confirmed);
        var population = parseFloat(single.Population);
        var exact = confirmed/population*1000000;
        var rounded = Math.round(exact);
        var cases = ""+rounded;
        var formattedCases = cases.replace(/\B(?=(\d{3})+(?!\d))/g, "’");
        var short = single.CountryCode.toLowerCase();
        var countryFlag = '<span class="flag flag-icon-'+short+' flag-icon-squared">'+country+'</span>'
        var tr = document.createElement("tr");
        if(short=="ch") {
          tr.innerHTML = "<td><b>"+(start+i+1)+".</b></td><td><b>"+countryFlag+"</b></td><td><b>"+formattedCases+"</b></td>";
          tr.className = "ch";
        }
        else {
          tr.innerHTML = "<td>"+(start+i+1)+".</td><td>"+countryFlag+"</td><td>"+formattedCases+"</td>";
        }
        firstTable.appendChild(tr);
      }
      getWorldDeathRelative(withoutSmall);
}

function getWorldDeathRelative(withoutSmall) {
      var start = countryPageRelative*20;
      var end = start+20;
      var all = Array.from(worldData);
      all = all.filter(function(d) { if(d.Population!="0" && d.Population!="") return d });
      if(withoutSmall) {
        all = all.filter(function(d) { if(parseInt(d.Population) > 100000) return d });
      }
      var sortedPerCapita = all.sort(function(a, b){return parseFloat(b.Deaths)/parseFloat(b.Population)-parseFloat(a.Deaths)/parseFloat(a.Population)}).slice(start,end);
      var firstTable = document.getElementById("relative2");
      firstTable.innerHTML = "";
      for(var i=0; i<20; i++) {
        var single = sortedPerCapita[i];
        var date = single.Date;
        var splitDate = date.split("-");
        var year = splitDate[0];
        var month = parseInt(splitDate[1]);
        var day = parseInt(splitDate[2]);
        var dateString = day+"."+month+"."+year;
        var country = formatCountryName(single.CountryName);
        var confirmed = parseFloat(single.Deaths);
        var population = parseFloat(single.Population);
        var exact = confirmed/population*1000000;
        var rounded = Math.round(exact);
        var cases = ""+rounded;
        var formattedCases = cases.replace(/\B(?=(\d{3})+(?!\d))/g, "’");
        var short = single.CountryCode.toLowerCase();
        var countryFlag = '<span class="flag flag-icon-'+short+' flag-icon-squared">'+country+'</span>'
        var tr = document.createElement("tr");
        if(short=="ch") {
          tr.innerHTML = "<td><b>"+(start+i+1)+".</b></td><td><b>"+countryFlag+"</b></td><td><b>"+formattedCases+"</b></td>";
          tr.className = "ch";
        }
        else {
          tr.innerHTML = "<td>"+(start+i+1)+".</td><td>"+countryFlag+"</td><td>"+formattedCases+"</td>";
        }
        firstTable.appendChild(tr);
      }
}

function getWorldDeaths(chTotal) {
  if(worldData==null) return;
  var ch = worldData.filter(function(d) { if(d.Key=="CH") return d});
  if(ch && ch[0]) ch[0].Deaths = ""+chTotal;

  var start = countryPage*20;
  var end = start+20;
  var sorted = Array.from(worldData).sort(function(a, b){return b.Deaths-a.Deaths}).slice(start,end);

  var firstTable = document.getElementById("international2");
  firstTable.innerHTML = "";
  for(var i=0; i<20; i++) {
    var single = sorted[i];
    var date = single.Date;
    var splitDate = date.split("-");
    var year = splitDate[0];
    var month = parseInt(splitDate[1]);
    var day = parseInt(splitDate[2]);
    var dateString = day+"."+month+"."+year;
    var country = formatCountryName(single.CountryName);
    var cases = ""+parseInt(single.Deaths);
    var formattedCases = cases.replace(/\B(?=(\d{3})+(?!\d))/g, "’");
    var short = single.CountryCode.toLowerCase();
    var countryFlag = '<span class="flag flag-icon-'+short+' flag-icon-squared">'+country+'</span>'
    var tr = document.createElement("tr");
    if(short=="ch") {
      tr.innerHTML = "<td><b>"+(start+i+1)+".</b></td><td><b>"+countryFlag+"</b></td><td><b>"+formattedCases+"</b></td>";
      tr.className = "ch";
    }
    else {
      tr.innerHTML = "<td>"+(start+i+1)+".</td><td>"+countryFlag+"</td><td>"+formattedCases+"</td>";
    }
    firstTable.appendChild(tr);
  }
}
