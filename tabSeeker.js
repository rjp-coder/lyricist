const browser = require('./browser.js');
const cheerio = require('cheerio');
const judge = require('./bestLinkSearcher.js');
const scrape = require('./tabScraper.js');
const io = require('./fileIO.js');
const config = require('./config/default.json');
const utils = require('./utils.js');

const reqTime = 30000;

function tabSeeker() {

  async function get(list) {
    const SKIP_EXISTING_SONGS = config.skipExisting;
    const log = require('./logger.js');
    log.setPath('./outputs/failedSongs.log');
    try {
      let typoMapContents = await io.readCsv('./outputs/corrections.csv');
      let typoMap = new Map(io.convert(typoMapContents));
      let originalTypoMapSize = typoMap.size;
      let failedWrites = [];
      let tabType = config.tabType;
      let url = 'https://www.ultimate-guitar.com/search.php?search_type=title&value=';
      const page = await browser.newPage();
      url = encodeURI(url);
      for (let item of list) {
        let fullSong = item.title + " " + item.artist;
        let fullSongUrl = encodeURI(fullSong);
        let fullPath = utils.getPathToSongs()+utils.getFilenameFromSongArtistAndType(item.title,item.artist,tabType);
        if (config.skipExisting && await io.fileExists(fullPath)) {
          console.log("song ", fullPath, "already exists! Skipping");
          continue;
        }
        console.log("Navigating to " + url + fullSongUrl);
        await go(url + fullSong, page);
        console.log("Reached " + url + fullSongUrl);
        let fail = false;
        await page.waitForTimeout("section article div").catch(err => { console.log(err), fail = true; })
        if (fail) { failedWrites.push("There were no results at all for:" + fullSong); continue };
        let html = await page.content();
        let $ = await cheerio.load(html);
        console.log("about to get link for tab");
        let rootElement = "section article div";
        let link = await judge.getBestLink(rootElement, page, tabType);
        console.log("finding best link for " + fullSong + " with type " + tabType);
        if (!link) {
          let msg = "No link found for " + fullSong + " of type " + tabType + ". skipped song.";
          failedWrites.push(msg);
          console.log(msg);
          continue;
        }
        console.log("Navigating to link ...");
        await go(link, page,null,{waitUntil:"networkidle2"});
        console.log("Reached " + link);
        await page.waitForTimeout("code").catch((error) => { console.error(error) });
        await page.waitForTimeout("pre").catch((error) => { console.error(error) });
        html = await page.content();        
        $ = await cheerio.load(html);
        console.log("ARR LEN: ", $("article").toArray().length);
        let infoElem = scrape.getRootElem($, item.title);
        // console.log("infoElem");
        // console.log(infoElem);
        let newSongTitle = scrape.getTitle($(infoElem), item.title);
        if (!newSongTitle) {
          console.error("could not get actual title of misspelled song");
          newSongTitle = fullSong;}
        // } else {
        //   newSongTitle = newSongTitle + item.artist;
        //   if (newSongTitle && (newSongTitle.toLowerCase() !== fullSong)) {
        //     typoMap = handleTypoSong(typoMap, fullSong, newSongTitle);
        //     fullSong = newSongTitle; // use the corrected song name for file write.
        //   }
        // }
        if (infoElem.length > 1) {
          console.warn("There is more than one element containing the song title! Selecting the first one.");
          infoElem = [...infoElem][0];
        }
        if (infoElem.length == 0) {
          console.error("There is no element containing the song title!");
          failedWrites.push(newSongTitle + " could not be found on the website.");
        };
        let tab = scrape.scrape($(infoElem), fullSong);
        tab = tab.replace(/\n/g, "\r\n"); //windows friendly
        console.log("OUT:" + tab.slice(0, 200));
        let fname = utils.getFilenameFromSongArtistAndType(item.title,item.artist,tabType);
        await io.write(utils.getPathToSongs()+fname, tab);
      }
      if (typoMap.size > originalTypoMapSize)
        io.writeCsv('./outputs/corrections.csv');
      if (failedWrites.length)
        log.log(failedWrites.join("\r\n"));
    } catch (err) {
      console.log(err);
    }
    console.log("Finished gathering tabs");
    return true;
  }

  //OPTIONAL block css and various ads on sites to improve performance. 
  //OPTIONAL format tabs for better display on kindle
  //OPTIONAL set up an automated e-mail program which accepts a csv and creates the book, sending it to the provided email address
  //OPTIONAL add small info for the foreword, and part paragraphs.
  //OPTIONAL investigate refactoring for the access readsy book and the lyric scraper. 

  function handleTypoSong(typoMap, typoSong, realSong) {
    console.log("Wrong song is " + typoSong);
    console.log("Right song is " + realSong);
    typoMap.set(typoSong, realSong);
    return typoMap;
  }

  async function go(url, page, count = 1,options) {
    console.log("GO! (" + count + "): ", url);
    if (count == 2) { console.log("giving up, could not load page"); return page; }
    try {
      await page.goto(url, options || { waitUntil: 'domcontentloaded', timeout: reqTime });
      return page;
    } catch (err) {
      console.log(err.name);
      await go(url, page, ++count);
    }
  }

  return { get }

}

module.exports = tabSeeker();