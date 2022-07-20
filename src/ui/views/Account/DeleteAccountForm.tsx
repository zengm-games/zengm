import classNames from "classnames";
import { useEffect, useRef, useState } from "react";
import { Modal } from "react-bootstrap";
import { ACCOUNT_API_URL, fetchWrapper, GAME_NAME } from "../../../common";
import { toWorker, realtimeUpdate } from "../../util";
import { ajaxErrorMsg } from "../LoginOrRegister";

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
	const [password, setPassword] = useState("");

	useEffect(() => {
		if (show) {
			setInvalidPassword(false);
			setPassword("");
		}
	}, [show]);

	useEffect(() => {
		// Ugly hack that became necessary when upgrading reactstrap from v6 to v8
		setTimeout(() => {
			if (inputRef.current) {
				inputRef.current.select();
			}
		}, 0);
	}, []);

	const deleteAccount = async () => {
		setInvalidPassword(false);

		let response;
		try {
			response = await fetchWrapper({
				url: `${ACCOUNT_API_URL}/delete_account.php`,
				method: "POST",
				data: {
					sport: process.env.SPORT,
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
			setInvalidPassword(true);
		} else {
			cancel("Unknown error");
		}
	};

	return (
		<Modal animation show={show} onHide={cancel}>
			<Modal.Header closeButton>
				<h5 className="modal-title">Delete Account</h5>
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
					onSubmit={event => {
						event.preventDefault();
						deleteAccount();
					}}
				>
					<input
						ref={inputRef}
						type="password"
						className={classNames("form-control", {
							"is-invalid": invalidPassword,
						})}
						onChange={event => {
							setPassword(event.target.value);
						}}
						placeholder="Password"
						value={password}
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
				<button className="btn btn-danger" onClick={deleteAccount}>
					Delete Account
				</button>
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

	if (showGoldActive) {
		return (
			<p>
				You must cancel your ZenGM Gold subscription before you delete your
				account. If you're having any trouble with that, please contact{" "}
				<a href="mailto:jeremy@zengm.com">jeremy@zengm.com</a>.
			</p>
		);
	}
	return (
		<>
			<p>
				This will delete your account with username <b>{username}</b> for{" "}
				{GAME_NAME} and all other ZenGM games.
			</p>
			<p>
				This only affects your achievements, not your leagues. Leagues are
				stored locally on your device, independent of your account. To delete
				your leagues, <a href="/">go to the main page</a> and either delete them
				individually or go to Tools &gt; Delete All Leagues.
			</p>

			<button
				className="btn btn-danger"
				onClick={async () => {
					setShowDialog(true);
				}}
			>
				Delete Account
			</button>

			{errorMessage ? (
				<div className="text-danger mt-3">{errorMessage}</div>
			) : null}

			<Dialog
				show={showDialog}
				username={username}
				cancel={errorMessage => {
					if (errorMessage) {
						setErrorMessage(errorMessage);
					}
					setShowDialog(false);
				}}
				ok={async () => {
					setErrorMessage(undefined);
					setShowDialog(false);

					await toWorker("main", "checkAccount", undefined);
					await toWorker("main", "realtimeUpdate", ["account"]);
					await realtimeUpdate([], "/");
				}}
			/>
		</>
	);
};

export default DeleteAccountForm;
