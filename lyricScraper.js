function lyricScraper() {

  const $ = require('cheerio');

  function scrapeTitle(rootElem) {
    let elem = $(rootElem).find("h1");
    return elem.text();
  }

  function scrapeWords(rootElem) {
    let e = $(rootElem).find("section>p");
    let h = e.html();
    let s = h.replace(/<br>/gi, '<p>LINEBREAK</p>');
    console.log("REPLACEY STUFF");
    e.html(s);
    //console.log("DONE",e.html());
    let t = e.text().replace(/LINEBREAK/g, "\n");
    return t;
  }

  function scrape(rootElem) {
    return scrapeTitle(rootElem) + "\n" + scrapeWords(rootElem);
  }

  return { scrape }

}

module.exports = lyricScraper()