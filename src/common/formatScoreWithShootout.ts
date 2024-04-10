type Team = {
	pts: number;
	sPts?: number;
};

const formatScoreWithShootout = (t0: Team, t1: Team) => {
	return `${t0.pts}-${t1.pts}${t0.sPts !== undefined ? ` (${t0.sPts}-${t1.sPts})` : ""}`;
};

export default formatScoreWithShootout;
