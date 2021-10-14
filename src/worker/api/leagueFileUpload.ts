const initialCheck = (file: File) => {
	return new Promise((resolve, reject) => {
		const reader = new self.FileReader();

		reader.onload = async event => {
			const leagueFile = JSON.parse((event.currentTarget as any).result);
			resolve(leagueFile);
		};

		reader.onerror = () => {
			reject(reader.error);
		};

		reader.onabort = () => {
			reject(new Error("FileReader abort"));
		};

		reader.readAsText(file);
	});
};

export default {
	initialCheck,
};
