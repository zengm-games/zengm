const prefixStatOpp = (teamOpponent: string, key: string) => {
	if (teamOpponent === "opponent") {
		return `opp${key[0].toUpperCase()}${key.slice(1)}`;
	}

	return key;
};

export default prefixStatOpp;
