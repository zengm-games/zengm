const React = require('react');

module.exports = Component => {
    return class Clickable extends React.Component {
        constructor(props) {
            super(props);
            this.state = {
                clicked: false,
            };
        }

        toggleClicked() {
            this.setState({
                clicked: !this.state.clicked,
            });
        }

        render() {
            return <Component {...this.props} {...this.state} toggleClicked={() => this.toggleClicked()} />;
        }
    };
};
