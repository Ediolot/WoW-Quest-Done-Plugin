const kDataName = "Configuration";
const kDefaultDataName = "DefaultConfiguration";

var emptyObject = function(obj) {
  return (obj === undefined) || (obj === null) || ((Object.keys(obj).length === 0) && (obj.constructor === Object));
}

var loadData = function() {
  chrome.storage.local.get(kDataName, function(items) {
    if (!emptyObject(items)) {
      for (var i in items[kDataName]) {
        document.getElementById(i).value = items[kDataName][i];
      }
    }
  });
}

var saveData = function() {
  var save = {};
  save[kDataName] = {};

  save[kDataName]["names"]   = document.getElementById("names").value.split(",");
  save[kDataName]["apiKey"]  = document.getElementById("apiKey").value;
  save[kDataName]["fields"]  = document.getElementById("fields").value;
  save[kDataName]["zone"]    = document.getElementById("zone").value;
  save[kDataName]["preffix"] = document.getElementById("preffix").value;
  // Guarda los valores
  chrome.storage.local.set(save);
  document.getElementById("save-msg").classList.add("saved");
  document.getElementById("save-msg").classList.remove("unsaved");
}

var setDefaults = function() {
  chrome.storage.local.get(kDefaultDataName, function(items) {
    if (!emptyObject(items)) {
      for (var i in items[kDefaultDataName]) {
        document.getElementById(i).value = items[kDefaultDataName][i];
      }
    }
  });
  document.getElementById("save-msg").classList.remove("saved");
  document.getElementById("save-msg").classList.add("unsaved");
}

var main = function() {
  loadData();
  document.getElementById("save-button").addEventListener("click", saveData);
  document.getElementById("default-button").addEventListener("click", setDefaults);

  var inputs = ["names", "apiKey", "fields", "zone", "preffix"];
  for (var i in inputs) {
    var element = document.getElementById(inputs[i]);
    var saveMessage = document.getElementById("save-msg");
    var hideElement = function() { saveMessage.classList.add("unsaved"); saveMessage.classList.add("saved"); };
    element.addEventListener("change", hideElement);
    element.addEventListener("keydown", hideElement);
    element.addEventListener("keyup", hideElement);
  }
;}

main();
