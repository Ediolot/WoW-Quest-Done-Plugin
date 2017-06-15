/* Default configuration */
const kDataName = "Configuration";
const kDefaultDataName = "DefaultConfiguration";
const kDefaultQuestConfig = {
  names   : [],
  apiKey  : "",
  fields  : "quests",
  zone    : "exodar",
  preffix : "https://eu.api.battle.net/wow/character"
};
const kQuestDialogBoxId = "e94fcc506861099988dd8eb80f97a9";

var questConfig = {};

var emptyObject = function(obj) {
  return (obj === undefined) || (obj === null) || ((Object.keys(obj).length === 0) && (obj.constructor === Object));
}

/* Checks if the data is already saved and save it. */
var checkLocalStorage = function(onFinish) {
  chrome.storage.local.get(kDataName, function(items) {
    var save = {};
    save[kDataName] = {};
    save[kDefaultDataName] = kDefaultQuestConfig;

    if (emptyObject(items)) {
      // Data was not saved

      for (var i in kDefaultQuestConfig) {
        questConfig[i] = save[kDataName][i] = kDefaultQuestConfig[i];
      }
    } else {
      // Data was saved
      for (var i in items[kDataName]) {
        questConfig[i] = save[kDataName][i] = items[kDataName][i];
      }
    }

    // Save data
    chrome.storage.local.set(save);
    if (typeof(onFinish) === "function") {
      onFinish();
    }
  });

  chrome.storage.local.set(questConfig);
}

/* Get the url with the quests done for a character name. */
var generateUrl = function(name) {
  var base = questConfig.preffix + "/" + questConfig.zone + "/" + name + "?";
  if (questConfig.fields) { base += "&fields=" + questConfig.fields; }
  if (questConfig.apiKey) { base += "&apikey=" + questConfig.apiKey; }
  return base;
}

/* Http Get request. */
var httpGet = function(url) {
  var xmlHttp = new XMLHttpRequest();
  xmlHttp.open( "GET", url, false );
  xmlHttp.send( null );
  return xmlHttp.responseText;
}

/* Checks if a quest is completed for a character name. */
var searchQuestInName = function(quest, name) {

  var response = httpGet(generateUrl(name));

  if (!response) {
    return {
      name: name,
      found: false,
      error: true,
      message: "No response"
    };
  }

  var data    = JSON.parse(response);
  var error   = (data.status === "nok") || (data.code !== undefined);
  var found   = (error) ? false : (data.quests.indexOf(quest) !== -1);
  var message = (error)                                       ?
                (data.reason ? data.reason : data.detail)     :
                (found       ? "Completed" : "Not completed") ;

  return {
    name: name,
    found: found,
    error: error,
    message: message
  };
}

