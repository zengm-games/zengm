import namesBasketball from "./lib/namesBasketball.js";
import namesFootball from "./lib/namesFootball.js";
import fs from "node:fs";
import path from "node:path";
import { getDirname } from "./lib/getDirname.js";

const __dirname = getDirname(import.meta.url);

const basketball = namesBasketball();
fs.writeFileSync(
	path.join(__dirname, "names-manual/basketball.json"),
	JSON.stringify(basketball, null, 2),
);

const football = namesFootball();
fs.writeFileSync(
	path.join(__dirname, "names-manual/football.json"),
	JSON.stringify(football, null, 2),
);
