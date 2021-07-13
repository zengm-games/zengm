const takeScreenshot = async () => {
	const { default: takeScreenshotChunk } = await import(
		"./takeScreenshotChunk"
	);
	takeScreenshotChunk();
};

export default takeScreenshot;
