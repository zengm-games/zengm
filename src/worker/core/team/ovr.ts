import ovrBasketball from "./ovr.basketball";
import ovrFootball from "./ovr.football";

const ovr = (
	players: {
		ratings: {
			ovr: number;
			pos: string;
		};
	}[],
) => {
	if (process.env.SPORT === "football") {
		return ovrFootball(players);
	}

	return ovrBasketball(players);
};

export default ovr;
