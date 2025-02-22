const cheerio = require("cheerio");
const fs = require("node:fs");

const { exec } = require("child_process");

const searchStr = "initSpacemapViewer";
const starjson = __dirname + "/stars.json";
let hadStars = 0;
let newStars;

try {
  hadStars = JSON.parse(fs.readFileSync(starjson, "utf8")).stars.users.length;
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
  cheerio.fromURL("https://factorio.com/galaxy").then((res) => {
    let html = res("script:contains('" + searchStr + "')")[0].children[0].data;
    const offsetStart = html.indexOf(searchStr + "(") + (searchStr.length + 1);
    const offsetStop = html.indexOf(")});");
    html = JSON.parse(html.substr(offsetStart, offsetStop - offsetStart).trim());
    console.log("Old", hadStars, "star count.");
    console.log("New", html.stars.users.length, "star count.");
    const diff = html.stars.users.length - hadStars;
    console.log("Difference of", (diff <= 0 ? "" : "+") + diff, "stars.");
    html._credo = {};
    html._credo.lastUpdate = new Date().getTime();
    html._credo.diff = diff;
    fs.writeFileSync(starjson, JSON.stringify(html));
    if (diff !== 0) {
      newStars = html;
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
  exec("git commit -m 'Updating stars.json with a change of " + newStars._credo.diff + " stars.'", (err, stdout, stderr) => {
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
