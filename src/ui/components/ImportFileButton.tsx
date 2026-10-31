import type { CSSProperties } from "react";
import { resetFileInput } from "../util/resetFileInput.ts";

const IMPORT_BUTTON_STYLE: CSSProperties = {
	position: "relative",
	overflow: "hidden",
};
export const IMPORT_FILE_STYLE: CSSProperties = {
	position: "absolute",
	top: 0,
	right: 0,
	minWidth: "100%",
	minHeight: "100%",
	fontSize: 100,
	opacity: 0,
	outline: "none",
};

// https://stackoverflow.com/a/35200633/786644
export const ImportFileButton = ({
	accept,
	variant = "secondary",
	withFile,
}: {
	accept: string;
	variant?: "primary" | "secondary" | "god-mode" | "danger" | "light-bordered";
	withFile: (file: File) => void;
}) => {
	return (
		<button className={`btn btn-${variant}`} style={IMPORT_BUTTON_STYLE}>
			Import
			<input
				className="cursor-pointer"
				type="file"
				accept={accept}
				style={IMPORT_FILE_STYLE}
				onClick={resetFileInput}
				onChange={(event) => {
					const file = event.target.files?.[0];
					if (file) {
						withFile(file);
					}
				}}
			/>
		</button>
	);
};
