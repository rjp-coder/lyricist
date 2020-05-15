const browser = require('./browser.js');
const cheerio = require('cheerio');
const scraper = require('./lyricScraper.js');
const config = require('./config/default.json');
const io = require('./fileIO.js');


let url = 'https://genius.com/search?q=';
const reqTime = 10000;

function lyricsSeeker() {

  const log = require('./logger');

  async function get(list) {    
    log.setPath('./outputs/failedSongs_lyrics.log');
    const page = await browser.newPage();
    let failedWrites = [];
    //url = encodeURI(url);
    for (let item of list) {
      let title = item.title;
      let artist = item.artist;
      let fullTitle = title + (artist ? " " + artist : "");
      let fullTitleUrl = encodeURI(url + fullTitle);
      if (config.skipExisting && await io.fileExists(convertToFilename(fullTitle))) {
        console.log("song ", convertToFilename(item.title), "already exists! Skipping");
        continue;
      }
      let link = await getLinkForSong(fullTitleUrl, page);
      if (!link) {
        console.log("no links found for this song, skipping: ", fullTitle);
        // let l = await getAllLinks(page);
        // console.log("possible links: ", l.join("\n\t*"));
        failedWrites.push("Could not find song " + fullTitle);
        continue;
      }
      console.log("url for song lyrics is ", link);
      await go(link, page).catch(err => console.error(err));
      await page.waitForSelector('section>p').catch(err => console.error(err));
      await page.waitForSelector('h1').catch(err => console.error(err));
      let html = await page.content().catch(err => { console.error(err); return null });
      console.log("got html");
      let $ = await cheerio.load(html);
      console.log("cheerio loaded html");
      let words = scraper.scrape($('body'));
      console.log("***\nLYRICS:" + words.slice(0, 150) + "...\n***");
      words = words.replace(/\n/g, "\r\n"); //make line breaks windows friendly
      let fname = convertToFilename(fullTitle);
      await io.write(fname, words);
      console.log("NEXT SONG");
    }
    if (failedWrites.length)
      log.log(failedWrites.join("\r\n"));;
    console.log("Finished scraping lyrics");
    return true;
  }

  async function go(url, page, count = 1) {
    console.log("GO! (" + count + "): ", url);
    if (count == 4) { console.log("giving up, could not load page"); return page; }
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: reqTime });
      return page;
    } catch (err) {
      console.log(err.name);
      await go(url, page, ++count);
    }
  }

  async function getAllLinks(page) {
    let html = await page.content();
    let $ = await cheerio.load(html);
    let arr = $("a").toArray();
    console.log("SC this time: ", $("mini-song-card").length);
    return arr.map(function (a) { return a.attribs.href });

  }

  function convertToFilename(name, tab) {
    return "./lyrics/" + name + "_lyrics" + ".txt";
  }

  async function getLinkForSong(fullTitle, page) {
    try {
      await go(fullTitle, page);
      console.log("Reached " + fullTitle);
      await page.waitForSelector('mini-song-card');
      console.log("Song cards appeared")
      let html = await page.content();
      console.log(html.length);
      let $ = await cheerio.load(html);
      try {
        //ignore page's "top result"
        let link = $("div.search_results_label")
          .filter(function () { return $(this).text() == "Songs" })
          .next().find("a").first().attr("href");
        if (!link) console.log("selRes: " + $("div.search_results_label").length + "SC: " + $('mini-song-card').length);
        return link;
      } catch (err) {
        console.log(err.name);
      }
    } catch (err) {
      console.log(err);
    }
  }
  return { get };

}

module.exports = lyricsSeeker();