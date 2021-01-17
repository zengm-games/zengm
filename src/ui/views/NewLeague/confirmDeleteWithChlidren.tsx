import { useEffect, useRef, useState } from "react";
import { confirmable, createConfirmation } from "react-confirm";
import { Modal } from "react-bootstrap";

type Args = {
	text: string;
	deleteButtonText: string;
	deleteChildrenText: string;
	siblings: {
		key: number;
		text: string;
	}[];
};

const Confirm = confirmable(
	({
		show,
		proceed,
		deleteButtonText,
		deleteChildrenText,
		text,
		siblings,
	}: Args & {
		show: boolean;
		proceed: any;
	}) => {
		const [controlledValue, setControlledValue] = useState<
			number | undefined
		>();
		const ok = () =>
			proceed({
				proceed: true,
				key: controlledValue,
			});
		const cancel = () =>
			proceed({
				proceed: false,
			});
		const selectRef = useRef<HTMLSelectElement>(null);

		useEffect(() => {
			// Ugly hack that became necessary when upgrading reactstrap from v6 to v8
			setTimeout(() => {
				if (selectRef.current) {
					selectRef.current.focus();
				}
			}, 0);
		}, []);

		return (
			<Modal show={show} onHide={cancel}>
				<Modal.Body>
					{text}
					<form
						className="mt-3"
						onSubmit={event => {
							event.preventDefault();
							ok();
						}}
					>
						<select
							ref={selectRef}
							className="form-control"
							value={controlledValue}
							onChange={event => {
								const value = event.target.value;
								setControlledValue(
									value === "delete" ? undefined : parseInt(value),
								);
							}}
						>
							<option value="delete">{deleteChildrenText}</option>
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
	},
);

const confirmFunction = createConfirmation(Confirm);

// Pass "defaultValue" and it's used as the default value, like window.prompt. Don't pass "defaultValue" and it's like window.confirm.
const confirmDeleteWithChlidren = (
	args: Args,
): Promise<{
	proceed: boolean;
	key?: number;
}> => {
	return confirmFunction(args) as any;
};

export default confirmDeleteWithChlidren;
