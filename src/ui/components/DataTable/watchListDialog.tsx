import { useEffect, useRef } from "react";
import { confirmable, createConfirmation } from "react-confirm";
import Modal from "../Modal.tsx";
import { range } from "../../../common/utils.ts";
import { Flag } from "../WatchBlock.tsx";
import { helpers } from "../../util/index.ts";

const Confirm = confirmable<
	{
		numPlayers: number;
		numWatchColors: number;
	},
	number | null
>(({ show, proceed, numPlayers, numWatchColors }) => {
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (inputRef.current) {
			inputRef.current.select();
		}
	}, []);

	const cancel = () => proceed(null);

	return (
		<Modal animation show={show} onHide={cancel}>
			<Modal.Body>
				<h3>
					Which watch list do you want to add{" "}
					{helpers.plural(
						"this player",
						numPlayers,
						`these ${numPlayers} players`,
					)}{" "}
					to?
				</h3>
				<div className="d-flex flex-wrap gap-2">
					{range(numWatchColors + 1).map((watch) => {
						return (
							<button
								key={watch}
								className="btn btn-light"
								onClick={() => {
									proceed(watch);
								}}
							>
								{watch === 0 ? "Clear" : watch} <Flag watch={watch} />
							</button>
						);
					})}
				</div>
			</Modal.Body>

			<Modal.Footer>
				<button className="btn btn-secondary" onClick={cancel}>
					Cancel
				</button>
			</Modal.Footer>
		</Modal>
	);
});

const confirmFunction = createConfirmation(Confirm);

export const watchListDialog = (arg: {
	numPlayers: number;
	numWatchColors: number;
}) => {
	return confirmFunction(arg);
};
