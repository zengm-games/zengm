import React from 'react';

export default Component => {
    return class Clickable extends React.Component {
        constructor(props) {
            super(props);
            this.state = {
                clicked: false,
            };
        }

        toggleClicked(event) {
            // Don't toggle the row if a link was clicked.
            const ignoredElements = ['A', 'BUTTON', 'INPUT', 'SELECT'];
            if (ignoredElements.includes(event.target.nodeName)) {
                return;
            }

            this.setState({
                clicked: !this.state.clicked,
            });
        }

        render() {
            return <Component {...this.props} {...this.state} toggleClicked={event => this.toggleClicked(event)} />;
        }
    };
};
