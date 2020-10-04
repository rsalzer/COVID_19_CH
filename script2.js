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
var actualData = [];
var lastData = [];
var actualDeaths = [];
var actualHospitalisation = [];
var actualIsolation = [];
var data = [];
Chart.defaults.global.defaultFontFamily = "IBM Plex Sans";
document.getElementById("loaded").style.display = 'none';

setLanguageNav();

//console.log("START");
getCanton(0);
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

function getCanton(i) {
  // var url = "https://raw.githubusercontent.com/openZH/covid_19/master/COVID19_Fallzahlen_CH_total_v2.csv";
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
          lastData.push(filteredDataForCases[filteredDataForCases.length-2]);
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
  var start = new Date();
  // console.log("Process actual");
  processActualData();
  processActualDeaths();
  processActualHospitalisation();
  // console.log("End actual");
  getBAGIsolation();
  // console.log("Start All CH");
  barChartAllCH();
  // console.log("End All CH / Start Deaths");
  // console.log("End Deaths CH / Start Hosp");
  //barChartAllCHHospitalisations();
  // console.log("End Hosp CH");
  for(var i=0; i<cantons.length; i++) {
    barChartCases(cantons[i]);
  }
  //console.log("End Single Cantons");
}

function processActualData() {
  var sortedActual = Array.from(actualData).sort(function(a, b){return b.ncumul_conf-a.ncumul_conf});
  var firstTable = document.getElementById("confirmed_1");
  var secondTable = document.getElementById("confirmed_2");
  var total = 0;
  var diffTotal = 0;
  var cases14DaysTotal = 0;
  for(var i=0; i<sortedActual.length; i++) {
    var table;
    if(i<sortedActual.length/2) table = firstTable;
    else table = secondTable;
    var actual = sortedActual[i];
    var now = actual.ncumul_conf;
    if(actual.abbreviation_canton_and_fl!="FL" && now!="") {
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
    td.appendChild(document.createTextNode(actual.date.replace("2020-", "")));
    tr.appendChild(td);
    td = document.createElement("td");
    var text = document.createTextNode(now);
    td.appendChild(text);
    tr.appendChild(td);
    td = document.createElement("td");
    var yesterday = lastData.filter(d => d.abbreviation_canton_and_fl == actual.abbreviation_canton_and_fl)[0];
    var casesYesterday = parseInt(yesterday.ncumul_conf);
    var diff = "";
    var timeNow = new Date();
    timeNow.setMinutes(timeNow.getMinutes()-timeNow.getTimezoneOffset()); //correct offset to UTC
    timeNow.setHours(timeNow.getHours()-7); //show old date till 7am
    if(actual.date == timeNow.toISOString().substring(0,10)) {
      var diff = parseInt(now) - casesYesterday;
      if(actual.abbreviation_canton_and_fl!="FL") diffTotal += diff;
    }
    td.appendChild(document.createTextNode(diff));
    tr.appendChild(td);

    var dateSplit = actual.date.split("-");
    var day = parseInt(dateSplit[2]);
    var month = parseInt(dateSplit[1])-1;
    var year = parseInt(dateSplit[0]);
    var d = new Date(Date.UTC(year,month,day))
    d.setDate(d.getDate() - 14);
    dateString = d.toISOString();
    dateString = dateString.substring(0,10);
    //console.log("today: "+day+" -14: "+dateString);

    var filtered14DaysAgo = data.filter(d => (d.abbreviation_canton_and_fl == actual.abbreviation_canton_and_fl && d.date == dateString));
    var cases14DaysDiff = "";
    var incidence = "";
    var risk;
    if(filtered14DaysAgo.length>0) {
      var cases14DaysAgo = parseInt(filtered14DaysAgo[filtered14DaysAgo.length-1].ncumul_conf);
      cases14DaysDiff = parseInt(now) - cases14DaysAgo;
      var incidence = Math.round(cases14DaysDiff / population[actual.abbreviation_canton_and_fl] * 100000);
      var risk = "low";
      if(incidence>=60) risk = "medium";
      if(incidence>=120) risk = "high";
    }
    else { // another day back if does not exist...
      d.setDate(d.getDate() - 1);
      dateString = d.toISOString();
      dateString = dateString.substring(0,10);
      filtered14DaysAgo = data.filter(d => (d.abbreviation_canton_and_fl == actual.abbreviation_canton_and_fl && d.date == dateString));
      if(filtered14DaysAgo.length>0) {
        var cases14DaysAgo = parseInt(filtered14DaysAgo[filtered14DaysAgo.length-1].ncumul_conf);
        cases14DaysDiff = parseInt(now) - cases14DaysAgo;
        var incidence = Math.round(cases14DaysDiff / population[actual.abbreviation_canton_and_fl] * 100000);
        var risk = "low";
        if(incidence>=60) risk = "medium";
        if(incidence>=120) risk = "high";
      }
    }
    if(cases14DaysDiff!="")
      cases14DaysTotal += cases14DaysDiff
    td = document.createElement("td");
    td.innerHTML = cases14DaysDiff;
    tr.appendChild(td);
    td = document.createElement("td");
    td.innerHTML = "<span class=\"risk "+risk+"\">"+incidence+"</span>";
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
  var formattedTotal = total.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "’");
  var formatted14DayCases = cases14DaysTotal.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "’");
  var incidenceCH = Math.round(cases14DaysTotal / population["CH"] * 100000);
  var riskCH = "low";
  if(incidenceCH>=60) riskCH = "medium";
  if(incidenceCH>=120) riskCH = "high";
  tr.innerHTML = "<td><a class='flag CH' href='#detail_CH'><b>CH</b></a></td><td><b>TOTAL</b></td><td><b>"+formattedTotal+"</b></td><td><b>"+diffTotal+"</b></td><td><b>"+formatted14DayCases+"</b></td><td><span class=\"risk "+riskCH+"\">"+incidenceCH+"</span></td>";
  secondTable.append(tr);
  getWorldData(total);
  //document.getElementById("last").append(firstTable);
  //document.getElementById("last").append(secondTable);
  //document.getElementById("last").append(document.createTextNode("Total CH gemäss Summe Kantone: "+total));
}

