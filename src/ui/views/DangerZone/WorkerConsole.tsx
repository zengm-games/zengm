import { useRef, useState } from "react";
import { ActionButton } from "../../components/index.tsx";
import { helpers, toWorker } from "../../util/index.ts";
import useLocalStorageState from "use-local-storage-state";

const LogOutput = ({ value }: { value: string }) => {
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	return (
		<div>
			<textarea
				className="form-control"
				style={{
					height: 200,
				}}
				ref={textareaRef}
				defaultValue={value}
			/>
			<button
				className="btn btn-secondary mt-2"
				onClick={() => {
					if (textareaRef.current) {
						textareaRef.current.select();
						document.execCommand("copy");
					}
				}}
				type="button"
			>
				Copy to clipboard
			</button>
		</div>
	);
};

const WorkerConsole = ({ godMode }: { godMode: boolean }) => {
	const [logOutput, setLogOutput] = useState<undefined | string>();
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
	const [code, setCode] = useLocalStorageState("worker-console-code", {
		defaultValue: "",
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
				onSubmit={async (event) => {
					event.preventDefault();

					setStatus({ type: "running" });
					setLogOutput(undefined);
					try {
						const output = await toWorker("main", "evalOnWorker", code);
						setLogOutput(output);
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
					onChange={(event) => {
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
				{logOutput !== undefined ? (
					<div className="mt-2">
						<LogOutput value={logOutput} />
					</div>
				) : null}
			</form>
		</>
	);
};

export default WorkerConsole;
