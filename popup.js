const kDataName = "Configuration";
const kDefaultDataName = "DefaultConfiguration";

var emptyObject = function(obj) {
  return (obj === undefined) || (obj === null) || ((Object.keys(obj).length === 0) && (obj.constructor === Object));
}

/* Load the data from the chrome local storage into the input tags. */
var loadData = function() {
  chrome.storage.local.get(kDataName, function(items) {
    if (!emptyObject(items)) {
      for (var i in items[kDataName]) {
        document.getElementById(i).value = items[kDataName][i];
      }
    }
  });
}

/* Save the data to the chrome local storage from the input tags. */
var saveData = function() {
  var save = {};
  save[kDataName] = {};

  // Get
  save[kDataName]["names"]   = document.getElementById("names").value.split(",");
  save[kDataName]["apiKey"]  = document.getElementById("apiKey").value;
  save[kDataName]["fields"]  = document.getElementById("fields").value;
  save[kDataName]["zone"]    = document.getElementById("zone").value;
  save[kDataName]["preffix"] = document.getElementById("preffix").value;

  // Save
  chrome.storage.local.set(save);

  // Current data is saved
  document.getElementById("save-msg").classList.add("saved");
  document.getElementById("save-msg").classList.remove("unsaved");
}

/* Load the default data from the chrome local storage into the input tags. */
var setDefaults = function() {
  chrome.storage.local.get(kDefaultDataName, function(items) {
    if (!emptyObject(items)) {
      for (var i in items[kDefaultDataName]) {
        document.getElementById(i).value = items[kDefaultDataName][i];
      }
    }
  });
  // Current data is not saved
  document.getElementById("save-msg").classList.remove("saved");
  document.getElementById("save-msg").classList.add("unsaved");
}

/* Load the data and add the event listeners. */
var main = function() {
  loadData();
  document.getElementById("save-button").addEventListener("click", saveData);
  document.getElementById("default-button").addEventListener("click", setDefaults);

  var inputs = ["names", "apiKey", "fields", "zone", "preffix"];
  for (var i in inputs) {
    var element = document.getElementById(inputs[i]);
    var saveMessage = document.getElementById("save-msg");
    var unsave = function() {
      // Current data is not saved
      saveMessage.classList.add("unsaved");
      saveMessage.classList.add("saved");
    };
    element.addEventListener("change",  unsave);
    element.addEventListener("keydown", unsave);
    element.addEventListener("keyup",   unsave);
  }
;}

main();