var totalDeaths;
function processActualDeaths() {
  var sortedActual = Array.from(actualDeaths).sort(function(a, b){return b.ncumul_deceased-a.ncumul_deceased});
  var firstTable = document.getElementById("death_1");
  var secondTable = document.getElementById("death_2");
  var total = 0;
  for(var i=0; i<sortedActual.length; i++) {
    var table;
    if(i<sortedActual.length/2) table = firstTable;
    else table = secondTable;
    var actual = sortedActual[i];
    var now = actual.ncumul_deceased;
    if(actual.abbreviation_canton_and_fl!="FL" && now!="") total+=parseInt(now);

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
    table.appendChild(tr);
  }
  var tr = document.createElement("tr");
  tr.innerHTML = "<td><a class='flag CH' href='#detail_CH'><b>CH</b></a></td><td><b>TOTAL</b></td><td><b>"+total+"</b></td><td></td>";
  secondTable.append(tr);
  totalDeaths = total;
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

function filterAllCH(mode) {
  var date = new Date();
  date.setTime(getDateForMode(mode).getTime());
  date.setDate(date.getDate()-1); //3.6. is better as start...
  var now = new Date();
  now.setMinutes(now.getMinutes()-now.getTimezoneOffset());
  //alert(now.toISOString());
  var dataPerDay = [];
  var emptyFirst = {};
  emptyFirst.data = [];
  for(var j=0; j<cantons.length-1; j++) {
    var canton = cantons[j];
    var cantonTotal = {
      canton: canton,
      date_ncumul_conf: _("Keine Daten"),
      date_ncumul_deceased: _("Keine Daten"),
      date_current_hosp: _("Keine Daten"),
      ncumul_conf: 0,
      ncumul_deceased: 0,
      current_hosp: 0
    };
    emptyFirst.data.push(cantonTotal);
  }
  dataPerDay.push(emptyFirst);

  // console.log("Start preping CH cases");
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
      var cantonTotal = getDataForDay(canton, date);
      if(cantonTotal==null) {
        cantonTotal = Object.assign({}, dataPerDay[dataPerDay.length-1].data[i]);
        cantonTotal.diff_ncumul_deceased = null;
        cantonTotal.diff_ncumul_conf = null;
        cantonTotal.diff_current_hosp = null;
      }
      else {
          if(Number.isNaN(cantonTotal.ncumul_conf)) {
            cantonTotal.ncumul_conf = dataPerDay[dataPerDay.length-1].data[i].ncumul_conf;
            cantonTotal.date_ncumul_conf = dataPerDay[dataPerDay.length-1].data[i].date_ncumul_conf;
            cantonTotal.diff_ncumul_conf = null;
            //console.log("Old ncumul conf for: "+canton+" date: "+dateString);
          }
          else
            cantonTotal.diff_ncumul_conf = cantonTotal.ncumul_conf - dataPerDay[dataPerDay.length-1].data[i].ncumul_conf;

          if(Number.isNaN(cantonTotal.ncumul_deceased)) {
            cantonTotal.ncumul_deceased = dataPerDay[dataPerDay.length-1].data[i].ncumul_deceased;
            cantonTotal.date_ncumul_deceased = dataPerDay[dataPerDay.length-1].data[i].date_ncumul_deceased;
            cantonTotal.diff_ncumul_deceased = null;
            //console.log("Old ncumul death for: "+canton+" date: "+dateString);
          }
          else
            cantonTotal.diff_ncumul_deceased = cantonTotal.ncumul_deceased - dataPerDay[dataPerDay.length-1].data[i].ncumul_deceased;

          if(Number.isNaN(cantonTotal.current_hosp)) {
            cantonTotal.current_hosp = dataPerDay[dataPerDay.length-1].data[i].current_hosp;
            cantonTotal.date_current_hosp = dataPerDay[dataPerDay.length-1].data[i].date_current_hosp;
            cantonTotal.diff_current_hosp = null;
            //console.log("Old ncumul death for: "+canton+" date: "+dateString);
          }
          else
            cantonTotal.diff_current_hosp = cantonTotal.current_hosp - dataPerDay[dataPerDay.length-1].data[i].current_hosp;
      }
      singleDayObject.data.push(cantonTotal);
    }
    singleDayObject.total_ncumul_conf = singleDayObject.data.reduce(function(acc, val) { return acc + val.ncumul_conf; }, 0);
    singleDayObject.total_ncumul_deceased = singleDayObject.data.reduce(function(acc, val) { return acc + val.ncumul_deceased; }, 0);
    singleDayObject.total_current_hosp = singleDayObject.data.reduce(function(acc, val) { return acc + val.current_hosp; }, 0);
    singleDayObject.diffTotal_ncumul_conf = singleDayObject.data.reduce(function(acc, val) { return acc + val.diff_ncumul_conf; }, 0);
    singleDayObject.diffTotal_ncumul_deceased = singleDayObject.data.reduce(function(acc, val) { return acc + val.diff_ncumul_deceased; }, 0);
    singleDayObject.diffTotal_current_hosp = singleDayObject.data.reduce(function(acc, val) { return acc + val.diff_current_hosp; }, 0);
    dataPerDay.push(singleDayObject);
    date = new Date(Date.UTC(date.getFullYear(),date.getMonth(),date.getDate()+1));
  }
  dataPerDay.splice(0,4);
  var dateLabels = dataPerDay.map(function(d) {
    var dateSplit = d.date.split("-");
    var day = parseInt(dateSplit[2]);
    var month = parseInt(dateSplit[1])-1;
    var year = parseInt(dateSplit[0]);
    var date = new Date(year,month,day);
    return date;
  });
  return {
    "dataPerDay": dataPerDay,
    "dateLabels": dateLabels
  }
}

