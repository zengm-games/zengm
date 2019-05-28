// @flow

import * as React from "react";

type ToggleClicked = (event: SyntheticEvent<>) => void;

const clickable = <Props: {}>(
    Component: React.ComponentType<
        { clicked: boolean, toggleClicked: ToggleClicked } & Props,
    >,
): React.ComponentType<Props> => {
    return class Clickable extends React.Component<
        any,
        {
            clicked: boolean,
        },
    > {
        toggleClicked: ToggleClicked;

        constructor(props) {
            super(props);
            this.state = {
                clicked: false,
            };
            this.toggleClicked = this.toggleClicked.bind(this);
        }

        toggleClicked(event: any) {
            // Purposely using event.target instead of event.currentTarget because we do want check what internal element was clicked on, not the row itself

            // Don't toggle the row if a link was clicked.
            const ignoredElements = ["A", "BUTTON", "INPUT", "SELECT"];
            if (
                event.target.nodeName &&
                ignoredElements.includes(event.target.nodeName)
            ) {
                return;
            }
            if (event.target.dataset && event.target.dataset.noRowHighlight) {
                return;
            }

            this.setState(prevState => ({ clicked: !prevState.clicked }));
        }

        render() {
            return (
                <Component
                    {...this.props}
                    clicked={this.state.clicked}
                    toggleClicked={this.toggleClicked}
                />
            );
        }
    };
};

export default clickable;
