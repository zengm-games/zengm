// This file needs to remain CommonJS for Jest

const babelConfig = require("./tools/lib/babelConfig.cjs");

module.exports = babelConfig(false);
