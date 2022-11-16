const filledStarColour = "#FF5D55";

const cheerio = require('cheerio');

function bestLinkSearcher() {

  async function getBestLinkCheerio(headElement, html, type = "tab") {
    try {
      let $ = await cheerio.load(html);
      if (!headElement) {
        console.log("NO ROOT ELEMENT PASSED IN! ");
        headElement = $("body>div");
      }
      console.log("head elem: ");
      console.log(headElement);
      //console.log("html:");
      //console.log(html);
      var arr = headElement.children().toArray();
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

  async function getBestLink(headElement,page,type="tab"){
    try{

      await page.waitForSelector(headElement);
      console.log("head elem ("+headElement+"): ");
      const bestLink = await page.evaluate((he,type) => {
        const elem = document.querySelector(he);
        let arr = [...elem.children]
        arr.shift();
        //if (arr.length < 3) console.log((arr[0]));
        console.log("Number of children of root elem passed in", " ", arr.length);
        console.log("First elem" + arr[0].tagName + arr[0].className);
        //console.log("First in array after shift: " + [...arr[0].children].map(e=>e.innerText).join("|"));
        let tabs = arr.filter(function (e) {
          //for now, assumed that its not possible for two artists to make the same song.
          let isArtist = true; 
          let children = e.children;
          if (!children) return  false;
          console.log(children.length);
          //identify tabs that are just guitar solos
          let isSolo = ~children[1].innerText.toLowerCase().indexOf("solo");
          let isTab = children[3].innerText.toLowerCase() == type; 
          let hasRating = children[2].querySelectorAll("div span").length > 0;
          return isArtist && isTab && hasRating && !isSolo; 
          
        });
        function countStars(stars) {
          let tot = 0;
          //#444-empty star, //#FF5D55 full star
          //svg with two paths is a half full star
          for (let i = 0; i < stars.length; i++) {
            let a = stars[i];
            var isHalfStar = (a).classList.length == 3;
            if (isHalfStar) { tot += 0.5; continue; }
            let isFullStar = (a).classList.length == 2;
            if (isFullStar) tot++;
            console.assert(isHalfStar || isFullStar);
          }
          return tot;
        }
      
        let printedScore = false;
        function getScore(listItem) {
          let starsContainerCell = listItem.children[2];
          let stars = starsContainerCell.children[0]?.children[0]?.children;
          let numStars=0, votes = 0;
          if (stars){
            console.log(stars);
            numStars = countStars([...stars]);
            votes = +starsContainerCell.children[0].children[1].innerText;
          }
          console.assert(!isNaN(votes) && typeof(votes)=="number");
          let score = Math.pow(numStars, 3) * +votes;
          if (!printedScore){
            console.log("stars: " + numStars + "|" + " votes: " + votes);
            printedScore = true;
          }
          return score;
        }
        let sortedTabs = tabs.sort(function (a, b) {
          let bb = getScore(b);
          let aa = getScore(a);
          return bb - aa;
        });
        let topTab = sortedTabs[0].children[1];
        let topLink = topTab.querySelector("a").href;
        return topLink;
      },headElement,type);
      return bestLink;
  } catch (err) {
    console.log(err);
  }



  }

  function countStarsCheerio($,stars) {
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

  function getScoreCheerio(listItem) {
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

