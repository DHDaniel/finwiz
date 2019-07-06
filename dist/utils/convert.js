"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.curToNumber = exports.volatility = exports.range52W = exports.toNumber = exports.percToNumber = exports.multToNumber = void 0;

var multToNumber = function multToNumber(numStr) {
  var num = toNumber(numStr.substring(0, numStr.length - 1));
  var mult = numStr[numStr.length - 1].toLowerCase();

  switch (mult) {
    case "k":
      return num * 1e3;

    case "m":
      return num * 1e6;

    case "b":
      return num * 1e9;

    default:
      throw new Error("Multiplier ".concat(m, " not recognized in ").concat(numStr));
  }

  ;
};

exports.multToNumber = multToNumber;

var percToNumber = function percToNumber(numStr) {
  return toNumber(numStr.substring(0, numStr.length - 1));
};

exports.percToNumber = percToNumber;

var toNumber = function toNumber(numStr) {
  var num = numStr.replace(/,/g, "");
  return parseFloat(num);
};

exports.toNumber = toNumber;

var range52W = function range52W(str) {
  var range = [];
  var points = str.split("-");
  points.forEach(function (point) {
    var p = toNumber(point.trim());
    range.push(p);
  });
  return range;
};

exports.range52W = range52W;

var volatility = function volatility(str) {
  var vols = [];
  var vols_raw = str.split(" ");
  vols_raw.forEach(function (v) {
    vols.push(percToNumber(v.trim()));
  });
  return vols;
};

exports.volatility = volatility;

var curToNumber = function curToNumber(str) {
  return parseFloat(str.substring(1));
};

exports.curToNumber = curToNumber;