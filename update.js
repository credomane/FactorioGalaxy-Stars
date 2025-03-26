const cheerio = require("cheerio");
const fs = require("node:fs");

const { exec } = require("child_process");

const starjson = __dirname + "/stars.opts.json";
let oldStars = 0;
let newStars = 0;
let difStars = 0;
let lastUpdate = new Date(0);
let lastOptsUpdate = 0;

try {
  oldStars = JSON.parse(fs.readFileSync(starjson, "utf8")).starcount;
} catch (err) {
  console.log("Failed to load previous stars.json");
}

let steps = [gitpull, fetchopts, fetchstarpages]; //, gitadd, gitcommit, gitpush];

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

function fetchopts() {
  cheerio.fromURL("https://factorio.com/galaxy").then((res) => {
    const searchStr = "const opts = ";
    let html = res("script:contains('" + searchStr + "')")[0].children[0].data;
    const offsetStart = html.indexOf(searchStr) + searchStr.length;
    const offsetStop = html.indexOf("};") + 1;

    html = JSON.parse(html.substr(offsetStart, offsetStop - offsetStart).trim());
    newStars = html.starcount;
    difStars = newStars - oldStars;
    lastOptsUpdate = html.last_update;
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

async function fetchstarpages() {
  let page = 0;
  let pageResponse = await fetch(`https://factorio.com/galaxy/api/stars/paged/${page}`);
  let pageData = await pageResponse.json();
  let pageSize = pageData.page_size;
  let totalPages = Math.ceil(newStars / pageSize);
  addStars(pageData.stars);
  fs.writeFileSync(`${__dirname}/stars.page-${page}.json`, JSON.stringify(pageData));
  for (let i2 = 1; i2 < totalPages; i2++) {
    console.log(`Loading stars... ${i2 * pageSize}/${newStars}`);
    pageResponse = await fetch(`https://factorio.com/galaxy/api/stars/paged/${i2}`);
    pageData = await pageResponse.json();
    addStars(pageData.stars);
    fs.writeFileSync(`${__dirname}/stars.page-${i2}.json`, JSON.stringify(pageData));

  }
  const lastUpdateInOpts = new Date(lastOptsUpdate);
  if (lastUpdateInOpts > lastUpdate) {
    console.log("downloading recently updated stars");
    pageResponse = await fetch(`https://factorio.com/galaxy/api/stars/since/${lastUpdateInOpts.toISOString()}`);
    pageData = await pageResponse.json();
    addStars(pageData.stars);
    fs.writeFileSync(`${__dirname}/stars.since.json`, JSON.stringify(pageData));
  }
  loop();
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

//Stripped down version from galaxy.js
function addStars(stars) {
  for (let i2 = 0; i2 < stars.ids.length; i2++) {
    const update = new Date(stars.creation_update[i2 * 2 + 1]);
    if (update > lastUpdate) {
      lastUpdate = update;
    }
  }
}
