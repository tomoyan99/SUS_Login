const npmVersion = require("../../../package.json").version;
const __PREFIX = "resources/";
// const __PREFIX = "";
const termRC = {
    col:80,
    row:30
};
const infoPath = "data/info.json";

module.exports = {
    npmVersion,
    __PREFIX,
    termRC,
    infoPath,
};

