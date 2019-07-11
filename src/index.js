
import osmosis from "osmosis";
import request from "request";
import slugify from "slugify";
import moment from "moment";

import { multToNumber, percToNumber, toNumber, curToNumber, range52W, volatility } from "./utils/convert";

const QUOTE_URL = "https://finviz.com/quote.ashx";


const getStockPage = (ticker) => {
  return new Promise((resolve, reject) => {
    request(QUOTE_URL + `?t=${ticker}`, (err, res, body) => {
      resolve(body);
    });
  });
};

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

const processSnapshotInfo = (info) => {
  return new Promise((resolve, reject) => {
    let processed = {};
    let eps_edge_case_processed = false;
    info.forEach(tuple => {
      let label = slugify(tuple[0].toLowerCase(), "_");
      let value = "";
      let v = tuple[1];
      if (label === "52w_range") {
        let values = range52W(v);
        processed["52w_high_price"] = values[1];
        processed["52w_low_price"] = values[0];
        return;
      } else if (label === "volatility") {
        let values = volatility(v);
        processed["volatility_week"] = values[0];
        processed["volatility_month"] = values[1];
        return;
      } else if ((label === "eps_next_y") && (!eps_edge_case_processed)) {
        processed["eps_next_y_estimate"] = toNumber(v);
        eps_edge_case_processed = true;
        return;
      } else if (v[v.length - 1] === "%") {
        value = percToNumber(v);
      } else if (["M", "B", "K"].includes(v[v.length - 1])) {
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

const getRatings = (page) => {
  return new Promise((resolve, reject) => {
    let table = osmosis.parse(page).find("table.fullview-ratings-outer");
    let rawData = [];
    table.set({
      "items": ["td.fullview-ratings-inner td"]
    }).data(d => {
      for (let i = 0; i < d.items.length; i+=5) {
        let row = [d.items[i], d.items[i+1], d.items[i+2], d.items[i+3], d.items[i+4]];
        rawData.push(row);
      }
      resolve(rawData);
    });
  });
};

const processRatings = (ratings) => {
  return new Promise((resolve, reject) => {
    let processed = ratings.map(rating => {
      let date = moment(rating[0], "MMM-DD-YY");
      let action = rating[1].toLowerCase();
      let org = rating[2];
      let statuses = rating[3].split(" ");
      let after_r = statuses[statuses.length - 1].toLowerCase();
      let before_r = (statuses.length > 1) ? statuses[0].toLowerCase() : "";
      let prices = rating[4].split(" ");
      let after_p = curToNumber(prices[prices.length - 1]);
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

const processNews = (news) => {
  return new Promise((resolve, reject) => {
    let processed = [];
    for (let i = 0; i < news.length; i++) {
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

const getInsider = (page) => {
  return new Promise((resolve, reject) => {
    let table = osmosis.parse(page).find("table.body-table");
    let rawData = [];
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
      let data = {};
      Object.keys(d).forEach(key => {
        if (key !== "link") {
          data[key] = d[key].slice(1);
        } else {
          data[key] = d[key];
        }
      });
      resolve(data);
    });
  })
};

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
