import type { View } from "../../common/types.ts";
import useTitleBar from "../hooks/useTitleBar.tsx";
import { LiveGame } from "./LiveGame/index.tsx";
import { teamsInDisplayOrder } from "../util/boxScoreDisplayOrder.ts";

const ExhibitionGame = ({ liveSim }: View<"exhibitionGame">) => {
	const teamName = (t: (typeof liveSim)["initialBoxScore"]["teams"][number]) =>
		`${t.season} ${t.region} ${t.name}`;
	const [awayTeam, homeTeam] = teamsInDisplayOrder(
		liveSim.initialBoxScore.teams,
	);
	useTitleBar({
		title: "Exhibition Game",
		titleLong: `Exhibition Game » ${teamName(awayTeam)} vs ${teamName(homeTeam)}`,
		hideNewWindow: true,
	});

	return (
		<>
			<p>
				<a href="/exhibition">Sim another exhibition game</a>
			</p>
			<LiveGame {...liveSim} />
		</>
	);
};

export default ExhibitionGame;
