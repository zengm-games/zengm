import { useState, type SubmitEvent } from "react";
import { ACCOUNT_API_URL } from "../../common/constants.ts";
import { ActionButton } from "../components/ActionButton.tsx";
import useTitleBar from "../hooks/useTitleBar.tsx";
import { ajaxErrorMsg } from "./LoginOrRegister/index.tsx";
import { fetchWrapper } from "../../common/fetchWrapper.ts";

const LostPassword = () => {
	const [result, setResult] = useState<
		{ success: boolean; message: string } | undefined
	>();
	const [submitting, setSubmitting] = useState(false);

	const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
		event.preventDefault();
		setSubmitting(true);
		setResult(undefined);

		const formData = new FormData(event.currentTarget);

		try {
			const data = await fetchWrapper({
				url: `${ACCOUNT_API_URL}/lost_password.php`,
				method: "POST",
				data: formData,
				credentials: "include",
			});

			if (data.success) {
				setResult({
					success: true,
					message: "Check your email for further instructions.",
				});
			} else {
				setResult({
					success: false,
					message: "Account not found.",
				});
			}
		} catch (error) {
			console.error(error);
			setResult({
				success: false,
				message: ajaxErrorMsg,
			});
		}

		setSubmitting(false);
	};
	useTitleBar({ title: "Lost Password", hideNewWindow: true });

	return (
		<>
			<p>
				Enter your username or email address below to recover your login
				information.
			</p>
			<div className="row">
				<div className="col-lg-4 col-md-4 col-sm-6">
					<form onSubmit={handleSubmit}>
						<input type="hidden" name="sport" value={__SPORT} />
						<div className="mb-3">
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
						<ActionButton type="submit" processing={submitting}>
							Recover login info
						</ActionButton>
						{result ? (
							<p
								className={`mt-3 ${result.success ? "text-success" : "text-danger"}`}
							>
								{result.message}
							</p>
						) : null}
					</form>
				</div>
			</div>
		</>
	);
};

export default LostPassword;
