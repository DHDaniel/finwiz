"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _osmosis = _interopRequireDefault(require("osmosis"));

var _request = _interopRequireDefault(require("request"));

var _slugify = _interopRequireDefault(require("slugify"));

var _moment = _interopRequireDefault(require("moment"));

var _convert = require("./utils/convert");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

// main URL that the functions below query to get stock information.
var QUOTE_URL = "https://finviz.com/quote.ashx";
/**
 * getStockPage
 * Returns the HTML code of the page associated with a stock.
 * @param string ticker The stock ticker of the company, e.g. AAPL.
 * @return promise A promise that resolves with the HTML of the page as a string.
 */

var getStockPage = function getStockPage(ticker) {
  return new Promise(function (resolve, reject) {
    (0, _request["default"])(QUOTE_URL + "?t=".concat(ticker), function (err, res, body) {
      if (res.statusCode !== 200) {
        reject(new Error("Ticker ".concat(ticker, " not found.")));
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


var getSnapshotInfo = function getSnapshotInfo(page) {
  return new Promise(function (resolve, reject) {
    var table = _osmosis["default"].parse(page).find("table.snapshot-table2");

    var rawData = [];
    table.set({
      "rows": ["td"]
    }).data(function (d) {
      for (var i = 0; i < d.rows.length; i += 2) {
        var label = d.rows[i];
        var value = d.rows[i + 1];
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


var processSnapshotInfo = function processSnapshotInfo(info) {
  return new Promise(function (resolve, reject) {
    var processed = {};
    var eps_edge_case_processed = false;
    info.forEach(function (tuple) {
      var label = (0, _slugify["default"])(tuple[0].toLowerCase(), "_");
      var value = "";
      var v = tuple[1];

      if (label === "52w_range") {
        // special case has two values separated by a dash
        var values = (0, _convert.range52W)(v);
        processed["52w_high_price"] = values[1];
        processed["52w_low_price"] = values[0];
        return;
      } else if (label === "volatility") {
        // special case has two percentage values (week and month)
        var _values = (0, _convert.volatility)(v);

        processed["volatility_week"] = _values[0];
        processed["volatility_month"] = _values[1];
        return;
      } else if (label === "eps_next_y" && !eps_edge_case_processed) {
        // eps_next_y is duplicated on the site, one is the percentage estimate
        // and one is the number estimate
        processed["eps_next_y_estimate"] = (0, _convert.toNumber)(v);
        eps_edge_case_processed = true;
        return;
      } else if (v[v.length - 1] === "%") {
        // if value is a percentage
        value = (0, _convert.percToNumber)(v);
      } else if (["M", "B", "K"].includes(v[v.length - 1])) {
        // if value has a letter multiplier (e.g. 1.1B)
        value = (0, _convert.multToNumber)(v);
      } else {
        value = (0, _convert.toNumber)(v);
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


var getRatings = function getRatings(page) {
  return new Promise(function (resolve, reject) {
    var table = _osmosis["default"].parse(page).find("table.fullview-ratings-outer");

    var rawData = [];
    table.set({
      "items": ["td.fullview-ratings-inner td"]
    }).data(function (d) {
      for (var i = 0; i < d.items.length; i += 5) {
        // go five at a time obtaining the values for each row.
        var row = [d.items[i], d.items[i + 1], d.items[i + 2], d.items[i + 3], d.items[i + 4]];
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


var processRatings = function processRatings(ratings) {
  return new Promise(function (resolve, reject) {
    var processed = ratings.map(function (rating) {
      var date = (0, _moment["default"])(rating[0], "MMM-DD-YY");
      var action = rating[1].toLowerCase();
      var org = rating[2]; // this is in the format "neutral -> buy"

      var statuses = rating[3].split(" ");
      var after_r = statuses[statuses.length - 1].toLowerCase(); // sometimes a rating has just been issued, so there is no before value.

      var before_r = statuses.length > 1 ? statuses[0].toLowerCase() : ""; // this is in the format "old_target -> new_target"

      var prices = rating[4].split(" ");
      var after_p = (0, _convert.curToNumber)(prices[prices.length - 1]); // sometimes a price target has just been issued, so there is no before value

      var before_p = prices.length > 1 ? (0, _convert.curToNumber)(prices[0]) : "";
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
  });
};
/**
 * getNews
 * Get all associated news from site.
 * @param string page HTML code of the page.
 * @returns promise A promise that resolves to an array of arrays containing news information rows.
 */


var getNews = function getNews(page) {
  return new Promise(function (resolve, reject) {
    var table = _osmosis["default"].parse(page).find("table.fullview-news-outer");

    var rawData = [];
    table.set({
      "times": ["td[align=\"right\"]"],
      "headlines": ["td[align=\"left\"]"],
      "links": ["td[align=\"left\"] a@href"]
    }).data(function (d) {
      for (var i = 0; i < d.times.length; i++) {
        var row = [d.times[i], d.headlines[i], d.links[i]];
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


var processNews = function processNews(news) {
  return new Promise(function (resolve, reject) {
    var processed = [];

    for (var i = 0; i < news.length; i++) {
      // time sometimes contains the date if it is the first news item for that day.
      // e.g. "date time" instead of just "time"
      var time = news[i][0].split(" ");
      var headline = news[i][1];
      var link = news[i][2]; // if there's a date and time in the time slot

      if (time.length > 1) {
        var date = (0, _moment["default"])(time[0], "MMM-DD-YY").format("YYYY-MM-DD");
        processed.push({
          "date": date,
          news: []
        });
      }

      processed[processed.length - 1].news.push({
        time: (0, _moment["default"])(time[time.length - 1], "hh:mmA").format("HH:mm"),
        headline: headline,
        link: link
      });
    }

    ;
    resolve(processed);
  });
};
/**
 * getInsider
 * Get raw insider trading information
 * @param string page HTML code of the page.
 * @returns promise A promise that resolves with an object containing arrays with the columns of each insider trading column.
 */


var getInsider = function getInsider(page) {
  return new Promise(function (resolve, reject) {
    var table = _osmosis["default"].parse(page).find("table.body-table");

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
    }).data(function (d) {
      // will have keys for each column and an array representing the values in that column
      var data = {};
      Object.keys(d).forEach(function (key) {
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
  });
};
/**
 * processInsider
 * Processes the raw insider information
 * @param object insider Object containing raw insider trading data.
 * @returns promise A promise that resolves with an array of objects containing insider trading information.
 */


var processInsider = function processInsider(insider) {
  return new Promise(function (resolve, reject) {
    var processed = [];

    for (var i = 0; i < insider.entity.length; i++) {
      var name = insider.entity[i];
      var relationship = insider.relationship[i];
      var date = (0, _moment["default"])(insider.date[i], "MMM DD").format("YYYY-MM-DD");
      var transaction = (0, _slugify["default"])(insider.transaction[i].toLowerCase(), "_");
      var cost = (0, _convert.toNumber)(insider.cost[i]);
      var shares = (0, _convert.toNumber)(insider.shares[i]);
      var value = (0, _convert.toNumber)(insider.value[i]);
      var shares_total = (0, _convert.toNumber)(insider.total[i]);
      var sec_filing_date = (0, _moment["default"])(insider.sec[i], "MMM DD hh:mm A").format("YYYY-MM-DD");
      var sec_filing_link = insider.link[i];
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
    }

    ;
    resolve(processed);
  });
};
/**
 * stock
 * Main Finwiz function. Returns an object that exposes all of the information-retrieving methods above.
 * @param string ticker Ticker of the stock whose information you want to retrieve.
 * @returns promise A promise that resolves to the company object with all the available methods.
 */


function stock(ticker) {
  return new Promise(function (resolve, reject) {
    getStockPage(ticker).then(function (htmlPage) {
      var stockObj = {
        financials: function financials() {
          return getSnapshotInfo(htmlPage).then(processSnapshotInfo);
        },
        ratings: function ratings() {
          return getRatings(htmlPage).then(processRatings);
        },
        news: function news() {
          return getNews(htmlPage).then(processNews);
        },
        insider: function insider() {
          return getInsider(htmlPage).then(processInsider);
        }
      };
      resolve(stockObj);
    });
  });
}

var _default = stock;
exports["default"] = _default;