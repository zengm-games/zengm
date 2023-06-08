import { GAME_ACRONYM, LEAGUE_DATABASE_VERSION } from "../../../common";
import { confirm, downloadFile, local, toWorker } from "../../util";

const ExportButton = () => (
	<button
		className="btn btn-light-bordered"
		onClick={async () => {
			const dirtySettings = local.getState().dirtySettings;
			if (dirtySettings) {
				const proceed = await confirm(
					"This export will not contain any unsaved changes. Is that okay?",
					{
						okText: "Download Last Saved Defaults",
						cancelText: "Cancel",
					},
				);
				if (!proceed) {
					return false;
				}
			}

			const settings = await toWorker(
				"main",
				"getDefaultNewLeagueSettings",
				undefined,
			);

			downloadFile(
				`${GAME_ACRONYM}_default_settings.json`,
				JSON.stringify(
					{ version: LEAGUE_DATABASE_VERSION, gameAttributes: settings },
					null,
					2,
				),
				"application/json",
			);
		}}
	>
		Export
	</button>
);

export default ExportButton;
