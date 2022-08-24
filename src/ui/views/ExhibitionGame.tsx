import type { View } from "../../common/types";
import useTitleBar from "../hooks/useTitleBar";
import { LiveGame } from "./LiveGame";

const ExhibitionGame = (props: View<"exhibitionGame">) => {
	const teamName = (t: typeof props["initialBoxScore"]["teams"][number]) =>
		`${t.season} ${t.region} ${t.name}`;
	useTitleBar({
		title: "Exhibition Game",
		titleLong: `Exhibition Game » ${teamName(
			props.initialBoxScore.teams[0],
		)} vs ${teamName(props.initialBoxScore.teams[1])}`,
		hideNewWindow: true,
	});

	return <LiveGame {...props} />;
};

export default ExhibitionGame;
