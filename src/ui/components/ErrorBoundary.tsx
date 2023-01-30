import * as React from "react";
import Bugsnag from "@bugsnag/browser";
import useTitleBar from "../hooks/useTitleBar";
import type { BugsnagErrorBoundary } from "@bugsnag/plugin-react";

const FallbackGlobal = ({ error, info }: { error: Error; info?: any }) => {
	console.log(error, info);
	useTitleBar({
		title: "Error",
		hideNewWindow: true,
	});
	return (
		<>
			<p>{error.message}</p>
			<pre>{error.stack}</pre>
		</>
	);
};

const FallbackLocal = ({ error, info }: { error: Error; info?: any }) => {
	console.log(error, info);
	return (
		<p>
			<span className="text-danger">Error:</span> {error.message}
		</p>
	);
};

let ErrorBoundaryBugsnag: BugsnagErrorBoundary;

const ErrorBoundary = ({
	children,
	local,
}: {
	children: any;
	local?: boolean;
}) => {
	if (!ErrorBoundaryBugsnag) {
		ErrorBoundaryBugsnag =
			Bugsnag.getPlugin("react")!.createErrorBoundary(React);
	}

	return (
		<ErrorBoundaryBugsnag
			FallbackComponent={local ? FallbackLocal : FallbackGlobal}
		>
			{children}
		</ErrorBoundaryBugsnag>
	);
};

export default ErrorBoundary;
