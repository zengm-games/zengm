const { spawn } = require("child_process");
const cloudflare = require("cloudflare");
const getSport = require("./lib/getSport");
const cloudflareConfig = require("../../../.config/cloudflare.json"); // eslint-disable-line import/no-unresolved

const getSubdomain = () => {
	if (process.argv[2] === "beta" || process.argv[2] === "play") {
		return process.argv[2];
	}
	if (process.argv[2] === undefined) {
		return "play";
	}
	throw new Error(
		`Invalid subdomain ${process.argv[2]} - should be either beta or play (default is play)`,
	);
};

const mySpawn = (command, args) => {
	return new Promise(resolve => {
		console.log(`${command} ${args.join(" ")}`);

		const cmd = spawn(command, args, { shell: true, stdio: "inherit" });
		cmd.on("close", code => {
			if (code !== 0) {
				console.log(`child process exited with code ${code}`);
				process.exit(code);
			}
			resolve();
		});
	});
};

(async () => {
	const subdomain = getSubdomain();
	const sport = getSport();
	const domain = `${subdomain}.${sport}-gm.com`;

	console.log(`Deploying to ${domain}...`);

	// Copy gen first, so index.html never links to partial file
	// files is here because real-player-data was briefly there in May 2020, so we don't want to delete it
	const copyAndKeep = ["gen", "files"]; // MAKE SURE TO EXCLUDE FROM DELETION BELOW
	for (const folder of copyAndKeep) {
		console.log(`Copying ${folder}...`);
		await mySpawn("rsync", [
			"-vhrl",
			`./build/${folder}/`,
			`jersch50@garibaldi.dreamhost.com:/home/jersch50/${domain}/${folder}/`,
		]);
	}

	console.log("Copying other files...");
	// files and leagues are here because real-player-data was briefly there in May 2020, so we don't want to delete them
	const excludes = [
		"--exclude",
		"/gen",
		"--exclude",
		"/leagues",
		"--exclude",
		"/files",
		"--exclude",
		"/.well-known",
	];
	if (subdomain === "beta") {
		excludes.push("--exclude", "/sw.js*");
	}
	await mySpawn("rsync", [
		"-vhrl",
		"--delete",
		...excludes,
		"./build/",
		`jersch50@garibaldi.dreamhost.com:/home/jersch50/${domain}/`,
	]);

	if (subdomain !== "beta") {
		console.log("Invalidating Cloudflare cache...");

		const zone = cloudflareConfig.zones[sport];

		const cf = cloudflare({
			email: "jdscheff@gmail.com",
			key: cloudflareConfig.apiKey,
		});

		const response = await cf.zones.purgeCache(zone, {
			purge_everything: true,
		});
		if (!response.success) {
			console.log(response);
		}
	} else {
		console.log("No Cloudfare cache invalidation needed in beta");
	}

	console.log("\nDone!");
})();
