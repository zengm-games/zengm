import useTitleBar from "../hooks/useTitleBar.tsx";
import { ImportPlayersInner } from "./ImportPlayers.tsx";

const ImportPlayers = () => {
	useTitleBar({
		title: "Import Real Players",
		dropdownView: "import_players_real",
	});

	return <ImportPlayersInner real />;
};

export default ImportPlayers;
