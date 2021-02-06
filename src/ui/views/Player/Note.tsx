import { useState } from "react";
import type { Player } from "../../../common/types";
import { toWorker } from "../../util";

const MAX_WIDTH = 600;

const Note = ({ note, pid }: { note: Player["note"]; pid: number }) => {
	const [editing, setEditing] = useState(false);
	const [editedNote, setEditedNote] = useState(note ?? "");

	if (editing) {
		return (
			<form
				className="mt-3"
				onSubmit={async event => {
					event.preventDefault();
					await toWorker("main", "setPlayerNote", pid, editedNote);
					setEditing(false);
				}}
			>
				<textarea
					className="form-control"
					rows={5}
					onChange={event => {
						setEditedNote(event.target.value);
					}}
					style={{ maxWidth: MAX_WIDTH }}
					value={editedNote}
				/>

				<div className="btn-group mt-2">
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
				</div>
			</form>
		);
	}

	if (note === undefined || note === "") {
		return (
			<button
				type="button"
				className="btn btn-light-bordered btn-sm mt-3"
				onClick={() => {
					setEditing(true);
				}}
			>
				Add player note
			</button>
		);
	}

	return (
		<>
			<div
				className="mt-3 overflow-auto"
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
				Edit player note
			</button>
		</>
	);
};

export default Note;
