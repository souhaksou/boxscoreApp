const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
require("dotenv").config();

const title = ['PLAYER', 'MIN', 'FGM', 'FGA', 'FG%', '3PM',
  '3PA', '3P%', 'FTM', 'FTA', 'FT%', 'OREB',
  'DREB', 'REB', 'AST', 'STL', 'BLK', 'TO',
  'PF', 'PTS', '+/-'];

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const boxscore = async (url) => {
  try {
    // 啟動 Puppeteer
    const browser = await puppeteer.launch({
      headless: 'new',
      args: [
        "--disable-setuid-sandbox",
        "--no-sandbox",
        "--single-process",
        "--no-zygote",
      ],
      executablePath:
        process.env.NODE_ENV === "production"
          ? process.env.PUPPETEER_EXECUTABLE_PATH
          : puppeteer.executablePath(),
    });

    // 開啟新的頁面
    const page = await browser.newPage();

    // 前往指定網址
    await page.goto(url);

    // await page.waitForNavigation();

    // await delay(3000);

    // 等待網頁加載完成
    await page.waitForSelector('table');

    // 取得 table 元素的 outerHTML
    const tableHTML = await page.$$eval('table', tables => {
      return tables.map(table => table.outerHTML);
    });

    const $ = cheerio.load(tableHTML.join(''));

    const tables = $('table');
    const returnData = [];
    tables.each((tableIndex, table) => {
      const players = [];
      const trs = $(table).find('tbody>tr');
      trs.each((index, tr) => {
        const player = [];
        const tds = $(tr).find('td');
        tds.each(((i, td) => {
          if (i === 0) {
            const name = $(td).find('div>a>span>span:first-child').text();
            player.push(name);
          }
          else {
            const hasA = $(td).has('a').length > 0;
            if (hasA) {
              const text = $(td).find('a').text();
              player.push(text);
            } else {
              const text = $(td).text();
              player.push(text);
            }
          }
        }));
        players.push(player);
      });
      players.pop();
      // 整理成json
      const result = players.map((element, index) => {
        if (element.length > 2) {
          const obj = {};
          title.forEach((e, i) => {
            obj[e] = element[i];
          });
          return obj;
        }
        else {
          return {
            'PLAYER': element[0],
            'DNP': 'DNP'
          }
        }
      });
      returnData.push(result);
    });

    // 關閉瀏覽器
    await browser.close();

    return JSON.stringify(returnData);
  }
  catch (err) {
    console.error(err);
  }
}

module.exports = boxscore;