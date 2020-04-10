import toUI from "./toUI";
import { LocalStateUI } from "../../common/types";

const games: LocalStateUI["games"] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(gid => {
	let teams: LocalStateUI["games"][number]["teams"] = [
		{
			pts: Math.round(Math.random() * 10 + 100),
			ovr: 50,
			tid: 0,
		},
		{
			pts: Math.round(Math.random() * 10 + 100),
			ovr: 50,
			tid: Math.floor(1 + 29 * Math.random()),
		},
	];

	if (Math.random() < 0.5) {
		teams = [teams[1], teams[0]];
	}

	return {
		gid,
		season: 2020,
		teams,
	};
});
games.push({
	gid: 10,
	season: 2020,
	teams: [
		{
			ovr: 50,
			tid: 0,
		},
		{
			ovr: 50,
			tid: 1,
		},
	],
});

const initUILocalGames = async () => {
	await toUI("setLocal", [
		{
			games,
		},
	]);
};

export default initUILocalGames;
