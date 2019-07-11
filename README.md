# 🧙📊 Finwiz
 Get a company's financials and stock information using a simple and intuitive API.

## Installation
Via npm:
```bash
npm install finwiz
```

## Usage
The API is very simple and easy to use. The basic `finwiz` function takes a string representing a company's stock ticker. It returns a `company` object containing a variety of useful methods.

```javascript
import finwiz from "finwiz";

// get information on Apple, Inc.
finwiz("AAPL").then(company => {
    // company has an array of functions that can be used to get information on it.
})
```

### Financials
Getting a company's stock performance metrics and other related financial metrics is very easy:
```javascript
finwiz("AAPL").then(company => {
    // the financials function returns stock performance metrics and related financials.
    company.financials().then(data => {
        console.log(data);
    });
});
```

Example output of the above code is shown below:
```javascript
{
  index: 'djia s&p500', // indices where the stock trades in
  pe: 17.5, // price to earnings (ttm)
  'eps_(ttm)': 11.67, // earnings per share (ttm)
  insider_own: 0.07, // insider ownership (percentage)
  shs_outstand: 4640000000, // shares outstanding
  perf_week: 2.25, // performance during the week (percentage)
  market_cap: 948320000000, // market capitalization (USD)
  forward_pe: 16.19, // forward price to earnings (next fiscal year)
  eps_next_y_estimate: 12.26, // earnings per share estimate for next year
  eps_next_y: 10.36, // earnings per share estimate growth for next year (percentage)
  insider_trans: -4.02, // insider transactions (6-month change in insider ownership)
  shs_float: 4600000000, // shares float
  perf_month: 11.88, // performance for the month (percentage)
  income: 56070000000, // income (ttm)
  peg: 1.46, // price to earnings to growth
  eps_next_q: 2.1, // earnings per share next quarter estimate
  inst_own: 60.9, // institutional ownership
  short_float: 1.02, // short interest share (percentage)
  perf_quarter: 4.36, // performance for the quarter (percentage)
  sales: 258490000000, // revenue (ttm)
  ps: 3.67, // price-to-sales (ttm)
  eps_this_y: 32.6, // earnings per share growth this year (percentage)
  inst_trans: -2.89, // institutional transactions (3-month change in institutional ownership)
  short_ratio: 1.7, // short interest ratio
  perf_half_y: 43.63, // performance during half year (percentage)
  booksh: 22.65, // book value per share
  pb: 9.02, // price to book
  roa: 16, // return on assets (ttm)
  target_price: 212.03, // average target price
  perf_year: 11.04, // performance for past year (percentage)
  cashsh: 17.25, // cash per share
  pc: 11.84, // price to cash per share
  eps_next_5y: 12, // long term annual growth estimate (percentage) (5Y)
  roe: 51.3, // return on equity (percentage) (ttm)
  '52w_high_price': 233.47, // high price 52 week
  '52w_low_price': 142, // low price 52 week
  perf_ytd: 29.47, // performance year-to-date (percentage)
  dividend: 3.08, // dividend (annual)
  pfcf: 20.78, // price to free cash flow (ttm)
  eps_past_5y: 16.5, // annual earnings per share growth past 5Y (percentage)
  roi: 26.6, // return on investment (percentage) (ttm)
  '52w_high': -12.52, // percentage difference from 52 week high
  beta: 1.24, // beta
  dividend_percent: 1.51, // dividend yield (percentage)
  quick_ratio: 1.3, // quick ratio
  sales_past_5y: 9.2, // annual sales growth past 5 years (percentage)
  gross_margin: 38.1, // gross margin (percentage) (ttm)
  '52w_low': 43.82, // percentage difference from 52 week low
  atr: 3.54, // average true range
  employees: 132000, // number of employees
  current_ratio: 1.3, // current ratio
  sales_qq: -5.1, // quarterly revenue growth (year on year) percentage
  'oper._margin': 25.3, // operating margin (percentage) (ttm)
  'rsi_(14)': 63.02, // relative strength index
  volatility_week: 1.19, // week volatility (percentage)
  volatility_month: 1.57, // month volatility (percentage)
  optionable: 'yes', // whether it is optionable
  debteq: 1.06, // debt to equity ratio
  eps_qq: -9.8, // quarterly earnings growth year-on-year (percentage)
  profit_margin: 22.1, // profit margin (percentage) (ttm)
  rel_volume: 0.62, // relative volume
  prev_close: 204.41, // price of previous close
  shortable: 'yes', // whether it is shortable
  lt_debteq: 0.85, // long term debt to equity ratio
  earnings: 'jul 30 amc', // earnings date (AMC = after market close, BMO = before market open)
  payout: 24.4, // dividend payout ratio (percentage) (ttm)
  avg_volume: 27660000, // average volume
  price: 204.23, // current share price
  recom: 2.2, // average recommendation (1 - strong buy, 5 - strong sell)
  sma20: 3.87, // distance from 20-day simple moving average
  sma50: 5.29, // distance from 50-day simple moving average
  sma200: 8.46, // distance from 200-day simple moving average
  volume: 17203128, // current volume
  change: -0.09 // current percentage change since market open
}
  ```

  ### Ratings
 It is just as easy to get a company's latest analyst ratings:
 ```javascript
 finwiz("AAPL").then(company => {
    // the ratings function returns a company's latest analyst ratings
    company.ratings().then(data => {
        console.log(data);
    });
});
```

