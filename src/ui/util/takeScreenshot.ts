const takeScreenshot = async () => {
	const { default: takeScreenshotChunk } = await import(
		"./takeScreenshotChunk.ts"
	);
	takeScreenshotChunk();
};

export default takeScreenshot;
