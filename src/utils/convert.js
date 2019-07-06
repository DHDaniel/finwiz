
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

const percToNumber = (numStr) => {
  return toNumber(numStr.substring(0, numStr.length - 1));
};

const toNumber = (numStr) => {
  let num = numStr.replace(/,/g, "");
  return parseFloat(num);
};

const range52W = (str) => {
  let range = [];
  let points = str.split("-");
  points.forEach(point => {
    let p = toNumber(point.trim());
    range.push(p);
  });
  return range;
};

const volatility = (str) => {
  let vols = [];
  let vols_raw = str.split(" ");
  vols_raw.forEach(v => {
    vols.push(percToNumber(v.trim()));
  });
  return vols;
};

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
