const downloadFile = (fileName: string, contents: string, mimeType: string) => {
	// Magic number from http://stackoverflow.com/a/18925211/786644 to force UTF-8 encoding
	const blob = new Blob(["\ufeff", contents], {
		type: mimeType,
	});
	const a = document.createElement("a");
	a.download = fileName;
	a.href = URL.createObjectURL(blob);
	a.dataset.downloadurl = [mimeType, a.download, a.href].join(":");
	a.style.display = "none";

	if (!document.body) {
		throw new Error("Should never happen");
	}

	document.body.appendChild(a);
	a.click();

	if (!document.body) {
		throw new Error("Should never happen");
	}

	document.body.removeChild(a);
	setTimeout(() => {
		URL.revokeObjectURL(a.href);
	}, 1500);
};

export default downloadFile;
