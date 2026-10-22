import clsx from "clsx";
import { useEffect, useState, type ReactNode, type SubmitEvent } from "react";
import { ACCOUNT_API_URL, EMAIL_ADDRESS } from "../../common/constants.ts";
import { ActionButton } from "../components/ActionButton.tsx";
import useTitleBar from "../hooks/useTitleBar.tsx";
import { realtimeUpdate } from "../util/realtimeUpdate.ts";
import { localActions } from "../util/local.ts";
import type { View } from "../../common/types.ts";
import { ajaxErrorMsg } from "./LoginOrRegister/index.tsx";
import { fetchWrapper } from "../../common/fetchWrapper.ts";
import {
	type FieldErrors,
	getFieldErrors,
} from "./LoginOrRegister/getFieldErrors.ts";

const ResetPassword = ({ token }: View<"resetPassword">) => {
	// Starts as "checking" because on initial page load you need an AJAX request to see if the token is valid
	const [tokenStatus, setTokenStatus] = useState<
		"checking" | "valid" | "invalid" | "error"
	>("checking");
	const [submitting, setSubmitting] = useState(false);
	const [errors, setErrors] = useState<FieldErrors>({});

	useEffect(() => {
		const checkToken = async () => {
			if (token === undefined) {
				return;
			}

			try {
				const data = await fetchWrapper({
					url: `${ACCOUNT_API_URL}/reset_password.php`,
					method: "POST",
					data: {
						action: "check_token",
						token,
						sport: __SPORT,
					},
					credentials: "include",
				});

				setTokenStatus(data.success ? "valid" : "invalid");
			} catch (error) {
				console.error(error);
				setTokenStatus("error");
			}
		};

		checkToken();
	}, [token]);

	const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
		event.preventDefault();
		setSubmitting(true);
		setErrors({});

		const formData = new FormData(event.currentTarget);

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
				setSubmitting(false);
				if (data.errors) {
					setErrors(getFieldErrors(data.errors));
				} else {
					// No errors means the token is no longer valid, like if it expired since the page was loaded
					setTokenStatus("invalid");
				}
			}
		} catch (error) {
			console.error(error);
			setSubmitting(false);
			setErrors({ overall: ajaxErrorMsg });
		}
	};

	useTitleBar({ title: "Reset Password", hideNewWindow: true });

	let content: ReactNode;
	if (tokenStatus === "checking") {
		content = <p>Validating token...</p>;
	} else if (tokenStatus === "invalid") {
		content = (
			<p>
				Invalid password reset token.{" "}
				<a href="/account/lost_password">Request another and try again.</a>
			</p>
		);
	} else if (tokenStatus === "error") {
		content = <p className="text-danger">{ajaxErrorMsg}</p>;
	} else {
		content = (
			<div className="row">
				<div className="col-lg-4 col-md-5 col-sm-6">
					<p>Enter a new password for your account below.</p>
					<form className="mb-3" onSubmit={handleSubmit}>
						<input type="hidden" name="sport" value={__SPORT} />
						<input type="hidden" name="action" value="reset_password" />
						<input type="hidden" name="token" value={token} />
						<div className="mb-3">
							<label className="col-form-label" htmlFor="resetpw-password">
								Password
							</label>
							<input
								type="password"
								className={clsx("form-control", {
									"is-invalid": errors.password !== undefined,
								})}
								id="resetpw-password"
								name="password"
								autoComplete="new-password"
								required
							/>
							{errors.password ? (
								<div className="form-text text-danger">{errors.password}</div>
							) : null}
						</div>
						<div className="mb-3">
							<label className="col-form-label" htmlFor="resetpw-password2">
								Repeat Password
							</label>
							<input
								type="password"
								className={clsx("form-control", {
									"is-invalid": errors.password2 !== undefined,
								})}
								id="resetpw-password2"
								name="password2"
								autoComplete="new-password"
								required
							/>
							{errors.password2 ? (
								<div className="form-text text-danger">{errors.password2}</div>
							) : null}
						</div>
						<ActionButton type="submit" processing={submitting}>
							Reset password
						</ActionButton>
					</form>
				</div>
			</div>
		);
	}

	return (
		<>
			{content}
			{errors.overall ? <p className="text-danger">{errors.overall}</p> : null}
			<p>
				If you are having trouble with this, please{" "}
				<a href={`mailto:${EMAIL_ADDRESS}`}>email {EMAIL_ADDRESS}</a>.
			</p>
		</>
	);
};

export default ResetPassword;
