const cheerio = require("cheerio");
const fs = require("node:fs");

const searchStr = "initSpacemapViewer";
const starjson = __dirname + "/stars.json";
let hadStars = 0;
try {
  hadStars = JSON.parse(fs.readFileSync(starjson, "utf8")).stars.users.length;
} catch (err) {
  console.log("Failed to load previous stars.json");
}

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
});
