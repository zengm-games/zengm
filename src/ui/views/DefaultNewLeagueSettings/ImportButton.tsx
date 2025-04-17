import { resetFileInput, toWorker } from "../../util/index.ts";
import { IMPORT_FILE_STYLE } from "../Settings/RowsEditor.tsx";

// https://stackoverflow.com/a/35200633/786644
const ImportButton = ({
	onBeforeImport,
	onError,
	onImport,
}: {
	onBeforeImport: () => void;
	onError: (errorMessage: string) => void;
	onImport: (settings: any) => void;
}) => (
	<button
		className="btn btn-light-bordered"
		style={{ position: "relative", overflow: "hidden" }}
		onClick={() => {}}
	>
		Import
		<input
			className="cursor-pointer"
			type="file"
			style={IMPORT_FILE_STYLE}
			onClick={resetFileInput}
			onChange={async (event) => {
				if (!event.target.files) {
					return;
				}
				const file = event.target.files[0];
				if (!file) {
					return;
				}

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
	</button>
);

export default ImportButton;
