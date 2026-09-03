import { toWorker } from "../../util/toWorker.ts";
import { ImportFileButton } from "../../components/ImportFileButton.tsx";

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
					onImport(basicInfo.gameAttributes);
				} else {
					onError("League file does not contain any settings.");
				}
			} catch (error) {
				onError(error.message);
			}
		}}
	/>
);