function addFilterLengthButtonsCH(elementAfter, chart, chartDeaths, chartHosp) {
  var place = "CH";
  var div = document.createElement('div');
  div.className = "chartButtons";
  if(getDeviceState()==2) addFilterLengthButtonCH(div, place, _('Letzte 30 Tage'), 2, getDeviceState()==2, chart, chartDeaths, chartHosp);
  addFilterLengthButtonCH(div, place, _('Ab Juni'), 1, getDeviceState()!=2, chart, chartDeaths, chartHosp);
  addFilterLengthButtonCH(div, place, _('Ab März'), 0, false, chart, chartDeaths, chartHosp);
  elementAfter.before(div);
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
    chart.data.labels = filter.dateLabels;
    chart.data.datasets[0].data = diff;
    chart.options.scales.xAxes[0].ticks.min = getDateForMode(mode);
    chart.options.tooltips.callbacks = getCHCallbacks(filter, "ncumul_conf");
    chart.options.plugins.datalabels = (mode==0 || (getDeviceState()==2 && mode!=2)) ? false : { color: inDarkMode() ? '#ccc' : 'black', font: { weight: 'bold'} };
    chart.update(0);

    var deathDiff = filter.dataPerDay.map(function(d) {return d.diffTotal_ncumul_deceased});
    chartDeaths.data.labels = filter.dateLabels;
    chartDeaths.data.datasets[0].data = deathDiff;
    chartDeaths.options.scales.xAxes[0].ticks.min = getDateForMode(mode);
    chartDeaths.options.tooltips.callbacks = getCHCallbacks(filter, "ncumul_deceased");
    chartDeaths.options.plugins.datalabels = (mode==0 || (getDeviceState()==2 && mode!=2)) ? false : getDataLabels();
    chartDeaths.update(0);

    var totalHosp = filter.dataPerDay.map(function(d) {return d.total_current_hosp});
    chartHosp.data.labels = filter.dateLabels;
    chartHosp.data.datasets[0].data = totalHosp;
    chartHosp.options.scales.xAxes[0].ticks.min = getDateForMode(mode);
    chartHosp.options.tooltips.callbacks = getCHCallbacks(filter, "current_hosp");
    chartHosp.options.plugins.datalabels = (mode==0 || (getDeviceState()==2 && mode!=2)) ? false : { color: inDarkMode() ? '#ccc' : 'black', font: { weight: 'bold'} };
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
    label: function(tooltipItems, data) {
      var value = tooltipItems.value;
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
      multistringText = [""];
      var index = tooltipItems[0].index;
      var dataForThisDay = filter.dataPerDay[index];
      var sorted = Array.from(dataForThisDay.data).sort(function(a, b){ if(a[variable]==b[variable]) return b["date_"+variable]<a["date_"+variable]?1:-1;  return b[variable]-a[variable]});
      sorted.forEach(function(item) {
        var tabbing = 5-(""+item[variable]).length;
        var padding = " ".repeat(tabbing);
        var diffStr = item["diff_"+variable]!=null?(item["diff_"+variable]>=0?"+"+item["diff_"+variable]:item["diff_"+variable]):""
        multistringText.push(item.canton+":"+padding+item[variable]+" ("+item["date_"+variable]+") "+diffStr);
      });

      return multistringText;
    }
  };
}

