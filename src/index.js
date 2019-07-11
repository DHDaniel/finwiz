
import osmosis from "osmosis";
import request from "request";
import slugify from "slugify";
import moment from "moment";

import { multToNumber, percToNumber, toNumber, curToNumber, range52W, volatility } from "./utils/convert";

// main URL that the functions below query to get stock information.
const QUOTE_URL = "https://finviz.com/quote.ashx";

/**
 * getStockPage
 * Returns the HTML code of the page associated with a stock.
 * @param string ticker The stock ticker of the company, e.g. AAPL.
 * @return promise A promise that resolves with the HTML of the page as a string.
 */
const getStockPage = (ticker) => {
  return new Promise((resolve, reject) => {
    request(QUOTE_URL + `?t=${ticker}`, (err, res, body) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Ticker ${ticker} not found.`));
      } else {
        resolve(body);
      }
    });
  });
};

/**
 * getSnapshotInfo
 * Extracts the financial information from the page without processing it.
 * @param string page HTML code of the page.
 * @returns promise A promise that resolves with an array of arrays with the format
 *                  [[label, value], [label, value], ...]
 */
const getSnapshotInfo = (page) => {
  return new Promise((resolve, reject) => {
    let table = osmosis.parse(page).find("table.snapshot-table2");
    let rawData = [];
    table.set({"rows": ["td"]}).data(d => {
      for (let i = 0; i < d.rows.length; i += 2) {
        let label = d.rows[i];
        let value = d.rows[i + 1];
        rawData.push([label, value]);
      }
      resolve(rawData);
    }).error(reject);
  });
};

/**
 * processSnapshotInfo
 * Processes raw financial information retrieved from the HTML site.
 * @param array info An array containing arrays in the format [label, value].
 * @returns promise A promise that resolves with an object containing all the processed financial information of the stock.
 */
const processSnapshotInfo = (info) => {
  return new Promise((resolve, reject) => {
    let processed = {};
    let eps_edge_case_processed = false;
    info.forEach(tuple => {
      let label = slugify(tuple[0].toLowerCase(), "_");
      let value = "";
      let v = tuple[1];
      if (label === "52w_range") {
        // special case has two values separated by a dash
        let values = range52W(v);
        processed["52w_high_price"] = values[1];
        processed["52w_low_price"] = values[0];
        return;
      } else if (label === "volatility") {
        // special case has two percentage values (week and month)
        let values = volatility(v);
        processed["volatility_week"] = values[0];
        processed["volatility_month"] = values[1];
        return;
      } else if ((label === "eps_next_y") && (!eps_edge_case_processed)) {
        // eps_next_y is duplicated on the site, one is the percentage estimate
        // and one is the number estimate
        processed["eps_next_y_estimate"] = toNumber(v);
        eps_edge_case_processed = true;
        return;
      } else if (v[v.length - 1] === "%") {
        // if value is a percentage
        value = percToNumber(v);
      } else if (["M", "B", "K"].includes(v[v.length - 1])) {
        // if value has a letter multiplier (e.g. 1.1B)
        value = multToNumber(v);
      } else {
        value = toNumber(v);
      }
      if (isNaN(value)) {
        // leave untouched if conversion to number was unsuccessful.
        value = v.toLowerCase();
      }
      processed[label] = value;
    });
    resolve(processed);
  });
};

/**
 * getRatings
 * Gets raw analyst ratings from the page.
 * @param string page HTML code of the page.
 * @returns promise A promise that resolves with an array of arrays containing the rows of the ratings table in the HTML.
 */
const getRatings = (page) => {
  return new Promise((resolve, reject) => {
    let table = osmosis.parse(page).find("table.fullview-ratings-outer");
    let rawData = [];
    table.set({
      "items": ["td.fullview-ratings-inner td"]
    }).data(d => {
      for (let i = 0; i < d.items.length; i+=5) {
        // go five at a time obtaining the values for each row.
        let row = [d.items[i], d.items[i+1], d.items[i+2], d.items[i+3], d.items[i+4]];
        rawData.push(row);
      }
      resolve(rawData);
    });
  });
};

/**
 * processRatings
 * Process raw analyst ratings from site.
 * @param array ratings Array of arrays containing raw ratings.
 * @returns promise A promise that resolves with an array of objects containing rating information.
 */
const processRatings = (ratings) => {
  return new Promise((resolve, reject) => {
    let processed = ratings.map(rating => {
      let date = moment(rating[0], "MMM-DD-YY");
      let action = rating[1].toLowerCase();
      let org = rating[2];
      // this is in the format "neutral -> buy"
      let statuses = rating[3].split(" ");
      let after_r = statuses[statuses.length - 1].toLowerCase();
      // sometimes a rating has just been issued, so there is no before value.
      let before_r = (statuses.length > 1) ? statuses[0].toLowerCase() : "";
      // this is in the format "old_target -> new_target"
      let prices = rating[4].split(" ");
      let after_p = curToNumber(prices[prices.length - 1]);
      // sometimes a price target has just been issued, so there is no before value
      let before_p = (prices.length > 1) ? curToNumber(prices[0]) : "";
      return {
        date: date.format("YYYY-MM-DD"),
        action: action,
        org: org,
        rating: {
          before: before_r,
          after: after_r
        },
        target: {
          before: before_p,
          after: after_p
        }
      };
    });
    resolve(processed);
  })
};

/**
 * getNews
 * Get all associated news from site.
 * @param string page HTML code of the page.
 * @returns promise A promise that resolves to an array of arrays containing news information rows.
 */
const getNews = (page) => {
  return new Promise((resolve, reject) => {
    let table = osmosis.parse(page).find("table.fullview-news-outer");
    let rawData = [];
    table.set({
      "times": ["td[align=\"right\"]"],
      "headlines": ["td[align=\"left\"]"],
      "links": ["td[align=\"left\"] a@href"]
    }).data(d => {
      for (let i = 0; i < d.times.length; i++) {
        let row = [d.times[i], d.headlines[i], d.links[i]];
        rawData.push(row);
      }
      resolve(rawData);
    });
  });
};

/**
 * processNews
 * Process the raw news from the site.
 * @param array news An array of arrays containing the raw news information from the table.
 * @returns promise A promise that resolves to an array of objects containing news information separated by date.
 */
const processNews = (news) => {
  return new Promise((resolve, reject) => {
    let processed = [];
    for (let i = 0; i < news.length; i++) {
      // time sometimes contains the date if it is the first news item for that day.
      // e.g. "date time" instead of just "time"
      let time = news[i][0].split(" ");
      let headline = news[i][1];
      let link = news[i][2];
      // if there's a date and time in the time slot
      if (time.length > 1) {
        let date = moment(time[0], "MMM-DD-YY").format("YYYY-MM-DD");
        processed.push({"date": date, news: []});
      }
      processed[processed.length - 1].news.push({
        time: moment(time[time.length - 1], "hh:mmA").format("HH:mm"),
        headline: headline,
        link: link
      });
    };
    resolve(processed);
  });
};

/**
 * getInsider
 * Get raw insider trading information
 * @param string page HTML code of the page.
 * @returns promise A promise that resolves with an object containing arrays with the columns of each insider trading column.
 */
const getInsider = (page) => {
  return new Promise((resolve, reject) => {
    let table = osmosis.parse(page).find("table.body-table");
    table.set({
      "entity": ["tr td:nth-child(1)"],
      "relationship": ["tr td:nth-child(2)"],
      "date": ["tr td:nth-child(3)"],
      "transaction": ["tr td:nth-child(4)"],
      "cost": ["tr td:nth-child(5)"],
      "shares": ["tr td:nth-child(6)"],
      "value": ["tr td:nth-child(7)"],
      "total": ["tr td:nth-child(8)"],
      "sec": ["tr td:nth-child(9)"],
      "link": ["tr td:nth-child(9) a@href"]
    }).data(d => {
      // will have keys for each column and an array representing the values in that column
      let data = {};
      Object.keys(d).forEach(key => {
        if (key !== "link") {
          // remove title row
          data[key] = d[key].slice(1);
        } else {
          // links don't have a title row
          data[key] = d[key];
        }
      });
      resolve(data);
    });
  })
};

/**
 * processInsider
 * Processes the raw insider information
 * @param object insider Object containing raw insider trading data.
 * @returns promise A promise that resolves with an array of objects containing insider trading information.
 */
const processInsider = (insider) => {
  return new Promise((resolve, reject) => {
    let processed = [];
    for (let i = 0; i < insider.entity.length; i++) {
      let name = insider.entity[i];
      let relationship = insider.relationship[i];
      let date = moment(insider.date[i], "MMM DD").format("YYYY-MM-DD");
      let transaction = slugify(insider.transaction[i].toLowerCase(), "_");
      let cost = toNumber(insider.cost[i]);
      let shares = toNumber(insider.shares[i]);
      let value = toNumber(insider.value[i]);
      let shares_total = toNumber(insider.total[i]);
      let sec_filing_date = moment(insider.sec[i], "MMM DD hh:mm A").format("YYYY-MM-DD");
      let sec_filing_link = insider.link[i];
      processed.push({
        name: name,
        relationship: relationship,
        date: date,
        transaction: transaction,
        cost: cost,
        shares: shares,
        value: value,
        shares_total: shares_total,
        sec_filing_date: sec_filing_date,
        sec_filing_link: sec_filing_link
      });
    };
    resolve(processed);
  });
}

/**
 * stock
 * Main Finwiz function. Returns an object that exposes all of the information-retrieving methods above.
 * @param string ticker Ticker of the stock whose information you want to retrieve.
 * @returns promise A promise that resolves to the company object with all the available methods.
 */
function stock(ticker) {
  return new Promise((resolve, reject) => {
    getStockPage(ticker).then(htmlPage => {

      let stockObj = {
        financials: () => getSnapshotInfo(htmlPage).then(processSnapshotInfo),
        ratings: () => getRatings(htmlPage).then(processRatings),
        news: () => getNews(htmlPage).then(processNews),
        insider: () => getInsider(htmlPage).then(processInsider)
      };

      resolve(stockObj);
    });
  });
}


export default stock;
