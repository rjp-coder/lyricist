function tabScraper() {
  const $ = require('cheerio');

  function getTitle(rootElem, songTitle) {
    let elem = (rootElem).find("span,div,p,h1,h2,h3,h4").filter(a => ~$(a).text().toLowerCase().indexOf(songTitle.toLowerCase().substr(0, 5)));
    return elem.text();
  }

  function getTuning(rootElem) {
    let elem = (rootElem).find("span,div,p,h1,h2,h3,h4").filter(a => ~$(a).text().toLowerCase().indexOf("tuning"));
    return elem.text();
  }

  function getTab(rootElem) {
    let elem = (rootElem).find("code");
    return elem.text();
  }

  function getRootElem($, fullSong) {
    console.log("fullSong is ", fullSong);
    console.log("article is: ", $("article").length);
    let infoElem = $("article").toArray().filter(function (a) {
      let text = $(a).text().toLowerCase();
      let fullSongLowerCase = fullSong.substr(0, 5).toLowerCase();
      let index = text.indexOf(fullSongLowerCase);
      return ~index;
    });
    return infoElem;
  }

  function scrape(rootElem, songTitle) {
    if (!rootElem.toArray) { console.error("Root element passed in to scraper is not a cheerio object"); return; }
    let out = getTitle(rootElem, songTitle) + "\n";
    out += getTuning(rootElem) + "\n";
    out += getTab(rootElem) + "\n";
    return out;
  }

  return { scrape, getRootElem, getTitle }

}

module.exports = tabScraper()