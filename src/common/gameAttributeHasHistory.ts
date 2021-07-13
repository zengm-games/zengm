const gameAttributeHasHistory = (gameAttribute: any) => {
	return (
		Array.isArray(gameAttribute) &&
		gameAttribute.length > 0 &&
		gameAttribute[0] &&
		// null check is for league files before importing, since there is no -Infinity in JSON
		(typeof gameAttribute[0].start === "number" ||
			gameAttribute[0].start === null)
	);
};

export default gameAttributeHasHistory;
