import bugsnagReact from "@bugsnag/plugin-react";
import React from "react";
import useTitleBar from "../hooks/useTitleBar";

const Fallback = ({ error, info }: { error: Error; info?: any }) => {
	console.log(error, info);
	useTitleBar({
		title: "Error",
		hideNewWindow: true,
	});
	return <p>{error.message}</p>;
};

type Props = {
	children: any;
};
type State = {
	error: Error | undefined;
};
let ErrorBoundaryTemp;

if (window.bugsnagClient) {
	window.bugsnagClient.use(bugsnagReact, React);
	const ErrorBoundaryBugsnag = window.bugsnagClient.getPlugin("react");

	ErrorBoundaryTemp = ({ children }: { children: any }) => (
		<ErrorBoundaryBugsnag FallbackComponent={Fallback}>
			{children}
		</ErrorBoundaryBugsnag>
	);
} else {
	class ErrorBoundaryDefault extends React.Component<Props, State> {
		constructor(props: Props) {
			super(props);
			this.state = {
				error: undefined,
			};
		}

		static getDerivedStateFromError(error: Error) {
			// Update state so the next render will show the fallback UI.
			return {
				error,
			};
		}

		componentDidCatch(error: Error, info: any) {
			console.log("componentDidCatch", error, info);
		}

		render() {
			if (this.state.error) {
				return <Fallback error={this.state.error} />;
			}

			return this.props.children;
		}
	}

	ErrorBoundaryTemp = ErrorBoundaryDefault;
}

const ErrorBoundary = ErrorBoundaryTemp;

export default ErrorBoundary;
