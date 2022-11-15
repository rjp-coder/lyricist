const browser = require('./browser.js');
const cheerio = require('cheerio');
const scraper = require('./lyricScraper.js');
const config = require('./config/default.json');
const io = require('./fileIO.js');
const utils = require('./utils.js');
const { getFilenameFromSongArtistAndType } = require('./utils.js');


let url = 'https://genius.com/search?q=';
const reqTime = 10000;

function lyricsSeeker() {

  const log = require('./logger');

  async function get(list) {    
    log.setPath('./outputs/failedSongs_lyrics.log');
    const page = await browser.newPage();
    let failedWrites = [];
    for (let item of list) {
      let {title,artist} = item;
      let fullUrl =  utils.getGeniusUrlFromSongAndArtist(title,artist);;
      if (config.skipExisting && await io.fileExists(utils.getPathToSongs()+utils.getFilenameFromSongArtistAndType(title,artist,"lyrics"))) {
        console.log("song ", convertToFilename(item.title), "already exists! Skipping");
        continue;
      }
      await go(fullUrl, page).catch(err => console.error(err));
      await page.waitForSelector('h1').catch(err => console.error(err));
      let html = await page.content().catch(err => { console.error(err); return null });
      console.log("got html");
      let $ = await cheerio.load(html);
      console.log("cheerio loaded html");
      let words = title+":\n\n" + scraper.scrape($('body'));
      console.log("***\nLYRICS:" + words.slice(0, 150) + "...\n***");
      words = words.replace(/\n/g, "\r\n"); //make line breaks windows friendly
      let fname = getFilenameFromSongArtistAndType(title,artist,"lyrics");
      await io.write(utils.getPathToSongs()+fname, words);
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

  function convertToFilename(name, tab) {
    return "./outputs/lyrics/" + name  + ".txt";
  }

  return { get };

}

module.exports = lyricsSeeker();