const packageA = require("@buibis/package-a");

const { isArray } = require("lodash");

console.log("a223", packageA, packageA.a);

console.log("isArray", isArray(""), isArray([]));
