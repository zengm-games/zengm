import { useCallback, useEffect, useRef, useState } from "react";
import { confirmable, createConfirmation } from "react-confirm";
import Modal from "../components/Modal.tsx";

const Confirm = confirmable<
	{
		confirmation: string;
		defaultValue?: string;
		okText?: string;
		cancelText?: string;
	},
	boolean | string | null
>(({ show, proceed, confirmation, defaultValue, okText, cancelText }) => {
	okText = okText ?? "OK";
	cancelText = cancelText ?? "Cancel";
	const [controlledValue, setControlledValue] = useState(defaultValue ?? "");
	const ok = useCallback(
		() => proceed(defaultValue === undefined ? true : controlledValue),
		[controlledValue, defaultValue, proceed],
	);
	const cancel = useCallback(
		() => proceed(defaultValue === undefined ? false : null),
		[defaultValue, proceed],
	);
	const inputRef = useRef<HTMLInputElement>(null);
	const okRef = useRef<HTMLButtonElement>(null);

	useEffect(() => {
		if (inputRef.current) {
			inputRef.current.select();
		} else if (okRef.current) {
			okRef.current.focus();
		}
	}, []);

	return (
		<Modal
			show={show}
			onHide={cancel}
			className="highest-modal"
			backdropClassName="highest-modal-backdrop"
		>
			<Modal.Body>
				{confirmation}
				{defaultValue !== undefined ? (
					<form
						className="mt-3"
						onSubmit={(event) => {
							event.preventDefault();
							ok();
						}}
					>
						<input
							ref={inputRef}
							type="text"
							className="form-control"
							value={controlledValue}
							onChange={(event) => {
								setControlledValue(event.target.value);
							}}
						/>
					</form>
				) : null}
			</Modal.Body>

			<Modal.Footer>
				<button className="btn btn-secondary" onClick={cancel}>
					{cancelText}
				</button>
				<button className="btn btn-primary" onClick={ok} ref={okRef}>
					{okText}
				</button>
			</Modal.Footer>
		</Modal>
	);
});

const confirmFunction = createConfirmation(Confirm);

function confirm(
	message: string,
	options: {
		defaultValue: string;
		okText?: string;
		cancelText?: string;
	},
): Promise<string | null>;

function confirm(
	message: string,
	options?: {
		defaultValue?: undefined;
		okText?: string;
		cancelText?: string;
	},
): Promise<boolean>;

function confirm(
	message: string,
	{
		defaultValue,
		okText,
		cancelText,
	}: {
		defaultValue?: string;
		okText?: string;
		cancelText?: string;
	} = {},
) {
	return confirmFunction({
		confirmation: message,
		defaultValue,
		okText,
		cancelText,
	});
}

export default confirm;
