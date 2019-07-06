"use strict";

var _index = _interopRequireDefault(require("./index.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

(0, _index["default"])("AAPL").then(function (aapl) {
  aapl.financials().then(console.log);
  aapl.insider().then(console.log);
  aapl.news().then(console.log);
  aapl.ratings().then(console.log);
});