Example output is shown below:

```javascript
[
    {
        date: '2019-06-06',
        action: 'initiated',
        org: 'Evercore ISI',
        rating: { before: '', after: 'outperform' },
        target: { before: '', after: 205 }
    },
    {
        date: '2019-06-04',
        action: 'reiterated',
        org: 'Cowen',
        rating: { before: '', after: 'outperform' },
        target: { before: 245, after: 220 }
    },
    {
        date: '2019-05-30',
        action: 'reiterated',
        org: 'Morgan Stanley',
        rating: { before: '', after: 'overweight' },
        target: { before: 240, after: 231 }
    },
    ...
]
```

The "before" fields will only exist if data is available for them (e.g. in the event of a downgrade). The "after" fields will always contain a value.

### News
It is also possible to get a company's latest news:
```javascript
finwiz("AAPL").then(company => {
   // the news function returns a company's latest news.
   company.news().then(data => {
       console.log(data);
   });
});
```

Example output is shown below:

```javascript
[
    {
        date: '2019-07-02',
        news: [{
                    time: '17:32',
                    headline: 'UPDATE 1-Wall Street looks to earnings after strongest June in decades Reuters',
                    link: 'https://finance.yahoo.com/news/1-wall-street-looks-earnings-213215453.html'
                },
                {
                    time: '16:42',
                    headline: 'Dow Jones Today: More Trade Tiffs, But Its Not China This Time InvestorPlace',
                    link: 'https://finance.yahoo.com/news/dow-jones-today-more-trade-204224788.html'

                }
                ...
            ]
    },
    ...
]
```

### Insider
Getting the latest insider transactions is just as easy:
```javascript
finwiz("AAPL").then(company => {
   // the insider function returns a company's latest insider transactions.
   company.insider().then(data => {
       console.log(data);
   });
});
```

Example output is shown below:

```javascript
[
    {
        name: 'LEVINSON ARTHUR D',
        relationship: 'Director',
        date: '2019-08-02',
        transaction: 'sale',
        cost: 206.58,
        shares: 20000,
        value: 4131600,
        shares_total: 1133283,
        sec_filing_date: '2019-08-06',
        sec_filing_link:
         'http://www.sec.gov/Archives/edgar/data/320193/000032019318000103/xslF345X03/wf-form4_153359461891019.xml'
    },
    {
        name: 'WILLIAMS JEFFREY E',
        relationship: 'COO',
        date: '2019-07-09',
        transaction: 'sale',
        cost: 190.18,
        shares: 15652,
        value: 2976664,
        shares_total: 123737,
        sec_filing_date: '2019-07-11',
        sec_filing_link:
         'http://www.sec.gov/Archives/edgar/data/320193/000032019318000095/xslF345X03/wf-form4_153134826427557.xml'
    },
    ...
]
```

## Where does the information come from?

Currently, all the information is sourced from [finviz](http://finviz.com) (yes, hence the name). Refer to their site for more information regarding each metric. This means data is not real-time -- it is delayed by around 15 minutes.

## Contributing

Contributions are very welcome! To develop locally, all you'll have to do is run `npm run build` and get to work in the `/src` folder.
