import {
	GAME_ACRONYM,
	LEAGUE_DATABASE_VERSION,
} from "../../../common/constants.ts";
import { confirm } from "../../util/confirm.tsx";
import { downloadFile } from "../../util/downloadFile.ts";
import { toWorker } from "../../util/toWorker.ts";

const ExportButton = ({ dirty }: { dirty?: boolean }) => (
	<button
		className="btn btn-light-bordered"
		onClick={async () => {
			if (dirty) {
				const proceed = await confirm(
					"This export will not contain any unsaved changes. Is that okay?",
					{
						okText: "Download last saved defaults",
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
