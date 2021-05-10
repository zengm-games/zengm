import * as React from "react";
import Bugsnag from "@bugsnag/browser";
import useTitleBar from "../hooks/useTitleBar";

const FallbackGlobal = ({ error, info }: { error: Error; info?: any }) => {
	console.log(error, info);
	useTitleBar({
		title: "Error",
		hideNewWindow: true,
	});
	return <p>{error.message}</p>;
};

const FallbackLocal = ({ error, info }: { error: Error; info?: any }) => {
	console.log(error, info);
	return (
		<p>
			<span className="text-danger">Error:</span> {error.message}
		</p>
	);
};

const ErrorBoundaryBugsnag = Bugsnag.getPlugin("react")!.createErrorBoundary(
	React,
);

const ErrorBoundary = ({
	children,
	local,
}: {
	children: any;
	local?: boolean;
}) => {
	return (
		<ErrorBoundaryBugsnag
			FallbackComponent={local ? FallbackLocal : FallbackGlobal}
		>
			{children}
		</ErrorBoundaryBugsnag>
	);
};

export default ErrorBoundary;
