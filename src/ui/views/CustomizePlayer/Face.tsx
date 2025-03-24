import { useEffect } from "react";
import { PlayerPicture } from "../../components";

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
						// @ts-expect-error
					},
					"*",
				);
			}
		};
		window.addEventListener("message", listener);

		return () => {
			window.removeEventListener("message", listener);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<div className="row">
			<div className="col-sm-4">
				<div style={{ maxHeight: "225px", maxWidth: "150px" }}>
					{parsedFace ? <PlayerPicture face={parsedFace} /> : "Invalid JSON"}
				</div>
			</div>
			<div className="col-sm-8">
				<p>
					You can edit this JSON here, but you'll probably find it easier to use{" "}
					<a
						href={`${process.env.NODE_ENV === "development" ? "http://localhost:5173" : "https://zengm.com"}/facesjs/editor/#${faceCount},${faceHash}`}
						target="_blank"
						rel="opener"
					>
						the face editor
					</a>{" "}
					and copy the results back here. Team colors set there will be
					overridden here.
				</p>
				<textarea
					className="form-control"
					onChange={(event) => {
						onChange(event.target.value);
					}}
					rows={10}
					value={face}
				/>
				<div className="d-flex gap-2 mt-2">
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
							console.log("EDIT");
						}}
					>
						Paste JSON
					</button>
				</div>
			</div>
		</div>
	);
};
