// @flow

import * as React from 'react';

// I have no idea what's going on here
export default <Props, C: React.Component<Props, *>>(
    Component: Class<C>,
): Class<React.Component<$Diff<Props, {toggleClicked: () => void}>, *>> => {
    return class Clickable extends React.Component<any, {
        clicked: boolean,
    }> {
        toggleClicked: Function;

        constructor(props) {
            super(props);
            this.state = {
                clicked: false,
            };
            this.toggleClicked = this.toggleClicked.bind(this);
        }

        toggleClicked(event: SyntheticEvent<>) {
            // Don't toggle the row if a link was clicked.
            const ignoredElements = ['A', 'BUTTON', 'INPUT', 'SELECT'];
            if (event.target.nodeName && ignoredElements.includes(event.target.nodeName)) {
                return;
            }
            if (event.target.dataset && event.target.dataset.noRowHighlight) {
                return;
            }

            this.setState({
                clicked: !this.state.clicked,
            });
        }

        render() {
            return <Component {...this.props} {...this.state} toggleClicked={this.toggleClicked} />;
        }
    };
};
