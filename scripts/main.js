// Takes in name of csv and populates necessary data in table
function readFromCSV(path) {
  var rawFile = new XMLHttpRequest();
  rawFile.open("GET", path, false);
  rawFile.onreadystatechange = function() {
    if (rawFile.readyState === 4) {
      if (rawFile.status === 200 || rawFile.status == 0) {
        let allText = rawFile.responseText;
        let out = CSV.parse(allText);
        let trainees = convertCSVArrayToTraineeData(out);
        populateTable(trainees);
      }
    }
  };
  rawFile.send(null);
}

function findTraineeById(id) {
  for (let i = 0; i < trainees.length; i++) {
    if (id === trainees[i].id) { // if trainee's match
      return trainees[i];
    }
  }
  return newTrainee();
}

// If the user has saved a ranking via id, then recover it here
function getRanking() {
  var urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has("r")) {
    let rankString = atob(urlParams.get("r")) // decode the saved ranking
    let rankingIds = [];
    for (let i = 0; i < rankString.length; i += 2) {
      let traineeId = rankString.substr(i, 2); // get each id of the trainee by substringing every 2 chars
      rankingIds.push(parseInt(traineeId));
    }
    console.log(rankingIds);
    // use the retrieved rankingIds to populate ranking
    for (let i = 0; i < rankingIds.length; i++) {
      traineeId = rankingIds[i];
      if (traineeId < 0) {
        ranking[i] = newTrainee();
      } else {
        let trainee = findTraineeById(rankingIds[i])
        // let trainee = trainees[rankingIds[i]];
        trainee.selected = true;
        ranking[i] = trainee;
      }
    }
    // refresh table to show checkboxes
    rerenderTable();
    // refresh ranking to show newly inserted trainees
    rerenderRanking();
    console.log(ranking);
  }
}

// Takes in an array of trainees and converts it to js objects
// Follows this schema:
/*
trainee: {
  id: ... // position in csv used for simple recognition
  stage_name: ...
  name_native: ...
  name_romanized: ...
  affiliation: ...
  nationality: ...
  rating: ...
  birthyear: ...
  image: ...
  selected: false/true // whether user selected them
  eliminated: false/true
  top9: false/true
}
*/
function convertCSVArrayToTraineeData(csvArrays) {
  trainees = csvArrays.map(function(traineeArray, index) {
    trainee = {};
    trainee.stage_name = traineeArray[0];
    if (traineeArray[2] === "-") {
      // trainee only has one name
      trainee.name_native = traineeArray[1];
    } else {
      trainee.name_native = traineeArray[1];
      trainee.name_romanized = traineeArray[2];
    }
    trainee.affiliation = traineeArray[3];
    trainee.nationality = traineeArray [4];
    trainee.rating = traineeArray[5];
    trainee.birthyear = traineeArray[6];
    trainee.eliminated = traineeArray[7] === 'e'; // sets trainee to be eliminated if 'e' appears in 7th col
    trainee.top9 = traineeArray[7] === 't'; // sets trainee to top 9 if 't' appears in 7th column
    trainee.id = parseInt(traineeArray[8]) - 1; // trainee id is the original ordering of the trainees in the first csv
    trainee.image =
      trainee.stage_name.replaceAll(" ", "", ".").replaceAll("-", "", "_") + ".png";
    return trainee;
  });
  filteredTrainees = trainees;
  return trainees;
}

// Constructor for a blank trainee
function newTrainee() {
  return {
    id: -1, // -1 denotes a blank trainee spot
    stage_name: '&#8203;', // this is a blank character
    affiliation: '&#8203;', // this is a blank character
    nationality: '&#8203;',
    rating: 'no',
    image: 'empty_rank.png',
  };
}

// Constructor for a blank ranking list
function newRanking() {
  // holds the ordered list of rankings that the user selects
  let ranking = new Array(9);
  for (let i = 0; i < ranking.length; i++) {
    ranking[i] = newTrainee();
  }
  return ranking;
}

// rerender method for table (search box)
// TODO: this site might be slow to rerender because it clears + adds everything each time
function rerenderTable() {
  clearTable();
  populateTable(filteredTrainees);
  // populateRanking();
}

