import { useId, useState } from "react";
import { Modal } from "../../components/Modal.tsx";
import type { GameAttributesLeague } from "../../../common/types.ts";

// After loading a file, let the user pick which awards to import, and whether to delete the existing awards first
export const ImportModal = ({
	awards,
	onCancel,
	onImport,
	show,
}: {
	awards: GameAttributesLeague["awards"];
	onCancel: () => void;
	onImport: (info: {
		awards: GameAttributesLeague["awards"];
		deleteExisting: boolean;
	}) => Promise<void>;
	show: boolean;
}) => {
	const [selected, setSelected] = useState(() => awards.map(() => true));
	const [deleteExisting, setDeleteExisting] = useState(true);

	// The modal is always rendered so it can animate open/closed, so start over when a new file is loaded
	const [prevAwards, setPrevAwards] = useState(awards);
	if (awards !== prevAwards) {
		setPrevAwards(awards);
		setSelected(awards.map(() => true));
		setDeleteExisting(true);
	}
	const [processing, setProcessing] = useState(false);
	const id = useId();

	const numSelected = selected.filter(Boolean).length;

	return (
		<Modal show={show} onHide={onCancel} scrollable>
			<Modal.Header closeButton>
				<Modal.Title>Import award settings</Modal.Title>
			</Modal.Header>
			<Modal.Body>
				<div className="mb-2">
					<button
						className="btn btn-link p-0"
						type="button"
						onClick={() => {
							setSelected(awards.map(() => true));
						}}
					>
						Select all
					</button>{" "}
					|{" "}
					<button
						className="btn btn-link p-0"
						type="button"
						onClick={() => {
							setSelected(awards.map(() => false));
						}}
					>
						Select none
					</button>
				</div>
				{awards.map((award, i) => (
					<div className="form-check" key={i}>
						<input
							type="checkbox"
							className="form-check-input"
							id={`${id}-${i}`}
							checked={selected[i]}
							onChange={() => {
								setSelected((oldSelected) =>
									oldSelected.map((checked, j) =>
										i === j ? !checked : checked,
									),
								);
							}}
						/>
						<label className="form-check-label" htmlFor={`${id}-${i}`}>
							{award.name} ({award.shortName})
						</label>
					</div>
				))}
				<div className="form-check mt-3">
					<input
						type="checkbox"
						className="form-check-input"
						id={`${id}-delete`}
						checked={deleteExisting}
						onChange={() => {
							setDeleteExisting((checked) => !checked);
						}}
					/>
					<label className="form-check-label" htmlFor={`${id}-delete`}>
						Delete existing awards
					</label>
				</div>
			</Modal.Body>
			<Modal.Footer>
				<button
					className="btn btn-secondary"
					type="button"
					disabled={processing}
					onClick={onCancel}
				>
					Cancel
				</button>
				<button
					className="btn btn-primary"
					type="button"
					disabled={numSelected === 0 || processing}
					onClick={async () => {
						setProcessing(true);
						try {
							await onImport({
								awards: awards.filter((award, i) => selected[i]),
								deleteExisting,
							});
						} finally {
							setProcessing(false);
						}
					}}
				>
					Import
				</button>
			</Modal.Footer>
		</Modal>
	);
};
