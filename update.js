const cheerio = require("cheerio");
const fs = require("node:fs");

const { exec } = require("child_process");

const starjson = __dirname + "/stars.json";
let oldStars = 0;
let newStars = 0;

try {
  oldStars = JSON.parse(fs.readFileSync(starjson, "utf8")).stars.users.length;
} catch (err) {
  console.log("Failed to load previous stars.json");
}

let steps = [gitpull, fetchstars, gitadd, gitcommit, gitpush];

loop(); //Kick off the steps.
function loop() {
  if (steps.length > 0) {
    const next = steps.shift();
    next();
  }
}

function gitpull() {
  exec("git pull", (err, stdout, stderr) => {
    if (err) {
      // node couldn't execute the command
      return;
    }
    loop();
  });
}

function fetchstars() {
  const searchStr = "initSpacemapViewer";
  cheerio.fromURL("https://factorio.com/galaxy").then((res) => {
    let html = res("script:contains('" + searchStr + "')")[0].children[0].data;
    const offsetStart = html.indexOf(searchStr + "(") + (searchStr.length + 1);
    const offsetStop = html.indexOf(")});");
    html = JSON.parse(html.substr(offsetStart, offsetStop - offsetStart).trim());
    console.log("Old", oldStars, "star count.");
    console.log("New", html.stars.users.length, "star count.");
    const diff = html.stars.users.length - oldStars;
    console.log("Difference of", (diff <= 0 ? "" : "+") + diff, "stars.");
    html._credo = {};
    html._credo.lastUpdate = new Date().getTime();
    html._credo.diff = diff;
    if (diff !== 0) {
      fs.writeFileSync(starjson, JSON.stringify(html));
      newStars = html._credo.diff;
      loop();
    }
  });
}

function gitadd() {
  exec("git add stars.json", (err, stdout, stderr) => {
    if (err) {
      // node couldn't execute the command
      return;
    }
    loop();
  });
}

function gitcommit() {
  exec("git commit -m 'Updating stars.json with a change of " + newStars + " stars.'", (err, stdout, stderr) => {
    if (err) {
      // node couldn't execute the command
      return;
    }
    loop();
  });
}

function gitpush() {
  exec("git push", (err, stdout, stderr) => {
    if (err) {
      // node couldn't execute the command
      return;
    }
    loop();
  });
}
