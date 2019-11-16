// @flow

const ovr = (players: { ratings: { ovr: number } }[]) => {
	return Math.round(Math.random() * 100);
};

export default ovr;
