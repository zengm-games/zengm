// @flow

import createBugsnagErrorBoundary from "bugsnag-react";
import * as React from "react";

const Fallback = ({ error, info }: { error: Error, info: any }) => {
    console.log(error, info);
    return (
        <>
            <h1>Error</h1>
            <p>{error.message}</p>
        </>
    );
};

let ErrorBoundaryTemp;
if (window.bugsnagClient) {
    const ErrorBoundaryBugsnag = window.bugsnagClient.use(
        createBugsnagErrorBoundary(React),
    );
    ErrorBoundaryTemp = ({ children }: { children: any }) => (
        <ErrorBoundaryBugsnag FallbackComponent={Fallback}>
            {children}
        </ErrorBoundaryBugsnag>
    );
} else {
    type Props = {
        children: any,
    };
    type State = {
        error: Error | void,
    };
    class ErrorBoundaryDefault extends React.Component<Props, State> {
        constructor(props: Props) {
            super(props);
            this.state = { error: undefined };
        }

        static getDerivedStateFromError(error) {
            // Update state so the next render will show the fallback UI.
            return { error };
        }

        componentDidCatch(error, info) {
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
