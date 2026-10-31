import clsx from "clsx";
import { useRef, useState } from "react";
import { Modal } from "../../components/Modal.tsx";
import { ACCOUNT_API_URL, GAME_NAME } from "../../../common/constants.ts";
import { toWorker } from "../../util/toWorker.ts";
import { realtimeUpdate } from "../../util/realtimeUpdate.ts";
import { ajaxErrorMsg } from "../LoginOrRegister/index.tsx";
import { fetchWrapper } from "../../../common/fetchWrapper.ts";
import { ActionButton } from "../../components/ActionButton.tsx";

const Dialog = ({
	username,
	show,
	cancel,
	ok,
}: {
	username: string;
	show: boolean;
	cancel: (errorMessage?: string) => void;
	ok: () => void;
}) => {
	const inputRef = useRef<HTMLInputElement>(null);

	const [invalidPassword, setInvalidPassword] = useState(false);
	const [processing, setProcessing] = useState(false);

	const deleteAccount = async () => {
		const password = inputRef.current?.value;
		if (password === undefined || processing) {
			return;
		}

		setInvalidPassword(false);
		setProcessing(true);

		let response;
		try {
			response = await fetchWrapper({
				url: `${ACCOUNT_API_URL}/delete_account.php`,
				method: "POST",
				data: {
					sport: __SPORT,
					password,
				},
				credentials: "include",
			});
		} catch (error) {
			console.error(error);
			cancel(ajaxErrorMsg);
			return;
		}

		if (response.success) {
			ok();
		} else if (response.invalidPassword) {
			setProcessing(false);
			setInvalidPassword(true);
		} else {
			cancel("Unknown error");
		}
	};

	return (
		<Modal
			animation
			show={show}
			onHide={() => {
				cancel();
			}}
			onEnter={() => {
				// Stays mounted while closed so it can animate, so reset state from any previous time it was opened
				setInvalidPassword(false);
				setProcessing(false);
				if (inputRef.current) {
					inputRef.current.value = "";
				}
			}}
			onEntered={() => {
				inputRef.current?.focus();
			}}
		>
			<Modal.Header closeButton>
				<Modal.Title>Delete account</Modal.Title>
			</Modal.Header>
			<Modal.Body>
				<p>
					This will delete your account with username <b>{username}</b>,
					including all your achievements for any ZenGM games you earned while
					logged into your account.
				</p>
				<p>Enter your password below to confirm.</p>
				<form
					className="mt-3"
					onSubmit={(event) => {
						event.preventDefault();
						deleteAccount();
					}}
				>
					<input
						ref={inputRef}
						type="password"
						className={clsx("form-control", {
							"is-invalid": invalidPassword,
						})}
						placeholder="Password"
						autoComplete="current-password"
					/>
					{invalidPassword ? (
						<div className="text-danger form-text">Invalid password</div>
					) : null}
				</form>
			</Modal.Body>

			<Modal.Footer>
				<button
					className="btn btn-secondary"
					onClick={() => {
						cancel();
					}}
				>
					Cancel
				</button>
				<ActionButton
					variant="danger"
					onClick={deleteAccount}
					processing={processing}
					processingText="Deleting"
				>
					Delete account
				</ActionButton>
			</Modal.Footer>
		</Modal>
	);
};

const DeleteAccountForm = ({
	username,
	showGoldActive,
}: {
	username: string;
	showGoldActive: boolean;
}) => {
	const [errorMessage, setErrorMessage] = useState<string | undefined>();
	const [showDialog, setShowDialog] = useState(false);

	return (
		<>
			<p>
				This will delete your account with username <b>{username}</b> for{" "}
				{GAME_NAME} and all other ZenGM games.
				{showGoldActive ? (
					<span className="text-danger">
						{" "}
						This will also cancel your ZenGM Gold subscription.
					</span>
				) : null}
			</p>
			<p>
				This only affects your achievements, not your leagues. Leagues are
				stored locally on your device, independent of your account. To delete
				your leagues, <a href="/">go to the main page</a> and either delete them
				individually or go to Tools &gt; Delete All Leagues.
			</p>

			<button
				className="btn btn-danger"
				onClick={() => {
					setErrorMessage(undefined);
					setShowDialog(true);
				}}
			>
				Delete account
			</button>

			{errorMessage ? (
				<div className="text-danger mt-3">{errorMessage}</div>
			) : null}

			<Dialog
				username={username}
				show={showDialog}
				cancel={(errorMessage) => {
					if (errorMessage) {
						setErrorMessage(errorMessage);
					}
					setShowDialog(false);
				}}
				ok={async () => {
					await toWorker("main", "checkAccount", undefined);
					await toWorker("main", "realtimeUpdate", ["account"]);
					await realtimeUpdate([], "/");
				}}
			/>
		</>
	);
};

export default DeleteAccountForm;