function barChartAllCH() {
  // console.log("End preping CH cases");
  //console.log(dataPerDay);
  var filter = filterAllCH(getDeviceState()==2 ? 2 : 1);
  var diff = filter.dataPerDay.map(function(d) {return d.diffTotal_ncumul_conf});

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
        position : 'custom',
        caretSize: 0,
        bodyFontFamily: 'IBM Plex Mono',
        callbacks: getCHCallbacks(filter, "ncumul_conf")
      },
      scales: getScales((getDeviceState()==2) ? 2 : 1),
      plugins: {
        datalabels: {
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
        data: diff,
        fill: false,
        cubicInterpolationMode: 'monotone',
        spanGaps: true,
        borderColor: '#F15F36',
        backgroundColor: '#F15F36',
        datalabels: {
          align: /*'end',*/ function (context) {
                // var index = context.dataIndex;
                // return index % 2 == 0 ? 'top' : 'bottom';
                return 'top';
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

  var chartDeaths = barChartAllCHDeaths(filter);
  var chartHosp = barChartAllCHHospitalisations(filter);
  addFilterLengthButtonsCH(canvas, chart, chartDeaths, chartHosp);
}

function barChartAllCHDeaths(filter) {
  var diff = filter.dataPerDay.map(function(d) {return d.diffTotal_ncumul_deceased});

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
        mode: 'nearest',
        intersect: false,
        position : 'custom',
        caretSize: 0,
        bodyFontFamily: 'IBM Plex Mono',
        callbacks: getCHCallbacks(filter, "ncumul_deceased")
      },
      scales: getScales((getDeviceState()==2) ? 2 : 1),
      plugins: {
        datalabels: {
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
        data: diff,
        fill: false,
        cubicInterpolationMode: 'monotone',
        spanGaps: true,
        borderColor: inDarkMode() ? 'rgba(150, 150, 150, 1)' : '#010101',
        backgroundColor: inDarkMode() ? 'rgba(150, 150, 150, 1)' : '#010101',
        datalabels: {
          align: 'end', /*function (context) {
                var index = context.dataIndex;
                return index % 2 == 0 ? 'top' : 'bottom';
          },*/
          anchor: 'end'
        }
      }
    ]
  }
});

  return chart;
}

