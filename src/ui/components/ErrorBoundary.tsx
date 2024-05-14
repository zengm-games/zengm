import * as Sentry from "@sentry/react";
import useTitleBar from "../hooks/useTitleBar";

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

const ErrorBoundary = ({
	children,
	local,
}: {
	children: any;
	local?: boolean;
}) => {
	return (
		<Sentry.ErrorBoundary fallback={local ? FallbackLocal : FallbackGlobal}>
			{children}
		</Sentry.ErrorBoundary>
	);
};

export default ErrorBoundary;
