import { useEffect, useRef } from "react";
import { confirmable, createConfirmation } from "react-confirm";
import Modal from "../../components/Modal.tsx";

type Args = {
	text: string;
	deleteButtonText: string;
	deleteChildrenText: string | undefined;
	siblings: {
		key: number;
		text: string;
	}[];
};

const Confirm = confirmable<
	Args,
	{
		proceed: boolean;
		key?: number;
	}
>(({ show, proceed, deleteButtonText, deleteChildrenText, text, siblings }) => {
	const selectRef = useRef<HTMLSelectElement>(null);
	const ok = () => {
		// Use this rather than controlled state to more easily handle the default (don't need to specify the logic to hide "delete" twice)
		const key =
			!selectRef.current || selectRef.current.value === "delete"
				? undefined
				: Number.parseInt(selectRef.current.value);

		proceed({
			proceed: true,
			key,
		});
	};
	const cancel = () => {
		proceed({
			proceed: false,
		});
	};

	useEffect(() => {
		if (selectRef.current) {
			selectRef.current.focus();
		}
	}, []);

	return (
		<Modal show={show} onHide={cancel}>
			<Modal.Body>
				{text}
				<form
					className="mt-3"
					onSubmit={(event) => {
						event.preventDefault();
						ok();
					}}
				>
					<select ref={selectRef} className="form-select">
						{deleteChildrenText !== undefined ? (
							<option value="delete">{deleteChildrenText}</option>
						) : null}
						{siblings.map(({ key, text }) => (
							<option key={key} value={key}>
								{text}
							</option>
						))}
					</select>
				</form>
			</Modal.Body>

			<Modal.Footer>
				<button className="btn btn-secondary" onClick={cancel}>
					Cancel
				</button>
				<button className="btn btn-primary" onClick={ok}>
					{deleteButtonText}
				</button>
			</Modal.Footer>
		</Modal>
	);
});

const confirmFunction = createConfirmation(Confirm);

const confirmDeleteWithChildren = (args: Args) => {
	return confirmFunction(args);
};

export default confirmDeleteWithChildren;
