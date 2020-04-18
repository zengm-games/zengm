import classNames from "classnames";
import PropTypes from "prop-types";
import React, { useEffect, useState, ReactNode, FormEvent } from "react";
import { ACCOUNT_API_URL, fetchWrapper } from "../../common";
import useTitleBar from "../hooks/useTitleBar";
import { localActions, realtimeUpdate } from "../util";
import type { View } from "../../common/types";

const ajaxErrorMsg =
	"Error connecting to server. Check your Internet connection or try again later.";

type State = {
	globalMessage?: ReactNode;
	errorMessageOverall?: string;
	errorMessagePassword?: string;
	errorMessagePassword2?: string;
	showForm: boolean;
};

const ResetPassword = ({ token }: View<"resetPassword">) => {
	const [state, setState] = useState<State>({
		globalMessage: "Validating token...", // Because on initial page load you need AJAX request to see if it's valid
		showForm: false,
	});

	useEffect(() => {
		const checkToken = async () => {
			// First, see if this is a valid token
			try {
				const data = await fetchWrapper({
					url: `${ACCOUNT_API_URL}/reset_password.php`,
					method: "POST",
					data: {
						action: "check_token",
						token,
						sport: process.env.SPORT,
					},
					credentials: "include",
				});

				if (data.success) {
					setState(state2 => ({
						...state2,
						globalMessage: undefined,
						showForm: true,
					}));
				} else {
					setState(state2 => ({
						...state2,
						globalMessage: (
							<>
								Invalid password reset token.{" "}
								<a href="/account/lost_password">
									Request another and try again.
								</a>
							</>
						),
						showForm: false,
					}));
				}
			} catch (err) {
				setState(state2 => ({
					...state2,
					globalMessage: <span className="text-danger">{ajaxErrorMsg}</span>,
					showForm: false,
				}));
			}
		};

		checkToken();
	}, [token]);

	const handleSubmit = async (event: FormEvent) => {
		event.preventDefault();

		setState({
			...state,
			errorMessageOverall: undefined,
			errorMessagePassword: undefined,
			errorMessagePassword2: undefined,
		});

		const element = document.getElementById("resetpw");
		if (!(element instanceof HTMLFormElement)) {
			setState(state2 => ({
				...state2,
				errorMessageOverall: "resetpw element not found",
			}));
			throw new Error("resetpw element not found");
		}

		const formData = new FormData(element);

		try {
			const data = await fetchWrapper({
				url: `${ACCOUNT_API_URL}/reset_password.php`,
				method: "POST",
				data: formData,
				credentials: "include",
			});

			if (data.success) {
				localActions.update({ username: data.username });

				realtimeUpdate([], "/account");
			} else {
				const updatedState = {
					...state,
				};

				for (const error of Object.keys(data.errors)) {
					if (error === "password") {
						updatedState.errorMessagePassword = data.errors[error];
					} else if (error === "password2") {
						updatedState.errorMessagePassword2 = data.errors[error];
					} else if (error === "passwords") {
						updatedState.errorMessagePassword =
							updatedState.errorMessagePassword === undefined
								? ""
								: updatedState.errorMessagePassword; // So it gets highlighted too
						updatedState.errorMessagePassword2 = data.errors[error];
					}
				}

				setState(updatedState);
			}
		} catch (err) {
			setState({
				...state,
				errorMessageOverall: ajaxErrorMsg,
			});
		}
	};

	useTitleBar({ title: "Reset Password", hideNewWindow: true });

	const form = (
		<div className="row">
			<div className="col-lg-4 col-md-5 col-sm-6">
				<p>Enter a new password for your account below.</p>
				<form id="resetpw" onSubmit={handleSubmit}>
					<input type="hidden" name="sport" value={process.env.SPORT} />
					<input type="hidden" name="action" value="reset_password" />
					<input type="hidden" name="token" value={token} />
					<div
						className={classNames("form-group", {
							"text-danger": state.errorMessagePassword !== undefined,
						})}
					>
						<label className="col-form-label" htmlFor="resetpw-password">
							Password
						</label>
						<input
							type="password"
							className={classNames("form-control", {
								"is-invalid": state.errorMessagePassword !== undefined,
							})}
							id="resetpw-password"
							name="password"
							required
						/>
						<span className="form-text">{state.errorMessagePassword}</span>
					</div>
					<div
						className={classNames("form-group", {
							"text-danger": state.errorMessagePassword2 !== undefined,
						})}
					>
						<label className="col-form-label" htmlFor="resetpw-password2">
							Verify Password
						</label>
						<input
							type="password"
							className={classNames("form-control", {
								"is-invalid": state.errorMessagePassword2 !== undefined,
							})}
							id="resetpw-password2"
							name="password2"
							required
						/>
						<span className="form-text">{state.errorMessagePassword2}</span>
					</div>
					<button type="submit" className="btn btn-primary">
						Reset Password
					</button>
					<p className="text-danger mt-3">{state.errorMessageOverall}</p>
				</form>
			</div>
		</div>
	);

	return (
		<>
			{state.showForm ? form : null}
			{state.globalMessage ? <p>{state.globalMessage}</p> : null}
			<p>
				If you are having trouble with this, please{" "}
				<a href="mailto:commissioner@basketball-gm.com">
					email commissioner@basketball-gm.com
				</a>
				.
			</p>
		</>
	);
};

ResetPassword.propTypes = {
	token: PropTypes.string.isRequired,
};

export default ResetPassword;
