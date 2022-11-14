function lyricScraper() {

  function scrapeWords(rootElem) {
    console.log("Scraping words");
    console.log(rootElem);
    let e = (rootElem).find("[class*='Lyrics__Container']");
    let h = e.html();
    let s = h.replace(/<br>/gi, '<p>LINEBREAK</p>');
    console.log("REPLACEY STUFF");
    e.html(s);
    //console.log("DONE",e.html());
    let t = e.text().replace(/LINEBREAK/g, "\n");
    return t;
  }

  function scrape(rootElem) {
    return scrapeWords(rootElem);
  }

  return { scrape }

}

module.exports = lyricScraper()