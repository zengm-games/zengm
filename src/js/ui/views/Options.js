import PropTypes from "prop-types";
import React from "react";
import { logEvent, setTitle } from "../util";

class Options extends React.Component {
    constructor(props) {
        super(props);

        const themeLocalStorage = localStorage.getItem("theme");

        this.state = {
            theme: themeLocalStorage === "dark" ? "dark" : "light",
        };
        this.handleChanges = {
            theme: this.handleChange.bind(this, "theme"),
        };
        this.handleFormSubmit = this.handleFormSubmit.bind(this);
    }

    handleChange(name, e) {
        this.setState({
            [name]: e.target.value,
        });
    }

    async handleFormSubmit(e) {
        e.preventDefault();

        const newTheme = this.state.theme === "dark" ? "dark" : "light";
        localStorage.setItem("theme", newTheme);
        if (window.themeCSSLink) {
            window.themeCSSLink.href = `/gen/${newTheme}.css`;
        }

        logEvent({
            type: "success",
            text: "Options successfully updated.",
            saveToDb: false,
        });
    }

    render() {
        const title = this.props.title ? this.props.title : "Options";

        setTitle(title);

        return (
            <>
                <h1>{title}</h1>

                <form onSubmit={this.handleFormSubmit}>
                    <div className="row">
                        <div className="col-sm-3 col-6 form-group">
                            <label>Theme</label>
                            <select
                                className="form-control"
                                onChange={this.handleChanges.theme}
                                value={this.state.theme}
                            >
                                <option value="light">Light</option>
                                <option value="dark">Dark</option>
                            </select>
                        </div>
                    </div>

                    <button className="btn btn-primary">Save {title}</button>
                </form>
            </>
        );
    }
}

Options.propTypes = {
    title: PropTypes.string,
};

export default Options;
