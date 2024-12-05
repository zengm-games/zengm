import namesBasketball from "./lib/namesBasketball.js";
import namesFootball from "./lib/namesFootball.js";
import fs from "node:fs";
import path from "node:path";

const basketball = namesBasketball();
fs.writeFileSync(
	path.join(import.meta.dirname, "names-manual/basketball.json"),
	JSON.stringify(basketball, null, 2),
);

const football = namesFootball();
fs.writeFileSync(
	path.join(import.meta.dirname, "names-manual/football.json"),
	JSON.stringify(football, null, 2),
);
