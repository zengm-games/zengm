import { useEffect, useState } from "react";
import { PlayerPicture } from "../../components/index.tsx";
import clsx from "clsx";

export const Face = ({
	face,
	faceCount,
	onChange,
	randomizeFace,
}: {
	face: string;
	faceCount: number;
	onChange: (face: string) => void;
	randomizeFace: () => void;
}) => {
	let parsedFace;
	try {
		parsedFace = JSON.parse(face);
	} catch {}

	const faceHash = parsedFace ? btoa(JSON.stringify(parsedFace)) : "";

	useEffect(() => {
		const listener = (event: MessageEvent) => {
			// key check is to handle the case where the user opens an editor, switches to another player, and opens another editor. So there are two editors open for two different players - we need to tell which one this is. Can't use pid alone because new players don't have a pid yet!
			if (event.data.type === "facesjs" && event.data.key === faceCount) {
				onChange(JSON.stringify(event.data.value));
				event.source?.postMessage(
					{
						type: "facesjs",
						action: "close",
					},
					// @ts-expect-error
					"*",
				);
			}
		};
		window.addEventListener("message", listener);

		return () => {
			window.removeEventListener("message", listener);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [faceCount]);

	const [editJson, setEditJson] = useState(false);

	return (
		<div className="d-flex gap-3">
			<div style={{ height: 225, width: 150 }}>
				{parsedFace ? <PlayerPicture face={parsedFace} /> : "Invalid JSON"}
			</div>
			<div className="flex-grow-1">
				<div
					className={clsx(
						"d-flex gap-2",
						editJson ? undefined : "mt-4 flex-column align-items-start",
					)}
				>
					<button
						type="button"
						className="btn btn-secondary"
						onClick={() => {
							// Need button rather than link because "open in new tab" seems to interfere with setting window.opener in the new window, even with rel="opener"
							window.open(
								`${process.env.NODE_ENV === "development" ? "http://localhost:5173" : "https://zengm.com"}/facesjs/editor/#${faceCount},${faceHash}`,
								`_blank`,
							);
						}}
					>
						Face editor
					</button>
					<button
						type="button"
						className="btn btn-secondary"
						onClick={randomizeFace}
					>
						Randomize
					</button>
					<button
						type="button"
						className="btn btn-secondary"
						onClick={() => {
							setEditJson((value) => !value);
						}}
					>
						Edit raw JSON
					</button>
				</div>
				{editJson ? (
					<textarea
						className="form-control mt-2"
						onChange={(event) => {
							onChange(event.target.value);
						}}
						rows={10}
						value={face}
					/>
				) : null}
			</div>
		</div>
	);
};
