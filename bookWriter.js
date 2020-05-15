const browser = require('./browser');
const cheerio = require('cheerio');
const read = require('./fileIO.js');
const config = require('./config/default.json');
const log = require('./logger.js');

//Ensure logged in


function bookWriter() {
  //goto books
  let reedsy = "https://reedsy.com/#/books";
  let reedsyLoginUrl = "https://auth.reedsy.com/sign_in/?ca_uuid=4dd1d443-f260-43b4-a26d-33bebfc9a8fe"
  let reqTimeout = 120000;

  let bookTitle = "Song Book"; //FIXME if bookTitle is not new, program will append to the second newest book


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
    console.log("logged in. Now going to Books");
    url = reedsy;
    await page.goto(url, { waitUntil: 'load', timeout: reqTimeout });
    console.log("Gone to books");
    html = await page.content();
    let $ = cheerio.load(html);
    $("a[href*='reedsy.com/books/']").length;
    await submitNewBookTitle(bookTitle, page);
    console.log("submitted new bookTitle");
    //wait for new book to appear 
    await page.waitForFunction(`document.querySelector("body").innerText.includes("${bookTitle}")`);
    //grab new book
    console.log("waited for new elem, and it appeared.");
    //let selector = `a[href*='books']:not(a[href*='settings'])`;
    html = await page.content();
    $ = await cheerio.load(html);
    //get book links --TODO
    //$('a').toArray().filter(function(a){return a.href.includes('books')})
    //let newBook = getLatestBook($,bookTitle).next("div").find("a:contains('Write')");
    let newBook = $("a[href*='reedsy.com/books/']").first();
    //get book links again, and work out the newbie --TODO
    let newBookUrl = newBook.attr('href');
    console.log("url for new book: ", newBookUrl);
    await page.goto(newBookUrl, { waitUntil: 'networkidle0', timeout: reqTimeout });
    console.log("Reached " + newBookUrl);
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
    for (let i = 0; i < songList.length; i++) { //TODO add code to make sections. 
      let song = songList[i].title;
      let artist = songList[i].artist;
      let data = null;
      try {
        let fname = null;
        if (chapterType == "LYRICS") fname = "./lyrics/" + song + " " + artist + "_lyrics.txt";
        if (chapterType == "TAB") fname = "./tabs/" + song + " " + artist + "_tab.txt"
        data = await read.read(fname);
        console.log("loaded song");
      } catch (err) {
        log.log("Problem writing " + song);
        log.log(err);
        continue;
      }
      try {
        let html = await page.content();
        let $ = await cheerio.load(html);
        await page.waitForSelector("span.saved");
        console.log("Inserting title ", titleCase(song));
        await insertChapterTitle(titleCase(song), page);
        console.log("Inserting chapter contents");
        await page.waitForSelector("span.saved");
        await insertChapterContents(data, page);
        await page.waitForSelector("span.saved")
        await page.waitFor(3000);
        let isLastChapter = i == songList.length - 1;
        if (!isLastChapter) {
          createChapter(page);
        }
      } catch (err) { //N.B this will skip timeout errors //fixme
        console.log(err);
        continue;
      }
      console.log("next book");
    }
  }

  async function createChapter(page){
    await page.click("a.create-chapter");
    await page.waitForFunction(`document.querySelectorAll(".menu-group-body")[1].innerText.includes("Chapter")`);
    await page.waitFor(3000);
  }

  async function goToFirstChapter(page) {
    await page.click("li.level-2");
    await page.waitForNavigation();
  }

  async function writePart(page, part) {
    console.log(129);
    await page.waitForSelector("a[ng-click='createPart()']");
    console.log(130);
    await page.click("a[ng-click='createPart()']");
    await page.waitForSelector("input[placeholder^='Part'");
    await page.click("input[placeholder^='Part'");
    await page.keyboard.type(part);
    await page.waitFor(500);
    await page.waitForSelector("span.saved");
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
      let chapterElem = '[placeholder^="Chapter"]';
      await page.waitFor(200);
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
      //        await page.click(chapterContentElem); //FIXME problem is hre
      //        await page.keyboard.type("...!.. ");
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
      await page.click("a[href*='export']");
      const newPage = await browser.linkToNewPage();
      //await newPage.waitForNavigation({ waitUntil: 'networkidle0' });
      await newPage.waitForSelector("button[type='submit']");
      await newPage.click("button[type='submit']");
    } catch (err) {
      console.log(err);
    }
  }

  return {writeBook}

}

module.exports = bookWriter();