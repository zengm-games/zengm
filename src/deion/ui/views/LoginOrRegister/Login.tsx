import React, { FormEvent } from "react";
import { ACCOUNT_API_URL, fetchWrapper } from "../../../common";
import { localActions, realtimeUpdate, toWorker } from "../../util";
type Props = {
	ajaxErrorMsg: string;
};
type State = {
	errorMessage: string | undefined;
};

class Login extends React.Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = {
			errorMessage: undefined,
		};
		this.handleSubmit = this.handleSubmit.bind(this);
	}

	async handleSubmit(e: FormEvent) {
		e.preventDefault();
		this.setState({
			errorMessage: undefined,
		});

		const element = document.getElementById("login");
		if (!(element instanceof HTMLFormElement)) {
			this.setState({
				errorMessage: "login element not found",
			});
			throw new Error("login element not found");
		}

		const formData = new FormData(element);

		try {
			const data = await fetchWrapper({
				url: `${ACCOUNT_API_URL}/login.php`,
				method: "POST",
				data: formData,
				credentials: "include",
			});

			if (data.success) {
				const currentTimestamp = Math.floor(Date.now() / 1000);
				localActions.update({
					gold: currentTimestamp <= data.gold_until,
					username: data.username,
				});

				// Check for participation achievement, if this is the first time logging in to this sport
				await toWorker("main", "checkParticipationAchievement", false);
				realtimeUpdate(["account"], "/account");
			} else {
				this.setState({
					errorMessage: "Invalid username or password.",
				});
			}
		} catch (err) {
			this.setState({
				errorMessage: this.props.ajaxErrorMsg,
			});
		}
	}

	render() {
		return (
			<>
				<h2>Login</h2>
				<form onSubmit={this.handleSubmit} id="login">
					<input type="hidden" name="sport" value={process.env.SPORT} />
					<div className="form-group">
						<label htmlFor="login-username">Username</label>
						<input
							type="text"
							className="form-control"
							id="login-username"
							name="username"
							required
						/>
					</div>
					<div className="form-group">
						<label htmlFor="login-password">Password</label>
						<input
							type="password"
							className="form-control"
							id="login-password"
							name="password"
							required
						/>
					</div>
					<button type="submit" className="btn btn-primary">
						Login
					</button>
					<p className="text-danger mt-3">{this.state.errorMessage}</p>
				</form>
				<a href="/account/lost_password">Lost password?</a>
			</>
		);
	}
}

export default Login;
