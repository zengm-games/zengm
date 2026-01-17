import type { View } from "../../common/types.ts";
import useTitleBar from "../hooks/useTitleBar.tsx";
import { ImportPlayersInner } from "./ImportPlayers.tsx";

const ImportPlayers = (props: View<"importPlayers">) => {
	useTitleBar({
		title: "Import Real Players",
		dropdownView: "import_players_real",
	});

	return <ImportPlayersInner {...props} real />;
};

export default ImportPlayers;
