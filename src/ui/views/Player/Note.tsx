import { useState, type ReactNode } from "react";
import { toWorker } from "../../util";

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

const Note = ({
	note,
	info,
	infoLink,
}: {
	note: string | undefined;
	info: NoteInfo;
	infoLink?: ReactNode;
}) => {
	const [editing, setEditing] = useState(false);
	const [editedNote, setEditedNote] = useState(note ?? "");

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
					{infoLink}
				</div>
			</form>
		);
	}

	const name = info.type === "player" ? "player" : "team";

	if (note === undefined || note === "") {
		return (
			<button
				type="button"
				className="btn btn-light-bordered btn-sm"
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
				{note}
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
