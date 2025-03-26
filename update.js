const cheerio = require("cheerio");
const fs = require("node:fs");

const { exec } = require("child_process");

const starjson = __dirname + "/opts.json";
let oldStars = 0;
let newStars = 0;
let difStars = 0;

try {
  oldStars = JSON.parse(fs.readFileSync(starjson, "utf8")).starcount;
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
    const searchStr = "const opts = ";
    let html = res("script:contains('" + searchStr + "')")[0].children[0].data;
    const offsetStart = html.indexOf(searchStr) + searchStr.length;
    const offsetStop = html.indexOf("};") + 1;

    html = JSON.parse(html.substr(offsetStart, offsetStop - offsetStart).trim());
    newStars = html.starcount;
    difStars = newStars - oldStars;
    html._credo = {};
    html._credo.lastUpdate = new Date().getTime();
    html._credo.diff = difStars;

    console.log("Old", oldStars, "star count.");
    console.log("New", newStars, "star count.");
    console.log("Difference of", (difStars <= 0 ? "" : "+") + difStars, "stars.");
    if (difStars !== 0) {
      fs.writeFileSync(starjson, JSON.stringify(html));
      loop();
    }
  });
}

function gitadd() {
  exec("git add opts.json", (err, stdout, stderr) => {
    if (err) {
      // node couldn't execute the command
      return;
    }
    loop();
  });
}

function gitcommit() {
  exec("git commit -m 'Updating opts.json with a change of " + difStars + " stars.'", (err, stdout, stderr) => {
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
