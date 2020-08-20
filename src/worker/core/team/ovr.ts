import ovrBasketball from "./ovr.basketball";
import ovrFootball from "./ovr.football";

const ovr = (
	players: {
		ratings: {
			ovr: number;
			pos: string;
		};
	}[],
	options: {
		pos?: string;
		rating?: string;
	} = {},
) => {
	if (process.env.SPORT === "football") {
		return ovrFootball(players, options.pos);
	}

	return ovrBasketball(players, options.rating);
};

export default ovr;
