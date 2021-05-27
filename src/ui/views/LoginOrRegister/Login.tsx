import { FormEvent, useRef, useState } from "react";
import { ACCOUNT_API_URL, fetchWrapper } from "../../../common";
import { localActions, realtimeUpdate, toWorker } from "../../util";

const Login = ({ ajaxErrorMsg }: { ajaxErrorMsg: string }) => {
	const [errorMessage, setErrorMessage] = useState<string | undefined>();
	const formRef = useRef<HTMLFormElement>(null);

	const handleSubmit = async (event: FormEvent) => {
		event.preventDefault();

		setErrorMessage(undefined);

		if (!formRef.current) {
			throw new Error("login element not found");
		}

		const formData = new FormData(formRef.current);

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
				setErrorMessage("Invalid username or password.");
			}
		} catch (error) {
			console.error(error);
			setErrorMessage(ajaxErrorMsg);
		}
	};

	return (
		<>
			<h2>Login</h2>
			<form onSubmit={handleSubmit} ref={formRef}>
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
				<p className="text-danger mt-3">{errorMessage}</p>
			</form>
			<a href="/account/lost_password">Lost password?</a>
		</>
	);
};

export default Login;
