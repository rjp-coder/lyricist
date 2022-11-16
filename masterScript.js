const browser = require('./browser.js');

//load dependencies
const tabSeeker = require('./tabSeeker.js');
const lyricsSeeker = require('./lyricsSeeker.js');
const bookWriter = require('./bookWriter.js');
const io = require('./fileIO.js');

(async function () {

  let list = await io.readCsv('./resources/songlist.csv');
  list = list.filter(i => i.hasOwnProperty("title"));
  for (let item of list) {
    if (!item.hasOwnProperty("artist")) {
      item.artist = "";
    }
    item.title=item.title.trim();
    item.artist = item.artist.trim();
  }

  async function parallel() {
    const task1 = lyricsSeeker.get(list);
    const task2 = tabSeeker.get(list);

    return {
      result1: await task1,
      result2: await task2
    }
  }

  await browser.getInstance();
  await parallel();
  //could use the corrections map here to fix the song titles 
  await bookWriter.writeBook(list);

})();