import clsx from "clsx";
import { type ChangeEvent, type SubmitEvent, useState } from "react";
import { ACCOUNT_API_URL } from "../../../common/constants.ts";
import { ActionButton } from "../../components/ActionButton.tsx";
import { realtimeUpdate } from "../../util/realtimeUpdate.ts";
import { ajaxErrorMsg } from "../LoginOrRegister/index.tsx";
import { fields } from "../LoginOrRegister/Register.tsx";
import { fetchWrapper } from "../../../common/fetchWrapper.ts";
import {
	type FieldErrors,
	getFieldErrors,
} from "../LoginOrRegister/getFieldErrors.ts";

const formGroupStyle = {
	width: 300,
};

type EditableField = "username" | "email" | "password";

const AccountInfoForm = ({
	initialEmail,
	initialUsername,
}: {
	initialEmail: string;
	initialUsername: string;
}) => {
	const initialValues = {
		username: initialUsername,
		email: initialEmail,
		newPassword: "",
		newPassword2: "",
		oldPassword: "",
	};
	const [values, setValues] = useState(initialValues);
	const [editing, setEditing] = useState<Record<EditableField, boolean>>({
		username: false,
		email: false,
		password: false,
	});
	const [submitting, setSubmitting] = useState(false);
	const [errors, setErrors] = useState<FieldErrors>({});
	const [saved, setSaved] = useState(false);

	const handleChange =
		(field: keyof typeof values) => (event: ChangeEvent<HTMLInputElement>) => {
			setValues({
				...values,
				[field]: event.target.value,
			});
		};

	// Clicking "Cancel" resets that field to its initial value and clears its errors
	const handleEditCancel = (field: EditableField) => () => {
		if (editing[field]) {
			const fieldNames =
				field === "password"
					? (["newPassword", "newPassword2"] as const)
					: ([field] as const);
			const newValues = { ...values };
			const newErrors = { ...errors };
			for (const fieldName of fieldNames) {
				newValues[fieldName] = initialValues[fieldName];
				delete newErrors[fieldName];
			}
			setValues(newValues);
			setErrors(newErrors);
		}

		setEditing({
			...editing,
			[field]: !editing[field],
		});
		setSaved(false);
	};

	const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
		event.preventDefault();
		setSubmitting(true);
		setErrors({});
		setSaved(false);

		const toSubmit: Record<string, string> = {
			sport: __SPORT,
			oldPassword: values.oldPassword,
		};
		if (editing.username) {
			toSubmit.username = values.username;
		}
		if (editing.email) {
			toSubmit.email = values.email;
		}
		if (editing.password) {
			toSubmit.newPassword = values.newPassword;
			toSubmit.newPassword2 = values.newPassword2;
		}

		try {
			const data = await fetchWrapper({
				url: `${ACCOUNT_API_URL}/update_account.php`,
				method: "POST",
				data: toSubmit,
				credentials: "include",
			});

			if (data.success) {
				await realtimeUpdate(["account"], "/account");

				setSaved(true);

				setEditing({
					username: false,
					email: false,
					password: false,
				});
				setValues((values2) => ({
					...values2,
					newPassword: "",
					newPassword2: "",
					oldPassword: "",
				}));
			} else {
				setErrors(getFieldErrors(data.errors));
			}
		} catch (error) {
			console.error(error);
			setErrors({ overall: ajaxErrorMsg });
		}

		setSubmitting(false);
	};

	return (
		<form onSubmit={handleSubmit}>
			<div
				className="d-md-flex"
				style={{
					gap: "3rem",
				}}
			>
				<div style={formGroupStyle}>
					<div className="mb-3" style={formGroupStyle}>
						<label className="form-label" htmlFor="account-username">
							Username
						</label>
						<div className="input-group">
							<input
								className={clsx("form-control", {
									"is-invalid": errors.username !== undefined,
								})}
								id="account-username"
								{...fields.username.inputProps}
								value={values.username}
								onChange={handleChange("username")}
								disabled={!editing.username}
								required={editing.username}
							/>
							<button
								className="btn btn-secondary"
								type="button"
								onClick={handleEditCancel("username")}
							>
								{editing.username ? "Cancel" : "Edit"}
							</button>
						</div>
						<div className="form-text text-body-secondary">
							{fields.username.description}
						</div>
						{errors.username ? (
							<div className="form-text text-danger">{errors.username}</div>
						) : null}
					</div>

					<div className="mb-3" style={formGroupStyle}>
						<label className="form-label" htmlFor="account-email">
							Email
						</label>
						<div className="input-group">
							<input
								className={clsx("form-control", {
									"is-invalid": errors.email !== undefined,
								})}
								id="account-email"
								{...fields.email.inputProps}
								value={values.email}
								onChange={handleChange("email")}
								disabled={!editing.email}
								required={editing.email}
							/>
							<button
								className="btn btn-secondary"
								type="button"
								onClick={handleEditCancel("email")}
							>
								{editing.email ? "Cancel" : "Edit"}
							</button>
						</div>
						{errors.email ? (
							<div className="form-text text-danger">{errors.email}</div>
						) : null}
					</div>
				</div>

				<div style={formGroupStyle}>
					<div className="mb-3" style={formGroupStyle}>
						<label className="form-label" htmlFor="account-new-password">
							New Password
						</label>
						<div className="input-group">
							<input
								className={clsx("form-control", {
									"is-invalid": errors.newPassword !== undefined,
								})}
								id="account-new-password"
								{...fields.password.inputProps}
								value={values.newPassword}
								onChange={handleChange("newPassword")}
								disabled={!editing.password}
								required={editing.password}
								autoComplete="new-password"
							/>
							<button
								className="btn btn-secondary"
								type="button"
								onClick={handleEditCancel("password")}
							>
								{editing.password ? "Cancel" : "Edit"}
							</button>
						</div>
						{errors.newPassword ? (
							<div className="form-text text-danger">{errors.newPassword}</div>
						) : null}
					</div>

					<div className="mb-3" style={formGroupStyle}>
						<label className="form-label" htmlFor="account-new-password-2">
							Repeat New Password
						</label>
						<input
							className={clsx("form-control", {
								"is-invalid": errors.newPassword2 !== undefined,
							})}
							id="account-new-password-2"
							{...fields.password.inputProps}
							value={values.newPassword2}
							onChange={handleChange("newPassword2")}
							disabled={!editing.password}
							required={editing.password}
							autoComplete="new-password"
						/>
						{errors.newPassword2 ? (
							<div className="form-text text-danger">{errors.newPassword2}</div>
						) : null}
					</div>
				</div>
			</div>

			<div className="mb-3" style={formGroupStyle}>
				<label className="form-label" htmlFor="account-old-password">
					Confirm Current Password
				</label>
				<input
					className={clsx("form-control", {
						"is-invalid": errors.oldPassword !== undefined,
					})}
					id="account-old-password"
					{...fields.password.inputProps}
					value={values.oldPassword}
					onChange={handleChange("oldPassword")}
					autoComplete="current-password"
				/>
				{errors.oldPassword ? (
					<div className="form-text text-danger">{errors.oldPassword}</div>
				) : null}
			</div>

			<ActionButton
				type="submit"
				processing={submitting}
				disabled={!editing.username && !editing.email && !editing.password}
			>
				Save changes
			</ActionButton>
			{errors.overall ? (
				<p className="text-danger mt-3 mb-0">{errors.overall}</p>
			) : null}
			{saved ? (
				<p className="text-success mt-3 mb-0">Your changes have been saved.</p>
			) : null}
		</form>
	);
};

export default AccountInfoForm;
