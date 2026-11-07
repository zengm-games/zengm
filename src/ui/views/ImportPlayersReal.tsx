import useTitleBar from "../hooks/useTitleBar.tsx";
import { ImportPlayersInner } from "./ImportPlayers.tsx";

const ImportPlayers = () => {
	useTitleBar({
		title: "Import Real Players",
	});

	return <ImportPlayersInner real />;
};

export default ImportPlayers;
