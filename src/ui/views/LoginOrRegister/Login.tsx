import { FormEvent, useRef, useState } from "react";
import { ACCOUNT_API_URL, fetchWrapper } from "../../../common";
import { ActionButton } from "../../components";
import { localActions, realtimeUpdate, toWorker } from "../../util";

const Login = ({ ajaxErrorMsg }: { ajaxErrorMsg: string }) => {
	const [submitting, setSubmitting] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | undefined>();
	const formRef = useRef<HTMLFormElement>(null);

	const handleSubmit = async (event: FormEvent) => {
		event.preventDefault();

		setSubmitting(true);
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
				const gold = currentTimestamp <= data.gold_until;
				localActions.update({
					gold,
					username: data.username,
				});

				if (gold) {
					await toWorker("main", "initGold", undefined);
				}

				// Check for participation achievement, if this is the first time logging in to this sport
				await toWorker("main", "checkParticipationAchievement", false);
				await toWorker("main", "realtimeUpdate", ["account"]);
				await realtimeUpdate([], "/account");
			} else {
				setSubmitting(false);
				setErrorMessage("Invalid username or password.");
			}
		} catch (error) {
			console.error(error);
			setSubmitting(false);
			setErrorMessage(ajaxErrorMsg);
		}
	};

	return (
		<>
			<h2>Login</h2>
			<form onSubmit={handleSubmit} ref={formRef}>
				<input type="hidden" name="sport" value={process.env.SPORT} />
				<div className="mb-3">
					<label className="form-label" htmlFor="login-username">
						Username
					</label>
					<input
						type="text"
						className="form-control"
						id="login-username"
						name="username"
						autoComplete="username"
						required
					/>
				</div>
				<div className="mb-3">
					<label className="form-label" htmlFor="login-password">
						Password
					</label>
					<input
						type="password"
						className="form-control"
						id="login-password"
						name="password"
						autoComplete="current-password"
						required
					/>
				</div>
				<ActionButton type="submit" processing={submitting}>
					Login
				</ActionButton>
				{errorMessage ? (
					<p className="text-danger mt-3 mb-0">{errorMessage}</p>
				) : null}
			</form>
			<p className="mt-3 mb-0">
				<a href="/account/lost_password">Lost password?</a>
			</p>
		</>
	);
};

export default Login;
