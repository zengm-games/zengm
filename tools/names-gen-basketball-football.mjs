import namesBasketball from "./lib/namesBasketball.mjs";
import namesFootball from "./lib/namesFootball.mjs";
import fs from "fs";
import path from "path";

const __dirname = path.dirname(new URL(import.meta.url).pathname);

const basketball = namesBasketball();
fs.writeFileSync(path.join(__dirname, "names-manual/basketball.json"), JSON.stringify(basketball, null, 2));

const football = namesFootball();
fs.writeFileSync(path.join(__dirname, "names-manual/football.json"), JSON.stringify(football, null, 2));
