import { resetFileInput } from "../../util";
import { IMPORT_FILE_STYLE } from "../Settings/RowsEditor";

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
			onChange={event => {
				if (!event.target.files) {
					return;
				}
				const file = event.target.files[0];
				if (!file) {
					return;
				}

				onBeforeImport();

				const reader = new window.FileReader();
				reader.readAsText(file);

				reader.onload = async event2 => {
					try {
						// @ts-expect-error
						const leagueFile = JSON.parse(event2.currentTarget.result);
						if (leagueFile.gameAttributes) {
							onImport(leagueFile.gameAttributes);
						} else {
							onError("League file does not contain any settings.");
						}
					} catch (error) {
						onError(error.message);
						return;
					}
				};
			}}
		/>
	</button>
);

export default ImportButton;
