import { useState } from "react";
import { helpers, toWorker } from "../../util/index.ts";
import clsx from "clsx";

const MAX_WIDTH = 600;

export type NoteInfo =
	| {
			type: "draftPick";
			dpid: number;
	  }
	| {
			type: "game";
			gid: number;
	  }
	| {
			type: "player";
			pid: number;
	  }
	| {
			type: "teamSeason";
			tid: number;
			season: number;
	  };

const Note = (
	props:
		| {
				initialNote: string | undefined;
				note?: undefined;
				info: NoteInfo;
				infoLink?: boolean;
				xs?: boolean;
		  }
		| {
				initialNote?: undefined;
				note: string | undefined;
				info: NoteInfo;
				infoLink?: boolean;
				xs?: boolean;
		  },
) => {
	const { initialNote, note, info, infoLink, xs } = props;

	const [editing, setEditing] = useState(false);
	const [editedNote, setEditedNote] = useState(initialNote ?? note ?? "");

	if (editing) {
		return (
			<form
				onSubmit={async (event) => {
					event.preventDefault();
					await toWorker("main", "setNote", {
						...info,
						editedNote,
					});
					setEditing(false);
				}}
			>
				<textarea
					className="form-control"
					rows={5}
					onChange={(event) => {
						setEditedNote(event.target.value);
					}}
					style={{ maxWidth: MAX_WIDTH }}
					value={editedNote}
				/>

				<div className="mt-2 d-flex gap-2" style={{ maxWidth: MAX_WIDTH }}>
					<button type="submit" className="btn btn-primary btn-sm">
						Save
					</button>
					<button
						type="reset"
						className="btn btn-light-bordered btn-sm"
						onClick={async () => {
							setEditing(false);
						}}
					>
						Cancel
					</button>
					{infoLink ? (
						<div className="ms-auto">
							<a href={helpers.leagueUrl(["notes", info.type])}>View all</a>
						</div>
					) : null}
				</div>
			</form>
		);
	}

	const name =
		info.type === "draftPick"
			? "draft pick"
			: info.type === "game"
				? "game"
				: info.type === "player"
					? "player"
					: "team";

	const noteToShow = Object.hasOwn(props, "initialNote") ? editedNote : note;

	if (noteToShow === undefined || noteToShow === "") {
		return (
			<button
				type="button"
				className={clsx("btn btn-light-bordered", xs ? "btn-xs" : "btn-sm")}
				onClick={() => {
					setEditing(true);
				}}
			>
				Add {name} note
			</button>
		);
	}

	return (
		<>
			<div
				className={"overflow-auto small-scrollbar"}
				style={{ whiteSpace: "pre-line", maxHeight: 300, maxWidth: MAX_WIDTH }}
			>
				{noteToShow}
			</div>
			<button
				type="button"
				className="btn btn-light-bordered btn-sm mt-2"
				onClick={() => {
					setEditing(true);
				}}
			>
				Edit {name} note
			</button>
		</>
	);
};

export default Note;
