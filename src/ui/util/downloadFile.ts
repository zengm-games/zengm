const downloadFile = (
	fileName: string,
	contents: string | Uint8Array[],
	mimeType: string,
) => {
	let contents2;
	if (typeof contents === "string") {
		// Magic number from http://stackoverflow.com/a/18925211/786644 to force UTF-8 encoding
		contents2 = ["\ufeff", contents];
	} else {
		contents2 = contents;
	}

	const blob = new Blob(contents2, {
		type: mimeType,
	});
	const a = document.createElement("a");
	a.download = fileName;
	a.href = URL.createObjectURL(blob);
	a.dataset.downloadurl = [mimeType, a.download, a.href].join(":");
	a.style.display = "none";

	document.body.appendChild(a);
	a.click();

	document.body.removeChild(a);
	setTimeout(() => {
		URL.revokeObjectURL(a.href);
	}, 1500);
};

export default downloadFile;
