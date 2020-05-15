const filledStarColour = "#FF5D55";

const test = 0; //0=backend webscrape 1=front end test;
var u = require('util'); //purely for inspecting the dom
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
//const $ = require('./jq3.4.1.min.js');

function bestLinkSearcher() {

  async function getBestLink(headElement, html, type = "tab") {
    try {
      let $ = await cheerio.load(html);
      if (!headElement) {
        console.log("NO ROOT ELEMENT PASSED IN! ");
        headElement = $("body>div");
      }
      var arr = $(headElement).children().toArray();
      arr.shift(); //remove header div
      if (arr.length < 3) console.log((arr[0]));
      console.log("Number of children of root elem passed in", " ", arr.length);
      let tabs = arr.filter(function (e, i) {
        let isArtist = true; //you could use the index for this , but what are the odds of same song different artist??
        let children = $(e).children();
        let isSolo = ~$(children[1]).text().toLowerCase().indexOf("solo");
        let isTab = $(children[3]).text().toLowerCase() == type; //cheerio
        let hasRating = $(children[2]).find("div span").length > 0;
        return isArtist && isTab && hasRating && !isSolo; //exclude tabs that are just guitar solos

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
    let votes = data[1].children[0].data //cheerio
    let score = Math.pow(stars, 3) * +votes;
    return score;
  }
  return { getBestLink };
}

module.exports = bestLinkSearcher();

