import { parseCliParams } from "./lib/parseCliParams.ts";
import { startServer } from "./lib/server.ts";

const { exposeToNetwork } = parseCliParams();
await startServer({
	exposeToNetwork,
	waitForBuild: undefined,
});
