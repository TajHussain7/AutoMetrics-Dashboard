"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
var parse_1 = require("parse");
// Initialize Parse with your Back4App credentials
parse_1.default.initialize(process.env.VITE_PARSE_APP_ID, process.env.VITE_PARSE_JS_KEY);
parse_1.default.serverURL = "https://parseapi.back4app.com/";
exports.default = parse_1.default;
