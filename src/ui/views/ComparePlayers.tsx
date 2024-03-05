import useTitleBar from "../hooks/useTitleBar";
import type { View } from "../../common/types";

const ComparePlayers = ({
	availablePlayers,
	playoffs,
	players,
}: View<"comparePlayers">) => {
	useTitleBar({
		title: "Compare Players",
	});

	console.log({
		availablePlayers,
		playoffs,
		players,
	});

	return (
		<>
			<p>FOO</p>
		</>
	);
};

export default ComparePlayers;
