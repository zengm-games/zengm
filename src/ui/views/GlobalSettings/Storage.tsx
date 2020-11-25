import classNames from "classnames";
import React, { useCallback, useEffect, useState } from "react";
import { helpers } from "../../util";

const Storage = () => {
	const [status, setStatus] = useState<
		| "enabled"
		| "disabled"
		| "failed"
		| "loading..."
		| "not supported by your browser"
	>("loading...");

	useEffect(() => {
		const check = async () => {
			if (navigator.storage && navigator.storage.persisted) {
				const persisted = await navigator.storage.persisted();
				if (persisted) {
					setStatus("enabled");
				} else {
					setStatus("disabled");
				}
			} else {
				setStatus("not supported by your browser");
			}
		};

		check();
	}, []);

	const onClick = useCallback(async event => {
		event.preventDefault();

		if (navigator.storage && navigator.storage.persist) {
			setStatus("loading...");

			const persisted = await navigator.storage.persist();
			if (persisted) {
				setStatus("enabled");
			} else {
				// https://stackoverflow.com/questions/51657388/request-persistent-storage-permissions
				setStatus("failed");
			}
		} else {
			setStatus("not supported by your browser");
		}
	}, []);

	return (
		<>
			<p>
				Since {helpers.upperCaseFirstLetter(process.env.SPORT)} GM stores game
				data in your browser profile,{" "}
				<a href="https://basketball-gm.com/manual/faq/#missing-leagues">
					sometimes it can be inadvertently deleted
				</a>
				. Enabling persistent storage helps protect against this.
			</p>
			<p>
				Status:{" "}
				<span
					className={classNames({
						"text-success": status === "enabled",
						"text-danger": status === "disabled" || status === "failed",
					})}
				>
					{status}
				</span>
			</p>
			{status === "failed" ? (
				<p>
					Sorry, this feature can be tricky to get working in some browsers. If
					you bookmark this page, it might work if you press "Enable" again.
					Otherwise, check back later after playing more and maybe it will work.
				</p>
			) : null}
			{status === "loading..." ||
			status === "disabled" ||
			status === "failed" ? (
				<button
					className="btn btn-light-bordered"
					disabled={status === "loading..."}
					onClick={onClick}
				>
					Enable
				</button>
			) : null}
		</>
	);
};

export default Storage;
