import React, { useState, FormEvent } from "react";
import { ACCOUNT_API_URL, fetchWrapper } from "../../common";
import useTitleBar from "../hooks/useTitleBar";

const ajaxErrorMsg =
	"Error connecting to server. Check your Internet connection or try again later.";

type State = {
	errorMessage?: string;
	successMessage?: string;
};

const LostPassword = () => {
	const [state, setState] = useState<State>({
		errorMessage: undefined,
		successMessage: undefined,
	});

	const handleSubmit = async (event: FormEvent) => {
		event.preventDefault();

		const element = document.getElementById("lostpw");
		if (!(element instanceof HTMLFormElement)) {
			setState({
				errorMessage: "lostpw element not found",
				successMessage: undefined,
			});
			throw new Error("lostpw element not found");
		}

		const formData = new FormData(element);

		setState({
			errorMessage: undefined,
			successMessage: undefined,
		});

		try {
			const data = await fetchWrapper({
				url: `${ACCOUNT_API_URL}/lost_password.php`,
				method: "POST",
				data: formData,
				credentials: "include",
			});

			if (data.success) {
				setState({
					errorMessage: undefined,
					successMessage: "Check your email for further instructions.",
				});
			} else {
				setState({
					successMessage: undefined,
					errorMessage: "Account not found.",
				});
			}
		} catch (err) {
			setState({
				successMessage: undefined,
				errorMessage: ajaxErrorMsg,
			});
			throw err;
		}
	};
	useTitleBar({ title: "Lost Password", hideNewWindow: true });

	return (
		<>
			<div className="row">
				<div className="col-lg-4 col-md-4 col-sm-6">
					<p>
						Enter your username or email address below to recover your login
						information.
					</p>
					<form onSubmit={handleSubmit} id="lostpw">
						<input type="hidden" name="sport" value={process.env.SPORT} />
						<div className="form-group">
							<label className="col-form-label" htmlFor="lostpw-entry">
								Username or Email Address
							</label>
							<input
								type="text"
								className="form-control"
								id="lostpw-entry"
								name="entry"
								required
							/>
						</div>
						<button type="submit" className="btn btn-primary">
							Recover Login Info
						</button>
						<p className="text-danger mt-3" id="lostpw-error">
							{state.errorMessage}
						</p>
						<p className="text-success mt-3" id="lostpw-success">
							{state.successMessage}
						</p>
					</form>
				</div>
			</div>
		</>
	);
};

export default LostPassword;
