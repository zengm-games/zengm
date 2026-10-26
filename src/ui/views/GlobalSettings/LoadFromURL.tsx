import { useState, type SyntheticEvent } from "react";
import useLocalStorageState from "use-local-storage-state";
import { fetchUserURL } from "../../../common/fetchUserURL.ts";

export const LoadFromURL = ({
	label,
	localStorageKey,
	onLoad,
}: {
	label: string;
	localStorageKey: string;
	onLoad: (json: string) => void;
}) => {
	const [url, setURL] = useLocalStorageState(localStorageKey, {
		defaultValue: "",
	});
	const [status, setStatus] = useState<
		| { type: "initial" | "loading" | "done" }
		| { type: "error"; message: string }
	>({ type: "initial" });

	const load = async (event: SyntheticEvent) => {
		event.preventDefault();

		setStatus({ type: "loading" });
		try {
			const response = await fetchUserURL(url);
			let json;
			try {
				json = await response.json();
			} catch {
				throw new Error("Invalid JSON");
			}
			onLoad(JSON.stringify(json, null, 2));
			setStatus({ type: "done" });
		} catch (error) {
			setStatus({ type: "error", message: error.message });
		}
	};

	return (
		<div className="mb-2">
			<div className="input-group">
				<input
					aria-label={`${label} URL`}
					type="text"
					className="form-control"
					placeholder="Load from URL"
					value={url}
					onChange={(event) => {
						setURL(event.target.value);
						setStatus({ type: "initial" });
					}}
					onKeyDown={(event) => {
						// This is so "Enter" loads the file, rather than submitting the whole form
						if (event.key === "Enter") {
							load(event);
						}
					}}
				/>
				<button
					className="btn btn-secondary"
					type="button"
					onClick={load}
					disabled={url === "" || status.type === "loading"}
				>
					Load
				</button>
			</div>
			{status.type === "error" ? (
				<div className="text-danger mt-1">Error: {status.message}</div>
			) : status.type === "done" ? (
				<div className="text-success mt-1">
					Loaded. Click "Save global settings" to apply it.
				</div>
			) : null}
		</div>
	);
};
