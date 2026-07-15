import { useState } from "react";
import { WEBSITE_ROOT } from "../../common/constants.ts";
import { showNotification } from "./showNotification.ts";

const PersistentStorageNotification = () => {
	const [status, setStatus] = useState<"init" | "success" | "fail">("init");

	let contents;
	if (status === "success") {
		contents = (
			<>
				<b className="text-success">Success!</b> You can always view your
				persistent storage settings by going to Tools &gt; Global Settings.
			</>
		);
	} else if (status === "fail") {
		contents = (
			<>
				<b className="text-danger">Failed to enable persistent storage!</b> You
				can always view your persistent storage settings by going to Tools &gt;
				Global Settings.
			</>
		);
	} else {
		contents = (
			<>
				<div>
					Game data is stored in your browser profile, so{" "}
					<a
						href={`https://${WEBSITE_ROOT}/manual/faq/#missing-leagues`}
						target="_blank"
					>
						your browser may delete it if disk space is low
					</a>
					. Enabling persistent storage helps protect against this.
				</div>
				<button
					className="btn btn-primary mt-2"
					onClick={async () => {
						const result = await navigator.storage.persist();
						if (result) {
							setStatus("success");
						} else {
							setStatus("fail");
						}
					}}
				>
					Enable persistent storage
				</button>
			</>
		);
	}

	return (
		<>
			<b>Persistent Storage</b>
			<div className="mt-2">{contents}</div>
		</>
	);
};

export const requestPersistentStorage = async () => {
	if (
		navigator.storage &&
		navigator.storage.persist &&
		navigator.storage.persisted
	) {
		let persisted = await navigator.storage.persisted();

		if (!persisted) {
			try {
				if (navigator.permissions && navigator.permissions.query) {
					const permission = await navigator.permissions.query({
						name: "persistent-storage",
					});

					// If possible to get persistent storage without prompting the user, do it!
					if (permission.state === "granted") {
						persisted = await navigator.storage.persist();
					}

					if (!persisted || permission.state === "prompt") {
						await showNotification({
							extraClass: "",
							type: "info",
							text: <PersistentStorageNotification />,
							persistent: true,
						});
					}
				}
			} catch (error) {
				// Old browsers might error if they don't recognize the "persistent-storage" permission, but who cares
				console.error(error);
			}
		}
	}
};
