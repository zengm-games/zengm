import { useEffect, useRef, useState } from "react";
import { confirmable, createConfirmation } from "react-confirm";
import { helpers } from "../../util/index.ts";
import Modal from "../../components/Modal.tsx";

const Confirm = confirmable<
	{
		p: any;
	},
	string | undefined
>(({ show, proceed, p }) => {
	const numbers = Object.keys(p.retirableJerseyNumbers);
	const [number, setNumber] = useState(() => {
		let maxSeasons = -Infinity;
		let selectedNumber;
		for (const number of numbers) {
			const seasons = p.retirableJerseyNumbers[number];
			if (seasons.length >= maxSeasons) {
				maxSeasons = seasons.length;
				selectedNumber = number;
			}
		}
		return selectedNumber;
	});

	const inputRef = useRef<HTMLSelectElement>(null);

	useEffect(() => {
		if (inputRef.current) {
			inputRef.current.focus();
		}
	}, []);

	const cancel = () => proceed(undefined);
	const ok = () => proceed(number);

	return (
		<Modal show={show} onHide={cancel}>
			<Modal.Header closeButton>Retire {p.name}'s jersey number</Modal.Header>
			<Modal.Body>
				<form
					onSubmit={(event) => {
						event.preventDefault();
						ok();
					}}
				>
					<div className="d-flex">
						<div className="flex-grow-1 me-2">
							<select
								ref={inputRef}
								className="form-select"
								onChange={(event) => {
									setNumber(event.target.value);
								}}
								value={number}
							>
								{numbers.map((number) => (
									<option key={number} value={number}>
										#{number} (
										{helpers
											.yearRanges(p.retirableJerseyNumbers[number])
											.join(", ")}
										)
									</option>
								))}
							</select>
						</div>
						<button className="btn btn-primary" onClick={ok}>
							Retire jersey number
						</button>
					</div>
				</form>
			</Modal.Body>
		</Modal>
	);
});

const confirmFunction = createConfirmation(Confirm);

const playerRetireJerseyNumberDialog = (p: any) => {
	return confirmFunction({
		p,
	});
};

export default playerRetireJerseyNumberDialog;
