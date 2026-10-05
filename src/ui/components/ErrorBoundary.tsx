import * as React from "react";
import * as Sentry from "@sentry/react";
import useTitleBar from "../hooks/useTitleBar.tsx";

const FallbackGlobal = ({ error, info }: { error: Error; info?: unknown }) => {
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

const FallbackLocal = ({ error, info }: { error: Error; info?: unknown }) => {
	console.log(error, info);
	return (
		<p>
			<span className="text-danger">Error:</span> {error.message}
		</p>
	);
};

export const ErrorBoundary = ({
	children,
	local,
}: {
	children: React.ReactNode;
	local?: boolean;
}) => {
	return (
		<Sentry.ErrorBoundary
			fallback={({ error, componentStack }) => {
				const Fallback = local ? FallbackLocal : FallbackGlobal;
				return <Fallback error={error as Error} info={componentStack} />;
			}}
		>
			{children}
		</Sentry.ErrorBoundary>
	);
};
