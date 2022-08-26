import type { View } from "../../common/types";
import useTitleBar from "../hooks/useTitleBar";
import { LiveGame } from "./LiveGame";

const ExhibitionGame = ({ liveSim }: View<"exhibitionGame">) => {
	const teamName = (t: typeof liveSim["initialBoxScore"]["teams"][number]) =>
		`${t.season} ${t.region} ${t.name}`;
	useTitleBar({
		title: "Exhibition Game",
		titleLong: `Exhibition Game » ${teamName(
			liveSim.initialBoxScore.teams[0],
		)} vs ${teamName(liveSim.initialBoxScore.teams[1])}`,
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