/* Searchs if the quest in the url is completed for any of the characters. */
var searchQuest = function(info, tab) {
  var quest = info.linkUrl.match(/(?:\/quest=)(\d+)/);

  var parameters = {
    id: kQuestDialogBoxId
  };
  // Remove previous dialog box
  chrome.tabs.executeScript({
    code: '(' + function(params) {
      try {
        document.getElementById(params.id).outerHTML="";
      } catch (e) {};
    } + ')(' + JSON.stringify(parameters) + ');'
  });

  if (!quest || !quest[1]) {
    alert("No quest found");
    return;
  }
  if (questConfig.names.length <= 0) {
    alert("No character names");
    return;
  }
  if (!questConfig.apiKey) {
    alert("No api key");
    return;
  }

  // Generate dialog box
  parameters.names = questConfig.names;
  chrome.tabs.executeScript({
    code: '(' + function(params) {
      var table = "<table id='" + params.id + "-table'>";
      for (var i in params.names) {
        table += "<tr>";
        table += "<td class='" + params.id + "-names'>" + params.names[i] + "</td>";
        table += "<td id='" + params.id + "-" + params.names[i] + "'>" + "</td>";
        table += "</tr>";
      }
      table += "</table>";

      document.body.insertAdjacentHTML('beforeend',
        `
        <style>
        #${params.id} {
          all: unset;
          position: fixed;
          width: 400px;
          height: 350px;
          left: calc(50% -150px);
          top: calc(50% -125px);
          z-index: 1000;
          border-radius: 5px;
          background-color: rgba(255, 255, 255, 0.96);
          color: #222;
          overflow-y: auto;
          font-weight: 700;
          font-family: Arial, Helvetica, sans-serif;
        }
        .${params.id}-names {
          text-transform: capitalize;
          width: 30%;
        }
        #${params.id}-table {
          margin-top: 20px;
          margin-left: 25px;
          margin-right: 25px;
          width: 350px;
        }
        #${params.id}-table td {
          height: 50px;
        }
        .${params.id}-found {
          color: green;
        }
        .${params.id}-notfound {
          color: orange;
        }
        .${params.id}-error {
          color: red;
        }
        </style>
        <div id="${params.id}" style="left: calc(50% - 150px); top: calc(50% - 125px);">
          <img align="right"; style="width: 15px; height: 15px; margin: 10px; cursor: pointer;" onclick="document.getElementById('${params.id}').outerHTML='';" src="data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTguMS4xLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iQ2FwYV8xIiB4PSIwcHgiIHk9IjBweCIgdmlld0JveD0iMCAwIDIxMi45ODIgMjEyLjk4MiIgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgMjEyLjk4MiAyMTIuOTgyOyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSIgd2lkdGg9IjY0cHgiIGhlaWdodD0iNjRweCI+CjxnIGlkPSJDbG9zZSI+Cgk8cGF0aCBzdHlsZT0iZmlsbC1ydWxlOmV2ZW5vZGQ7Y2xpcC1ydWxlOmV2ZW5vZGQ7IiBkPSJNMTMxLjgwNCwxMDYuNDkxbDc1LjkzNi03NS45MzZjNi45OS02Ljk5LDYuOTktMTguMzIzLDAtMjUuMzEyICAgYy02Ljk5LTYuOTktMTguMzIyLTYuOTktMjUuMzEyLDBsLTc1LjkzNyw3NS45MzdMMzAuNTU0LDUuMjQyYy02Ljk5LTYuOTktMTguMzIyLTYuOTktMjUuMzEyLDBjLTYuOTg5LDYuOTktNi45ODksMTguMzIzLDAsMjUuMzEyICAgbDc1LjkzNyw3NS45MzZMNS4yNDIsMTgyLjQyN2MtNi45ODksNi45OS02Ljk4OSwxOC4zMjMsMCwyNS4zMTJjNi45OSw2Ljk5LDE4LjMyMiw2Ljk5LDI1LjMxMiwwbDc1LjkzNy03NS45MzdsNzUuOTM3LDc1LjkzNyAgIGM2Ljk4OSw2Ljk5LDE4LjMyMiw2Ljk5LDI1LjMxMiwwYzYuOTktNi45OSw2Ljk5LTE4LjMyMiwwLTI1LjMxMkwxMzEuODA0LDEwNi40OTF6IiBmaWxsPSIjYWJhYmFiIi8+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPC9zdmc+Cg==" />
          ${table}
        </div>
        `
      );

    } + ')(' + JSON.stringify(parameters) + ');'
  });

  // Search and update dialog box for each character
  for (var i in questConfig.names) {
    var result = searchQuestInName(+quest[1], questConfig.names[i]);

    parameters.result = result;
    chrome.tabs.executeScript({
      code: '(' + function(params) {
        var element = document.getElementById(params.id + "-" + params.result.name);
        element.innerHTML = params.result.message;

        if (params.result.error) {
          element.classList.add(params.id + "-error");
        } else if (params.result.found) {
          element.classList.add(params.id + "-found");
        } else {
          element.classList.add(params.id + "-notfound");
        }

      } + ')(' + JSON.stringify(parameters) + ');'
    });
  }
}

var searchQuestAndCheckStorage = function(info, tab) {
  checkLocalStorage(function() {
    searchQuest(info, tab);
  });
}

chrome.contextMenus.create({
  title: "WoW quest done?",
  contexts: ["link"],
  onclick: searchQuestAndCheckStorage
});

chrome.windows.onCreated.addListener(checkLocalStorage);
chrome.runtime.onInstalled.addListener(checkLocalStorage);
