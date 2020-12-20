const gameAttributeHasHistory = (gameAttribute: any) => {
	return (
		Array.isArray(gameAttribute) &&
		gameAttribute.length > 0 &&
		gameAttribute[0] &&
		typeof gameAttribute[0].start === "number"
	);
};

export default gameAttributeHasHistory;
