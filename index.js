const app = require("express")();

let chrome = {};
let puppeteer;

if (process.env.AWS_LAMBDA_FUNCTION_VERSION) {
  chrome = require("chrome-aws-lambda");
  puppeteer = require("puppeteer-core");
} else {
  puppeteer = require("puppeteer");
}

app.get("/api", async (req, res) => {
  let options = {};

  if (process.env.AWS_LAMBDA_FUNCTION_VERSION) {
    options = {
      args: [...chrome.args, "--hide-scrollbars", "--disable-web-security"],
      defaultViewport: chrome.defaultViewport,
      executablePath: await chrome.executablePath,
      headless: true,
      ignoreHTTPSErrors: true,
    };
  }

  try {
    let browser = await puppeteer.launch(options);
    const surplus = {};
    let page = await browser.newPage();
    await page.goto("https://www.surplus.iastate.edu/sales/inventory");
    let items = await page.evaluate(() => document.querySelector('.wd-Grid-cell').innerHTML);
    let itemsArr = items.split('  <br>\n ');
    var date = itemsArr[0].substring(
      itemsArr[0].indexOf("Updated:") + 9,itemsArr[0].indexOf("Updated: ") + 18)
    surplus.latestUpdate = date;
    itemsArr.shift();
    itemsArr[itemsArr.length - 1] = itemsArr[itemsArr.length - 1].substring(0, itemsArr[itemsArr.length - 1].length - 6);
    for(let i = 0; i < itemsArr.length; i++) {
        if(itemsArr[i][0] === '(') {
          var quantity = itemsArr[i].substring(
            itemsArr[i].indexOf("(") + 1, 
            itemsArr[i].lastIndexOf(")")
          );
          var quantity = parseInt(quantity);
          itemsArr[i] = itemsArr[i].substring(4, itemsArr[i].length);
          } else {
            var quantity = 1;
          }
          if(itemsArr[i][0] === ' ') {
            itemsArr[i] = itemsArr[i].substring(1, itemsArr[i].length);
          }
          itemsArr[i] = {itemName:itemsArr[i], quantity:quantity};
    }
    surplus.items = itemsArr;
    res.setHeader('Access-Control-Allow-Credentials', true)
    res.setHeader('Access-Control-Allow-Origin', '*')
  // another common pattern
  // res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version')
    res.setHeader("Content-Type", "application/json");
    res.send(surplus);
  } catch (err) {
    console.error(err);
    return null;
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server started");
});

module.exports = app;
