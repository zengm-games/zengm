import PropTypes from "prop-types";
import React from "react";
import { DIFFICULTY } from "../../common";
import { NewWindowLink } from "../components";
import { helpers, logEvent, setTitle, toWorker } from "../util";

const difficultyValues = Object.values(DIFFICULTY);

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

        localStorage.setItem(
            "theme",
            this.state.theme === "dark" ? "dark" : "light",
        );

        logEvent({
            type: "success",
            text: "Options successfully updated.",
            saveToDb: false,
        });
    }

    render() {
        setTitle("Options");

        return (
            <>
                <h1>
                    Options <NewWindowLink />
                </h1>

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

                    <button className="btn btn-primary">Save Options</button>
                </form>
            </>
        );
    }
}

Options.propTypes = {};

export default Options;