// rerender method for ranking
function rerenderRanking() {
  clearRanking();
  populateRanking();
}

function removeAllChildren(element) {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

// Clears out the table
function clearTable() {
  let table = document.getElementById("table__entry-container");
  removeAllChildren(table);
}

// Clears out the ranking
function clearRanking() {
  // Currently just duplicates first ranking entry
  let ranking_chart = document.getElementById("ranking__pyramid");
  let rankRows = Array.from(ranking_chart.children).slice(1); // remove the title element
  // let rankEntry = rankRows[0].children[0];
  for (let i = 0; i < rowNums.length; i++) {
    let rankRow = rankRows[i];
    for (let j = 0; j < rowNums[i]; j++) {
      removeAllChildren(rankRow);
    }
  }
}

// Uses populated local data structure from readFromCSV to populate table
function populateTable(trainees) {
  // Currently just duplicates the first table entry
  let table = document.getElementById("table__entry-container");
  exampleEntry = table.children[0];
  for (let i = 0; i < trainees.length; i++) {
    // generate and insert the html for a new trainee table entry
    table.insertAdjacentHTML("beforeend", populateTableEntry(trainees[i]));
    // add the click listener to the just inserted element
    let insertedEntry = table.lastChild;
    insertedEntry.addEventListener("click", function (event) {
      tableClicked(trainees[i]);
    });
  }
}

function populateTableEntry(trainee) {
  // eliminated will have value "eliminated" only if trainee is eliminated and showEliminated is true, otherwise this is ""
  let eliminated = (showEliminated && trainee.eliminated) && "eliminated";
  let top9 = (showTop9 && trainee.top9) && "top9";
  const tableEntry = `
  <div class="table__entry ${eliminated}">
    <div class="table__entry-icon">
      <img class="table__entry-img" src="assets/trainees/${trainee.image}" />
      <div class="table__entry-icon-border ${trainee.rating.toLowerCase()}-rank-border"></div>
      ${
        top9 ? '<div class="table__entry-icon-thingy"></div>' : ''
      }
      ${
        trainee.selected ? '<img class="table__entry-check" src="assets/check.png"/>' : ""
      }
    </div>
    <div class="table__entry-text">
      <span class="name"><strong>${trainee.stage_name}</strong></span>
      <span class="native">(${trainee.name_native})</span>
      <span class="nationalityandyear">${trainee.nationality.toUpperCase()} •
      ${trainee.birthyear}</span>
    </div>
  </div>`;
  return tableEntry;
}

// Uses populated local data structure from getRanking to populate ranking
function populateRanking() {
  // Currently just duplicates first ranking entry
  let ranking_chart = document.getElementById("ranking__pyramid");
  let rankRows = Array.from(ranking_chart.children).slice(1); // remove the title element
  // let rankEntry = rankRows[0].children[0];
  let currRank = 1;
  for (let i = 0; i < rowNums.length; i++) {
    let rankRow = rankRows[i];
    for (let j = 0; j < rowNums[i]; j++) {
      let currTrainee = ranking[currRank-1];
      rankRow.insertAdjacentHTML("beforeend", populateRankingEntry(currTrainee, currRank))

      let insertedEntry = rankRow.lastChild;
      let dragIcon = insertedEntry.children[0].children[0]; // drag icon is just the trainee image and border
      let iconBorder = dragIcon.children[1]; // this is just the border and the recipient of dragged elements
      // only add these event listeners if a trainee exists in this slot
      if (currTrainee.id >= 0) {
        // add event listener to remove item
        insertedEntry.addEventListener("click", function (event) {
          rankingClicked(currTrainee);
        });
        // add event listener for dragging
        dragIcon.setAttribute('draggable', true);
        dragIcon.classList.add("drag-cursor");
        dragIcon.addEventListener("dragstart", createDragStartListener(currRank - 1));
      }
      // add event listeners for blank/filled ranking entries
      iconBorder.addEventListener("dragenter", createDragEnterListener());
      iconBorder.addEventListener("dragleave", createDragLeaveListener());
      iconBorder.addEventListener("dragover", createDragOverListener());
      iconBorder.addEventListener("drop", createDropListener());
      // }
      currRank++;
    }
  }
}

const abbreviatedNationalities = {
  "JAPAN": "JPN 🇯🇵",
  "CHINA": "CHN 🇨🇳",
  "SOUTH KOREA": "KOR 🇰🇷",
  "CANADA": "CAN 🇨🇦",
  "AUSTRALIA": "AUS 🇦🇺",
  "THAILAND": "THA 🇹🇭",
  "MONGOLIA": "MNG 🇲🇳",
  "MYANMAR": "MMR 🇲🇲",
  "ITALY": "ITA 🇮🇹",
  "PHILIPPINES": "PHL 🇵🇭",
  "MALAYSIA": "MYS 🇲🇾",
  "JAPAN/FRANCE": "JPN/FRA 🇯🇵🇫🇷",
  "VIETNAM": "VNM 🇻🇳",
  "JAPAN/AUSTRALIA": "JPN/AUS 🇯🇵🇦🇺"
}

function populateRankingEntry(trainee, currRank) {
  let modifiedNationality = trainee.nationality.toUpperCase();
  let eliminated = (showEliminated && trainee.eliminated) && "eliminated";
  let top9 = (showTop9 && trainee.top9) && "top9";
  const rankingEntry = `
  <div class="ranking__entry ${eliminated}">
    <div class="ranking__entry-view">
      <div class="ranking__entry-icon">
        <img class="ranking__entry-img" src="assets/trainees/${trainee.image}" />
        <div class="ranking__entry-icon-border ${trainee.rating.toLowerCase()}-rank-border" data-rankid="${currRank-1}"></div>
      </div>
      <div class="ranking__entry-icon-badge bg-${trainee.rating.toLowerCase()}">${currRank}</div>
      ${
        top9 ? '<div class="ranking__entry-icon-thingy"></div>' : ''
      }
    </div>
    <div class="ranking__row-text">
      <div class="name"><strong>${trainee.stage_name}</strong></div>
      <div class="nationality">${modifiedNationality}</div>
    </div>
  </div>`;
  return rankingEntry;
}

// Event handlers for table
function tableClicked(trainee) {
  if (trainee.selected) {
    // Remove the trainee from the ranking
    let success = removeRankedTrainee(trainee);
    if (success) { // if removed successfully
      trainee.selected = !trainee.selected;
    } else {
      return;
    }
  } else {
    // Add the trainee to the ranking
    let success = addRankedTrainee(trainee);
    if (success) { // if added successfully
      trainee.selected = true;
    } else {
      return;
    }
  }
  rerenderTable();
  rerenderRanking();
}

// Event handler for ranking
function rankingClicked(trainee) {
	if (trainee.selected) {
    trainee.selected = !trainee.selected;
    // Remove the trainee from the ranking
    removeRankedTrainee(trainee);
  }
  rerenderTable();
	rerenderRanking();
}

function swapTrainees(index1, index2) {
  tempTrainee = ranking[index1];
  ranking[index1] = ranking[index2];
  ranking[index2] = tempTrainee;
  rerenderRanking();
}

// Controls alternate ways to spell trainee names
// to add new entries use the following format:
// <original>: [<alternate1>, <alternate2>, <alternate3>, etc...]
// <original> is the original name as appearing on csv
// all of it should be lower case
const alternateRomanizations = {
  'acare': ['eclair'],
  'akina': ['faky'],
  'ánh sáng': ['anh sang', 'anhsang', 'sgo48', '48'],
  'caith': ['jkt48', '48'],
  'coco': ['koko'],
  'devi': ['jkt48', '48'],
  'duna': ['csr'],
  'emma': ['zhu yimeng', 'yimeng', 'zhu yi meng', 'yi meng'],
  'geumhee': ['csr'],
  'grace': ['mindy'],
  'ilene': ['mindy'],
  'j jazzsper': ['jazzsper', 'bear knuckle'],
  'kittie': ['bian tian yu', 'bian tianyu', 'tian yu', 'tianyu'],
  'liliana li': ['li shitian', 'li shi tian', 'shitian', 'shi tian'],
  'ma liya': ['maliya', 'maria'],
  'mamcù': ['mamcu', 'manchu'],
  'mingming': ['mindy', 'celeste'],
  'p.amp': ['pam', 'pamp', 'p amp'],
  'panda': ['pink panda'],
  'pangjang': ['mindy'],
  'pream': ['celeste'],
  'rei': ['girls planet 999', 'gp999', 'revy'],
  'rinka': ['girls planet 999', 'gp999'],
  'ruan': ['girls planet 999', 'gp999', 'kiss girls'],
  'seoyeon': ['csr'],
  'si yang': ['betty', 'zhong si yang', 'zhong siyang'],
  'wang ke': ['aim', 'howz', 'produce 48', 'pd48', 'produce48'],
  'xuanning': ['tian xuan ning', 'tian xuanning'],
  'xueyao': ['shadow', 'zeng xueyao', 'zeng xue yao', 'chuang 2020', 'produce camp 2020'],
  'xin meng': ['xinmeng', 'qiao xinmeng', 'qiao xin meng'],
  'yeham': ['csr'],
  'yuan ke': ['moko'],
  'zoi': ['zoya']
};

// uses the current filter text to create a subset of trainees with matching info
function filterTrainees(event) {
  let filterText = event.target.value.toLowerCase();
  // filters trainees based on name, alternate names, affiliation, nationality and birth year
  filteredTrainees = trainees.filter(function (trainee) {
    let initialMatch = includesIgnCase(trainee.stage_name, filterText) || includesIgnCase (trainee.affiliation, filterText) || includesIgnCase (trainee.birthyear, filterText) || includesIgnCase (trainee.nationality, filterText);
    // if alernates exists then check them as well
    let alternateMatch = false;
    let alternates = alternateRomanizations[trainee.stage_name.toLowerCase()]
    if (alternates) {
      for (let i = 0; i < alternates.length; i++) {
        alternateMatch = alternateMatch || includesIgnCase(alternates[i], filterText);
      }
    }
    return initialMatch || alternateMatch;
  });
  filteredTrainees = sortedTrainees(filteredTrainees);
  rerenderTable();
}

// Checks if mainString includes a subString and ignores case
function includesIgnCase(mainString, subString) {
  return mainString.toLowerCase().includes(subString.toLowerCase());
}

// Finds the first blank spot for
function addRankedTrainee(trainee) {
  for (let i = 0; i < ranking.length; i++) {
    if (ranking[i].id === -1) { // if spot is blank denoted by -1 id
      ranking[i] = trainee;
      return true;
    }
  }
  return false;
}

function removeRankedTrainee(trainee) {
  for (let i = 0; i < ranking.length; i++) {
    if (ranking[i].id === trainee.id) { // if trainee's match
      ranking[i] = newTrainee();
      return true;
    }
  }
  return false;
}

const currentURL = "https://chuangasia.github.io/";
// Serializes the ranking into a string and appends that to the current URL
function generateShareLink() {
  let shareCode = ranking.map(function (trainee) {
    let twoCharID = ("0" + trainee.id).slice(-2); // adds a zero to front of digit if necessary e.g 1 --> 01
    return twoCharID;
  }).join("");
  console.log(shareCode);
  shareCode = btoa(shareCode);
  shareURL = currentURL + "?r=" + shareCode;
  showShareLink(shareURL);
}

function showShareLink(shareURL) {
  let shareBox = document.getElementById("getlink-textbox");
  shareBox.value = shareURL;
  document.getElementById("getlink-textbox").style.display = "block";
  document.getElementById("copylink-button").style.display = "block";
}

function copyLink() {
  let shareBox = document.getElementById("getlink-textbox");
  shareBox.select();
  document.execCommand("copy");
}

// holds the list of all trainees
var trainees = [];
// holds the list of trainees to be shown on the table
var filteredTrainees = [];
// holds the ordered list of rankings that the user selects
var ranking = newRanking();
const rowNums = [1,3,5];
//window.addEventListener("load", function () {
  populateRanking();
  readFromCSV("./trainee_info.csv");
//});
// checks the URL for a ranking and uses it to populate ranking
getRanking();
