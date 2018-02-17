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

        toggleClicked(event: SyntheticEvent<>) {
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

            this.setState({
                clicked: !this.state.clicked,
            });
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
