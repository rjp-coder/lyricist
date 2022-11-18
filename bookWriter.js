const browser = require('./browser');
const cheerio = require('cheerio');
const read = require('./fileIO.js');
const config = require('./config/default.json');
const log = require('./logger.js');
const utils = require('./utils');

const clickAndWaitForNavigation =  async function(page, selector){
  console.assert(page && selector);
  const res = await Promise.all([
    page.waitForNavigation(),
    page.click(selector),
  ]);

  return res
}
  

//Ensure logged in
const NOT_SAVING = `document.querySelectorAll(".saving_indicator.saving").length==0`

function bookWriter() {
  //goto books
  let reedsy = "https://reedsy.com/#/books";
  let reedsyLoginUrl = "https://auth.reedsy.com/sign_in/?ca_name=Editor"
  let reqTimeout = 120000;

  let bookTitle = config.bookTitle || "Song Book"; //FIXME if bookTitle is not new, program will append to the second newest book


  async function writeBook(songList) {
    let url = encodeURI(reedsyLoginUrl);
    log.setPath('./outputs/bookWriterLog.log');
    const page = await browser.newPage();
    await page.setViewport({
      width: 1200,
      height: 800
    });
    console.log("Navigating to " + url);
    await page.goto(url, { waitUntil: 'load', timeout: reqTimeout });
    console.log("Arrived at " + url);
    let html = await page.content();
    console.log("Got content and logging in ");
    try {
      await logIn(page);
    } catch (err) { log.log(err); console.log("Could not log in. aborting program"); return; }
    console.log("logged in.");
   console.log("Awaiting a redirect from website in case already logged in");
   //check for a redirect from the website
   const REDIRECT_BUTTON = "[href='https://reedsy.com/auth/one_tap_sign_in']";
   try {
     
     await page.waitForSelector(REDIRECT_BUTTON,{timeout:10000});
     console.log("Was redirected, clicking website's 'continue' button.");
     await page.click(REDIRECT_BUTTON)
     
    } catch (timeoutErr){
      console.log("There was no redirect")
    }
   url = reedsy;
    console.log("Now going to books.")
    await page.goto(url, { waitUntil: 'load', timeout: reqTimeout });
    console.log("Gone to books");
    html = await page.content();
    let $ = cheerio.load(html);
    //$("a[href*='reedsy.com/books/']").length;
    await submitNewBookTitle(bookTitle, page);
    console.log("submitted new bookTitle");
    //wait for new book to appear 
    await page.waitForFunction(`document.querySelector("body").innerText.includes("${bookTitle}")`);
    //grab new book
    console.log("waited for new elem, and it appeared.");
    html = await page.content();
    $ = await cheerio.load(html);
    let newBookSelector = '[ng-click="bookService.openBook(book)"]';

    /*according to puppeteer docs, this is the correct pattern for clicking and waiting for navigation*/
    // const [response] = await Promise.all([
    //   page.waitForNavigation(),
    //   page.click(newBookSelector),
    // ]);
    await clickAndWaitForNavigation(page,newBookSelector);
    console.log("Clicked on new book ");
    await page.content();
    await writePart(page, "LYRICS");
    await goToFirstChapter(page);
    await writeChapters(page, songList, "LYRICS");
    console.log("finished writing lyrics, now writing tabs");
    await writePart(page, "TABS");
    createChapter(page);
    await writeChapters(page, songList, "TAB");
    console.log("done");
    await publishBook(page, browser).catch(err => console.log(err));
    console.log("book published");
  }

  async function writeChapters(page, songList, chapterType) {
    for (let i = 0; i < songList.length; i++) {
      let song = songList[i].title;
      let artist = songList[i].artist;
      let type = chapterType == "LYRICS" ? "lyrics" : config.tabType || "chords";
      let data = null;
      try {
        let fname = utils.getPathToSongs()+utils.getFilenameFromSongArtistAndType(song,artist,type)
        data = await read.read(fname);
        console.log("loaded song");
      } catch (err) {
        log.log("Problem loading " + song);
        log.log(err);
        continue;
      }
      try {
        //let html = await page.content();
        //let $ = await cheerio.load(html);
        await page.waitForFunction(NOT_SAVING);
        console.log("Inserting title ", titleCase(song));
        await insertChapterTitle(titleCase(song), page);
        console.log("Inserting chapter contents");
        await page.waitForFunction(NOT_SAVING);
        await insertChapterContents(data, page);
        await page.waitForTimeout(3000);
        await page.waitForFunction(NOT_SAVING)
        let isLastChapter = i == songList.length - 1;
        if (!isLastChapter) {
          createChapter(page);
        }
      } catch (err) { 
        console.log(err);
        continue;
      }
      console.log("next book");
    }
  }

  async function createChapter(page){
    const CREATE_CHAPTER = "[test='add-chapter']";
    const CHAPTER_NAME_INPUT = '[data-placeholder^="Chapter"] p';
    await page.click(CREATE_CHAPTER);
    await page.waitForSelector(CHAPTER_NAME_INPUT);
    await page.waitForTimeout(3000);
  }

  async function goToFirstChapter(page) {
    // await page.click("[href*=chapter]");
    // await page.waitForNavigation();
    await clickAndWaitForNavigation(page,'[href*=chapter]');
  }

  async function writePart(page, part) {
    console.log(129);
    const CREATE_PART_BUTTON = "[test='add-part']";
    const PART_NAME_INPUT = '[data-placeholder^="Part"] p';
    console.log(129.5)
    await page.waitForSelector(CREATE_PART_BUTTON);
    console.log(130);
    await page.click(CREATE_PART_BUTTON);
    await page.waitForSelector(PART_NAME_INPUT);
    await page.click(PART_NAME_INPUT);
    await page.keyboard.type(part);
    await page.waitForFunction(NOT_SAVING);
  }

  async function logIn(page) {
    try {
      const EMAIL_SELECTOR = "input[placeholder*='email'],input[placeholder*='Email']";
      const email = config.reedsy.email;
      const PASSWORD_SELECTOR = "input[placeholder*='Password'],input[placeholder*='password']";
      const password = config.reedsy.password;
      await page.click(EMAIL_SELECTOR);
      await page.keyboard.type(email);
      await page.click(PASSWORD_SELECTOR);
      await page.keyboard.type(password);
      await page.click("input[type='submit'],button[type='submit']");
      await page.waitForNavigation();
    } catch (err) {
      console.log(err);
    }
  }

  //wait for page load
  async function insertChapterTitle(chapterTitle, page) {
    try {
      let chapterElem = '[data-placeholder^="Chapter"] p';
      await page.waitForTimeout(200);
      await page.waitForSelector(chapterElem);
      await page.click(chapterElem)
      await page.keyboard.type(chapterTitle);
    } catch (err) {
      throw err;
    }
  }

  async function insertChapterContents(chapterContent, page) {
    try {
      let chapterContentElem = "div.ql-editor";
      await page.waitForSelector(chapterContentElem);
      await page.evaluate(({ chapterContent, chapterContentElem }) => {
        document.querySelector(chapterContentElem).innerText = chapterContent;
      }, { chapterContent, chapterContentElem });
    } catch (err) { console.log("ERR!!", err); throw err; }
  }

  async function submitNewBookTitle(bookTitle, page) {
    console.log("submitting ", bookTitle)
    const NEW_BOOK_SELECTOR = "input[placeholder^='Enter a new book']"
    const CREATE_BOOK_SELECTOR = "button.hidden-until-sm[type='submit']";
    await page.click(NEW_BOOK_SELECTOR);
    await page.keyboard.type(bookTitle);
    await page.click(CREATE_BOOK_SELECTOR);

    console.log("created");
  }

  function titleCase(str) {
    str = str.toLowerCase().split(' ');
    let final = [];
    for (let word of str) {
      final.push(word.charAt(0).toUpperCase() + word.slice(1));
    }
    return final.join(' ');
  }

  function getLatestBook($, name) {
    let newBookIndex = $("h4:contains('" + name + "'):not(.hidden-until-sm)").toArray()
      .map(function (a) { return Number($(a).text().replace(/[^0-9]/g, '')) })
      .reduce(function (sum, val) { return val > sum ? val : sum });
    let latestBook = $("h4:contains('" + name + " (" + newBookIndex + ")'):not(.hidden-until-sm)");
    return latestBook;
  }

  async function publishBook(page, browser) {
    try {
      await page.click('.export-widget');
      const newPage = await browser.linkToNewPage();
      await newPage.waitForSelector("button[type='submit']");
      await newPage.click("button[type='submit']");
    } catch (err) {
      console.log(err);
    }
  }

  return {writeBook}

}

module.exports = bookWriter();