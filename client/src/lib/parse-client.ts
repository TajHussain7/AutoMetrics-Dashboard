import "dotenv/config";
import Parse from "parse";

// Initialize Parse with your Back4App credentials
Parse.initialize(
  process.env.VITE_PARSE_APP_ID!,
  process.env.VITE_PARSE_JS_KEY!
);

Parse.serverURL = "https://parseapi.back4app.com/";

export default Parse;
