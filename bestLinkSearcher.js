const filledStarColour = "#FF5D55";

const cheerio = require('cheerio');

function bestLinkSearcher() {

  async function getBestLink(headElement, html, type = "tab") {
    try {
      let $ = await cheerio.load(html);
      if (!headElement) {
        console.log("NO ROOT ELEMENT PASSED IN! ");
        headElement = $("body>div");
      }
      var arr = $(headElement).children().toArray();
      //remove header div
      arr.shift(); 
      if (arr.length < 3) console.log((arr[0]));
      console.log("Number of children of root elem passed in", " ", arr.length);
      let tabs = arr.filter(function (e) {
        //for now, assumed that its not possible for two artists to make the same song.
        let isArtist = true; 
        let children = $(e).children();
        //identify tabs that are just guitar solos
        let isSolo = ~$(children[1]).text().toLowerCase().indexOf("solo");
        let isTab = $(children[3]).text().toLowerCase() == type; //cheerio
        let hasRating = $(children[2]).find("div span").length > 0;
        return isArtist && isTab && hasRating && !isSolo; 

      });
      let sortedTabs = tabs.sort(function (a, b) {
        let bb = getScore(b);
        let aa = getScore(a);
        return bb - aa;
      });
      let topTab = $(sortedTabs[0]).children()[1];
      let topLink = $(topTab).find("a").attr('href');
      return topLink;
    } catch (err) {
      console.log(err);
    }
  }

  function countStars($,stars) {
    let tot = 0;
    //#444-empty star, //#FF5D55 full star
    //svg with two paths is a half full star
    for (let i = 0; i < stars.length; i++) {
      let a = stars[i];
      var isHalfStar = $(a).find("path").length == 2;
      if (isHalfStar) { tot += 0.5; continue; }
      let isFullStar = $(a).children().children().first().attr("fill") == filledStarColour;
      if (isFullStar) tot++;
    }
    return tot;
  }

  function getScore(listItem) {
    let $=cheerio;
    let data = $($(listItem).children()[2]).children().children();
    let stars = countStars($,$($(data).first().children()).toArray());
    let votes = data[1].children[0].data;
    let score = Math.pow(stars, 3) * +votes;
    return score;
  }
  return { getBestLink };
}

module.exports = bestLinkSearcher();

