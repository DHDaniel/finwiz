
/**
 * multToNumber
 * Returns the number value of a string with a multiplier letter, e.g. M, K, B.
 * @param string numStr Number string to convert.
 * @return number The converted number.
 */
const multToNumber = (numStr) => {
  let num = toNumber(numStr.substring(0, numStr.length - 1));
  let mult = numStr[numStr.length - 1].toLowerCase();
  switch (mult) {
    case "k":
      return num * 1e3;
    case "m":
      return num * 1e6;
    case "b":
      return num * 1e9;
    default:
      throw new Error(`Multiplier ${m} not recognized in ${numStr}`);
  };
};

/**
 * percToNumber
 * Converts a string representing a percentage to a number.
 * @param string numStr The string to convert.
 * @return number Converted number without percentage sign, in the range of 0 - 100.
 */
const percToNumber = (numStr) => {
  return toNumber(numStr.substring(0, numStr.length - 1));
};

/**
 * toNumber
 * Converts a string to a float.
 * @param string numStr String to convert.
 * @return number Converted number.
 */
const toNumber = (numStr) => {
  // get rid of commas representing thousands
  let num = numStr.replace(/,/g, "");
  return parseFloat(num);
};

// special case that processes a 52 week range value scraped from site.
const range52W = (str) => {
  let range = [];
  let points = str.split("-");
  points.forEach(point => {
    let p = toNumber(point.trim());
    range.push(p);
  });
  return range;
};

// special case for volatility value scraped from site.
const volatility = (str) => {
  let vols = [];
  let vols_raw = str.split(" ");
  vols_raw.forEach(v => {
    vols.push(percToNumber(v.trim()));
  });
  return vols;
};

// converts a string currency (in dollars) to a number
const curToNumber = (str) => {
  return parseFloat(str.substring(1));
};

export {
  multToNumber,
  percToNumber,
  toNumber,
  range52W,
  volatility,
  curToNumber
}
