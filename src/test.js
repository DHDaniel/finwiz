
import finviz from "./index.js";

finviz("AAPL").then(aapl => {

  aapl.financials().then(console.log);

  aapl.insider().then(console.log);

  aapl.news().then(console.log);

  aapl.ratings().then(console.log);
  
});
