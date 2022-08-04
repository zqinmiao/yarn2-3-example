const { isArray } = require("lodash");

const eslint = require("eslint");

console.log("isArray", isArray(""), isArray([]));

console.log("eslint", eslint);
