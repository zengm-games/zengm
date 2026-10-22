import clsx from "clsx";
import { type SubmitEvent, useState } from "react";
import { ACCOUNT_API_URL } from "../../../common/constants.ts";
import { toWorker } from "../../util/toWorker.ts";
import { realtimeUpdate } from "../../util/realtimeUpdate.ts";
import { localActions } from "../../util/local.ts";
import { ActionButton } from "../../components/ActionButton.tsx";
import { analyticsEvent } from "../../util/analyticsEvent.ts";
import { GameLinks } from "../../components/GameLinks.tsx";
import { fetchWrapper } from "../../../common/fetchWrapper.ts";
import { type FieldErrors, getFieldErrors } from "./getFieldErrors.ts";

export const fields = {
	username: {
		inputProps: {
			type: "text",
			required: true,
			maxLength: 15,
			pattern: String.raw`[\w\-]+`,
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

const Register = ({ ajaxErrorMsg }: { ajaxErrorMsg: string }) => {
	const [submitting, setSubmitting] = useState(false);
	const [errors, setErrors] = useState<FieldErrors>({});

	const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
		event.preventDefault();
		setSubmitting(true);
		setErrors({});

		const formData = new FormData(event.currentTarget);

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

				analyticsEvent("sign_up");
			} else {
				setSubmitting(false);
				setErrors(getFieldErrors(data.errors));
			}
		} catch (error) {
			console.error(error);
			setSubmitting(false);
			setErrors({ overall: ajaxErrorMsg });
		}
	};

	return (
		<>
			<h2>Register</h2>
			<p className="alert alert-primary">
				Accounts are shared between <GameLinks />.
			</p>
			<form onSubmit={handleSubmit}>
				<input type="hidden" name="sport" value={__SPORT} />
				<div className="mb-3">
					<label className="form-label" htmlFor="register-username">
						Username
					</label>
					<input
						className={clsx("form-control", {
							"is-invalid": errors.username !== undefined,
						})}
						id="register-username"
						name="username"
						{...fields.username.inputProps}
					/>
					<div className="form-text text-body-secondary">
						{fields.username.description}
					</div>
					{errors.username ? (
						<div className="form-text text-danger">{errors.username}</div>
					) : null}
				</div>
				<div className="mb-3">
					<label className="form-label" htmlFor="register-email">
						Email Address
					</label>
					<input
						className={clsx("form-control", {
							"is-invalid": errors.email !== undefined,
						})}
						id="register-email"
						name="email"
						{...fields.email.inputProps}
					/>
					{errors.email ? (
						<div className="form-text text-danger">{errors.email}</div>
					) : null}
				</div>
				<div className="mb-3">
					<label className="form-label" htmlFor="register-password">
						Password
					</label>
					<input
						className={clsx("form-control", {
							"is-invalid": errors.password !== undefined,
						})}
						id="register-password"
						name="password"
						{...fields.password.inputProps}
						autoComplete="new-password"
					/>
					{errors.password ? (
						<div className="form-text text-danger">{errors.password}</div>
					) : null}
				</div>
				<div className="mb-3">
					<label className="form-label" htmlFor="register-password2">
						Repeat Password
					</label>
					<input
						className={clsx("form-control", {
							"is-invalid": errors.password2 !== undefined,
						})}
						id="register-password2"
						name="password2"
						{...fields.password.inputProps}
						autoComplete="new-password"
					/>
					{errors.password2 ? (
						<div className="form-text text-danger">{errors.password2}</div>
					) : null}
				</div>
				<div className="mb-3 form-check">
					<input
						type="checkbox"
						className="form-check-input"
						id="register-mailinglist"
						name="mailinglist"
					/>
					<label className="form-check-label" htmlFor="register-mailinglist">
						Join the mailing list (one email per quarter)
					</label>
				</div>
				<ActionButton type="submit" processing={submitting}>
					Create New Account
				</ActionButton>
				{errors.overall ? (
					<p className="text-danger mt-3">{errors.overall}</p>
				) : null}
			</form>
		</>
	);
};

export default Register;
