import classNames from "classnames";
import React, { FormEvent } from "react";
import { ACCOUNT_API_URL, fetchWrapper } from "../../../common";
import { helpers, localActions, realtimeUpdate, toWorker } from "../../util";
const sport = helpers.upperCaseFirstLetter(process.env.SPORT);
const otherSport =
	process.env.SPORT === "basketball" ? "Football" : "Basketball";
type Props = {
	ajaxErrorMsg: string;
};
type State = {
	errorMessageEmail: string | undefined;
	errorMessageOverall: string | undefined;
	errorMessagePassword: string | undefined;
	errorMessagePassword2: string | undefined;
	errorMessageUsername: string | undefined;
};

class Register extends React.Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = {
			errorMessageEmail: undefined,
			errorMessageOverall: undefined,
			errorMessagePassword: undefined,
			errorMessagePassword2: undefined,
			errorMessageUsername: undefined,
		};
		this.handleSubmit = this.handleSubmit.bind(this);
	}

	async handleSubmit(e: FormEvent) {
		e.preventDefault();
		this.setState({
			errorMessageEmail: undefined,
			errorMessageOverall: undefined,
			errorMessagePassword: undefined,
			errorMessagePassword2: undefined,
			errorMessageUsername: undefined,
		});

		const element = document.getElementById("register");
		if (!(element instanceof HTMLFormElement)) {
			this.setState({
				errorMessageOverall: "register element not found",
			});
			throw new Error("register element not found");
		}

		const formData = new FormData(element);

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
							updatedState.errorMessagePassword === undefined
								? ""
								: updatedState.errorMessagePassword; // So it gets highlighted too

						updatedState.errorMessagePassword2 = data.errors[error];
					}
				}

				// @ts-ignore
				this.setState(updatedState);
			}
		} catch (err) {
			console.log(err);
			this.setState({
				errorMessageOverall: this.props.ajaxErrorMsg,
			});
		}
	}

	render() {
		return (
			<>
				<h2>Register</h2>
				<p className="alert alert-primary">
					Accounts are shared between {sport} GM and{" "}
					<a href={`https://play.${otherSport.toLowerCase()}-gm.com/`}>
						{otherSport} GM
					</a>
					, so if you already have a{" "}
					<a href={`https://play.${otherSport.toLowerCase()}-gm.com/`}>
						{otherSport} GM
					</a>{" "}
					account, you don't need to create a new one.
				</p>
				<form onSubmit={this.handleSubmit} id="register">
					<input type="hidden" name="sport" value={process.env.SPORT} />
					<div
						className={classNames("form-group", {
							"text-danger": this.state.errorMessageUsername !== undefined,
						})}
					>
						<label htmlFor="register-username">Username</label>
						<input
							type="text"
							className={classNames("form-control", {
								"is-invalid": this.state.errorMessageUsername !== undefined,
							})}
							id="register-username"
							name="username"
							required
							maxLength={15}
							pattern="[A-Za-z-0-9-_]+"
							title="Letters, numbers, dashes (-), and underscores (_) only"
						/>
						<span className="form-text text-muted">
							Letters, numbers, dashes (-), and underscores (_) only. Max 15
							characters.
						</span>
						<span className="form-text">{this.state.errorMessageUsername}</span>
					</div>
					<div
						className={classNames("form-group", {
							"text-danger": this.state.errorMessageEmail !== undefined,
						})}
					>
						<label htmlFor="register-email">Email Address</label>
						<input
							type="email"
							className={classNames("form-control", {
								"is-invalid": this.state.errorMessageEmail !== undefined,
							})}
							id="register-email"
							name="email"
							required
						/>
						<span className="form-text">{this.state.errorMessageEmail}</span>
					</div>
					<div
						className={classNames("form-group", {
							"text-danger": this.state.errorMessagePassword !== undefined,
						})}
					>
						<label htmlFor="register-password">Password</label>
						<input
							type="password"
							className={classNames("form-control", {
								"is-invalid": this.state.errorMessagePassword !== undefined,
							})}
							id="register-password"
							name="password"
							required
						/>
						<span className="form-text">{this.state.errorMessagePassword}</span>
					</div>
					<div
						className={classNames("form-group", {
							"text-danger": this.state.errorMessagePassword2 !== undefined,
						})}
					>
						<label htmlFor="register-password2">Verify Password</label>
						<input
							type="password"
							className={classNames("form-control", {
								"is-invalid": this.state.errorMessagePassword2 !== undefined,
							})}
							id="register-password2"
							name="password2"
							required
						/>
						<span className="form-text">
							{this.state.errorMessagePassword2}
						</span>
					</div>
					<div className="form-group form-check">
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
					<button type="submit" className="btn btn-primary">
						Create New Account
					</button>
					<p className="text-danger mt-3">{this.state.errorMessageOverall}</p>
				</form>
			</>
		);
	}
}

export default Register;
