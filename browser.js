const puppeteer = require('puppeteer');
const config = require('./config/default.json');

function browser(){
  let browser = null;

  async function getInstance(){
    if (!browser) browser = await puppeteer.launch(config.puppeteer);
    return browser;
  }

  function newPage(){
    return browser.newPage();
  }

  async function linkToNewPage(){
    const newPagePromise = new Promise(x => browser.once('targetcreated', target => x(target.page())));    // declare promise
    const newPage = await newPagePromise;
    return newPage;
  }

  
  return {getInstance,newPage,linkToNewPage}
}

module.exports = browser();