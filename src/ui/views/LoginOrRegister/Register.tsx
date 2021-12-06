import classNames from "classnames";
import { FormEvent, useRef, useState } from "react";
import { ACCOUNT_API_URL, fetchWrapper } from "../../../common";
import { localActions, realtimeUpdate, toWorker } from "../../util";
import { ActionButton, GameLinks } from "../../components";

export const fields = {
	username: {
		inputProps: {
			type: "text",
			required: true,
			maxLength: 15,
			pattern: "[A-Za-z-0-9-_]+",
			title: "Letters, numbers, dashes (-), and underscores (_) only",
			autoComplete: "username",
		},
		description:
			"Letters, numbers, dashes (-), and underscores (_) only. Max 15 characters.",
	},
	email: {
		inputProps: {
			type: "email",
			required: true,
		},
	},
	password: {
		inputProps: {
			type: "password",
			required: true,
		},
	},
};

type State = {
	submitting: boolean;
	errorMessageEmail: string | undefined;
	errorMessageOverall: string | undefined;
	errorMessagePassword: string | undefined;
	errorMessagePassword2: string | undefined;
	errorMessageUsername: string | undefined;
};

const Register = ({ ajaxErrorMsg }: { ajaxErrorMsg: string }) => {
	const [state, setState] = useState<State>({
		submitting: false,
		errorMessageEmail: undefined,
		errorMessageOverall: undefined,
		errorMessagePassword: undefined,
		errorMessagePassword2: undefined,
		errorMessageUsername: undefined,
	});
	const formRef = useRef<HTMLFormElement>(null);

	const handleSubmit = async (event: FormEvent) => {
		event.preventDefault();
		setState({
			submitting: true,
			errorMessageEmail: undefined,
			errorMessageOverall: undefined,
			errorMessagePassword: undefined,
			errorMessagePassword2: undefined,
			errorMessageUsername: undefined,
		});

		if (!formRef.current) {
			throw new Error("login element not found");
		}
		const formData = new FormData(formRef.current);

		try {
			const data = await fetchWrapper({
				url: `${ACCOUNT_API_URL}/register.php`,
				method: "POST",
				data: formData,
				credentials: "include",
			});

			if (data.success) {
				localActions.update({
					username: data.username,
				});
				await toWorker("main", "checkParticipationAchievement", true);
				realtimeUpdate([], "/account");
			} else {
				const updatedState: Partial<State> = {};

				for (const error of Object.keys(data.errors)) {
					if (error === "username") {
						updatedState.errorMessageUsername = data.errors[error];
					} else if (error === "email") {
						updatedState.errorMessageEmail = data.errors[error];
					} else if (error === "password") {
						updatedState.errorMessagePassword = data.errors[error];
					} else if (error === "password2") {
						updatedState.errorMessagePassword2 = data.errors[error];
					} else if (error === "passwords") {
						updatedState.errorMessagePassword =
							updatedState.errorMessagePassword ?? ""; // So it gets highlighted too

						updatedState.errorMessagePassword2 = data.errors[error];
					}
				}

				setState(state2 => ({
					...state2,
					...updatedState,
					submitting: false,
				}));
			}
		} catch (error) {
			console.error(error);
			setState(state2 => ({
				...state2,
				submitting: false,
				errorMessageOverall: ajaxErrorMsg,
			}));
		}
	};

	return (
		<>
			<h2>Register</h2>
			<p className="alert alert-primary">
				Accounts are shared between <GameLinks />.
			</p>
			<form onSubmit={handleSubmit} ref={formRef}>
				<input type="hidden" name="sport" value={process.env.SPORT} />
				<div className="mb-3">
					<label className="form-label" htmlFor="register-username">
						Username
					</label>
					<input
						className={classNames("form-control", {
							"is-invalid": state.errorMessageUsername !== undefined,
						})}
						id="register-username"
						name="username"
						{...fields.username.inputProps}
					/>
					<span className="form-text text-muted">
						{fields.username.description}
					</span>
					<span
						className={classNames("form-text", {
							"text-danger": state.errorMessageUsername !== undefined,
						})}
					>
						{state.errorMessageUsername}
					</span>
				</div>
				<div className="mb-3">
					<label className="form-label" htmlFor="register-email">
						Email Address
					</label>
					<input
						className={classNames("form-control", {
							"is-invalid": state.errorMessageEmail !== undefined,
						})}
						id="register-email"
						name="email"
						{...fields.email.inputProps}
					/>
					<span
						className={classNames("form-text", {
							"text-danger": state.errorMessageEmail !== undefined,
						})}
					>
						{state.errorMessageEmail}
					</span>
				</div>
				<div className="mb-3">
					<label className="form-label" htmlFor="register-password">
						Password
					</label>
					<input
						className={classNames("form-control", {
							"is-invalid": state.errorMessagePassword !== undefined,
						})}
						id="register-password"
						name="password"
						{...fields.password.inputProps}
						autoComplete="new-password"
					/>
					<span
						className={classNames("form-text", {
							"text-danger": state.errorMessagePassword !== undefined,
						})}
					>
						{state.errorMessagePassword}
					</span>
				</div>
				<div className="mb-3">
					<label className="form-label" htmlFor="register-password2">
						Repeat Password
					</label>
					<input
						className={classNames("form-control", {
							"is-invalid": state.errorMessagePassword2 !== undefined,
						})}
						id="register-password2"
						name="password2"
						{...fields.password.inputProps}
						autoComplete="new-password"
					/>
					<span
						className={classNames("form-text", {
							"text-danger": state.errorMessagePassword2 !== undefined,
						})}
					>
						{state.errorMessagePassword2}
					</span>
				</div>
				<div className="mb-3 form-check">
					<input
						type="checkbox"
						defaultChecked
						className="form-check-input"
						id="register-mailinglist"
						name="mailinglist"
					/>
					<label className="form-check-label" htmlFor="register-mailinglist">
						Join the mailing list (one email per quarter)
					</label>
				</div>
				<ActionButton type="submit" processing={state.submitting}>
					Create New Account
				</ActionButton>
				{state.errorMessageOverall ? (
					<p className="text-danger mt-3">{state.errorMessageOverall}</p>
				) : null}
			</form>
		</>
	);
};

export default Register;