function barChartAllCHHospitalisations(filter) {
  console.log(filter.dataPerDay);
  var cases = filter.dataPerDay.map(function(d) {return d.total_current_hosp});
  //console.log(dataPerDay);
  var place = "CH";
  var section = document.getElementById("detail");
  var div = document.getElementById("container_CH");
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
        position : 'custom',
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

  return chart;
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

function filterCases(place, mode) {
  var filteredData = data.filter(function(d) { if(d.abbreviation_canton_and_fl==place) return d});
  if(!filteredData || filteredData.length<2) return;
  var moreFilteredData = filteredData.filter(function(d) { if(d.ncumul_conf!="") return d});
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
  var cases = moreFilteredData.map(function(d) {return d.ncumul_conf});
  var diff = [0];
  for (var i = 1; i < cases.length; i++) diff.push(cases[i] - cases[i - 1]);
  dateLabels.splice(0,1);
  cases.splice(0,1);
  diff.splice(0,1);
  //Hospitalisations:
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
  return {
    "cases": cases,
    "dateLabels": dateLabels,
    "diff": diff,
    "datasets": datasets
  }
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
  var filter = filterCases(place, (getDeviceState()==2) ? 2 : 1);
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
        callbacks: {
          label: function(tooltipItems, data) {
            var index = tooltipItems.index;
            var value = filter.cases[index];
            var change;
            if(index>0) {
                change = parseInt(value)-parseInt(filter.cases[index-1]);
            }
            else {
                change = parseInt(tooltipItems.value);
            }
            var label = change>0 ? "+"+change : change;
            var changeStr = " ("+label+")";
            return value+changeStr;
          }
        }
      },
      scales: getScales((getDeviceState()==2) ? 2 : 1),
      plugins: {
        datalabels:
        {
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
        data: filter.diff,
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
  addFilterLengthButtons(canvas, place, chart, chartHosp);
}

function getScales(mode) {
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

function addFilterLengthButtons(elementAfter, place, chart, chartHosp) {
  var div = document.createElement('div');
  div.className = "chartButtons";
  if(getDeviceState()==2) addFilterLengthButton(div, place, _('Letzte 30 Tage'), 2, getDeviceState()==2, chart, chartHosp);
  addFilterLengthButton(div, place, _('Ab Juni'), 1, getDeviceState()!=2, chart, chartHosp);
  addFilterLengthButton(div, place, _('Ab März'), 0, false, chart, chartHosp);
  elementAfter.before(div);
}

function addFilterLengthButton(container, place, name, mode, isActive, chart, chartHosp) {
  var button = document.createElement('button');
  button.className = "chartButton";
  if (isActive) button.classList.add('active');
  button.innerHTML = name;
  button.addEventListener('click', function() {
    this.classList.add('active');
    getSiblings(this, '.chartButton.active').forEach(element => element.classList.remove('active'));
    var filter = filterCases(place, mode);
    chart.data.labels = filter.dateLabels;
    chart.data.datasets[0].data = filter.diff;
    chart.options.scales.xAxes[0].ticks.min = getDateForMode(mode);
    chart.options.tooltips.callbacks = {
      label: function(tooltipItems, data) {
        var index = tooltipItems.index;
        var value = filter.cases[index];
        var change;
        if(index>0) {
            change = parseInt(value)-parseInt(filter.cases[index-1]);
        }
        else {
            change = parseInt(tooltipItems.value);
        }
        var label = change>0 ? "+"+change : change;
        var changeStr = " ("+label+")";
        return value+changeStr;
      }
    };
    chart.options.plugins.datalabels = (mode==0 || (getDeviceState()==2 && mode!=2)) ? false : { color: inDarkMode() ? '#ccc' : 'black', font: { weight: 'bold'} };
    chart.update(0);

    chartHosp.data.labels = filter.dateLabels;
    chartHosp.data.datasets = filter.datasets;
    chartHosp.options.scales.xAxes[0].ticks.min = getDateForMode(mode);
    chartHosp.update(0);
  });
  container.append(button);
}

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
