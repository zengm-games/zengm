import { toWorker } from "../../util/toWorker.ts";
import { ImportFileButton } from "../../components/ImportFileButton.tsx";
import { unwrapGameAttribute } from "../../../common/unwrapGameAttribute.ts";
import { helpers } from "../../util/helpers.ts";
import type { GameAttributesLeagueWithHistory } from "../../../common/types.ts";

// Default settings have no history, so use the latest value of any game attribute that has one
const unwrapGameAttributes = (
	gameAttributes: Partial<GameAttributesLeagueWithHistory>,
) => {
	const unwrapped: any = {};
	for (const key of helpers.keys(gameAttributes)) {
		unwrapped[key] = unwrapGameAttribute(gameAttributes, key);
	}
	return unwrapped;
};

export const ImportButton = ({
	onBeforeImport,
	onError,
	onImport,
}: {
	onBeforeImport: () => void;
	onError: (errorMessage: string) => void;
	onImport: (settings: any) => void;
}) => (
	<ImportFileButton
		accept=".json,.gz,application/json,application/gzip"
		variant="light-bordered"
		withFile={async (file) => {
			onBeforeImport();

			try {
				const { basicInfo } = await toWorker(
					"leagueFileUpload",
					"initialCheck",
					{
						file,
					},
				);

				if (basicInfo.gameAttributes) {
					onImport(unwrapGameAttributes(basicInfo.gameAttributes));
				} else {
					onError("League file does not contain any settings.");
				}
			} catch (error) {
				onError(error.message);
			}
		}}
	/>
);
