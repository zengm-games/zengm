export const parseCliParams = () => {
	const param = process.argv[2];
	let exposeToNetwork = false;
	if (param === "--host") {
		exposeToNetwork = true;
	} else if (param !== undefined) {
		console.log("Invalid CLI argument. The only valid option is --host");
		process.exit(1);
	}

	return { exposeToNetwork };
};
