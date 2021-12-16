import { useState } from "react";
import { ActionButton } from "../../components";
import { helpers, toWorker } from "../../util";

const WorkerConsole = ({ godMode }: { godMode: boolean }) => {
	const [code, setCode] = useState("");
	const [status, setStatus] = useState<
		| {
				type: "init" | "running" | "done";
		  }
		| {
				type: "error";
				error: Error;
		  }
	>({
		type: "init",
	});

	const disabled = status.type === "running" || !godMode;

	return (
		<>
			{!godMode ? (
				<p className="text-warning">
					This feature is only available in{" "}
					<a href={helpers.leagueUrl(["god_mode"])}>God Mode</a>.
				</p>
			) : null}

			<form
				onSubmit={async event => {
					event.preventDefault();

					setStatus({ type: "running" });
					try {
						await toWorker("main", "evalOnWorker", code);
					} catch (error) {
						console.error(error);
						setStatus({ type: "error", error });
						return;
					}
					setStatus({ type: "done" });
				}}
			>
				<textarea
					className="form-control font-monospace mb-2"
					disabled={disabled}
					rows={10}
					onChange={event => {
						setCode(event.target.value);
						if (status.type === "done") {
							setStatus({ type: "init" });
						}
					}}
					value={code}
				/>

				<div className="d-flex align-items-center">
					<ActionButton
						type="submit"
						disabled={disabled}
						processing={status.type === "running"}
					>
						Run code
					</ActionButton>
					{status.type === "error" ? (
						<div className="text-danger ms-3 fw-bold">Error!</div>
					) : null}
					{status.type === "done" ? (
						<div className="text-success ms-3">Done</div>
					) : null}
				</div>
				{status.type === "error" ? (
					<p className="text-danger mt-2">{status.error.message}</p>
				) : null}
			</form>
		</>
	);
};

export default WorkerConsole;
