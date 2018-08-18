/* eslint react/jsx-no-bind: "off" */

import faces from "facesjs";
import PropTypes from "prop-types";
import React from "react";
import { PHASE } from "../../common";
import { helpers, realtimeUpdate, setTitle, toWorker } from "../util";
import { NewWindowLink, PlayerPicture } from "../components";

const positions = ["PG", "SG", "SF", "PF", "C", "G", "GF", "F", "FC"];
const faceOptions = {
    eyes: [0, 1, 2, 3],
    nose: [0, 1, 2],
    mouth: [0, 1, 2, 3, 4],
    hair: [0, 1, 2, 3, 4],
};

const copyValidValues = (source, target, minContract, phase, season) => {
    for (const attr of ["hgt", "tid", "weight"]) {
        const val = parseInt(source[attr], 10);
        if (!Number.isNaN(val)) {
            target[attr] = val;
        }
    }

    target.firstName = source.firstName;
    target.lastName = source.lastName;
    target.imgURL = source.imgURL;

    let updatedRatingsOrAge = false;
    {
        const age = parseInt(source.age, 10);
        if (!Number.isNaN(age)) {
            const bornYear = season - age;
            if (bornYear !== target.born.year) {
                target.born.year = bornYear;
                updatedRatingsOrAge = true;
            }
        }
    }

    target.born.loc = source.born.loc;

    target.college = source.college;

    {
        const diedYear = parseInt(source.diedYear, 10);
        if (!Number.isNaN(diedYear)) {
            target.diedYear = diedYear;
        } else {
            target.diedYear = undefined;
        }
    }

    {
        // Allow any value, even above or below normal limits, but round to $10k and convert from M to k
        let amount = Math.round(100 * parseFloat(source.contract.amount)) * 10;
        if (Number.isNaN(amount)) {
            amount = minContract;
        }
        target.contract.amount = amount;
    }

    {
        let exp = parseInt(source.contract.exp, 10);
        if (!Number.isNaN(exp)) {
            // No contracts expiring in the past
            if (exp < season) {
                exp = season;
            }

            // If current season contracts already expired, then current season can't be allowed for new contract
            if (exp === season && phase >= PHASE.RESIGN_PLAYERS) {
                exp += 1;
            }

            target.contract.exp = exp;
        }
    }

    {
        let gamesRemaining = parseInt(source.injury.gamesRemaining, 10);
        if (Number.isNaN(gamesRemaining) || gamesRemaining < 0) {
            gamesRemaining = 0;
        }
        target.injury.gamesRemaining = gamesRemaining;
    }

    target.injury.type = source.injury.type;

    {
        const r = source.ratings.length - 1;
        for (const rating of Object.keys(source.ratings[r])) {
            if (rating === "pos") {
                if (target.ratings[r].pos !== source.ratings[r].pos) {
                    target.ratings[r].pos = source.ratings[r].pos;
                    target.pos = source.ratings[r].pos; // Keep this way forever because fun
                }
            } else if (
                [
                    "diq",
                    "dnk",
                    "drb",
                    "endu",
                    "fg",
                    "ft",
                    "hgt",
                    "ins",
                    "jmp",
                    "pss",
                    "reb",
                    "spd",
                    "oiq",
                    "stre",
                    "tp",
                ].includes(rating)
            ) {
                const val = helpers.bound(
                    parseInt(source.ratings[r][rating], 10),
                    0,
                    100,
                );
                if (!Number.isNaN(val)) {
                    if (target.ratings[r][rating] !== val) {
                        target.ratings[r][rating] = val;
                        updatedRatingsOrAge = true;
                    }
                }
            }
        }
    }

    // These are already normalized, cause they are selects
    for (const attr of ["eyes", "hair", "mouth", "nose"]) {
        target.face[attr] = source.face[attr];
    }

    for (const attr of ["eye-angle", "fatness"]) {
        const val = parseFloat(source.face[attr]);
        if (!Number.isNaN(val)) {
            if (attr === "eye-angle") {
                target.face.eyes[0].angle = val;
                target.face.eyes[1].angle = val;
            } else {
                target.face[attr] = val;
            }
        }
    }

    target.face.color = source.face.color;

    return updatedRatingsOrAge;
};

class CustomizePlayer extends React.Component {
    constructor(props) {
        super(props);

        const p = helpers.deepCopy(props.p);
        if (p !== undefined) {
            p.age = this.props.season - p.born.year;
            p.contract.amount /= 1000;
        }
        this.state = {
            appearanceOption: props.appearanceOption,
            saving: false,
            p,
        };
        this.handleChangeAppearanceOption = this.handleChangeAppearanceOption.bind(
            this,
        );
        this.handleSubmit = this.handleSubmit.bind(this);
        this.randomizeFace = this.randomizeFace.bind(this);
    }

    async handleSubmit(e) {
        e.preventDefault();
        this.setState({
            saving: true,
        });

        const p = this.props.p;

        // Copy over values from state, if they're valid
        const updatedRatingsOrAge = copyValidValues(
            this.state.p,
            p,
            this.props.minContract,
            this.props.phase,
            this.props.season,
        );

        // Only save image URL if it's selected
        if (this.state.appearanceOption !== "Image URL") {
            p.imgURL = "";
        }

        const pid = await toWorker(
            "upsertCustomizedPlayer",
            p,
            this.props.originalTid,
            this.props.season,
            updatedRatingsOrAge,
        );

        realtimeUpdate([], helpers.leagueUrl(["player", pid]));
    }

    handleChange(type, field, e) {
        let val = e.target.value;
        const checked = e.target.checked;

        this.setState(prevState => {
            const p = prevState.p;

            if (type === "root") {
                p[field] = val;
            } else if (["born", "contract", "injury"].includes(type)) {
                p[type][field] = val;
            } else if (type === "rating") {
                p.ratings[p.ratings.length - 1][field] = val;
            } else if (type === "face") {
                if (["eyes", "hair", "mouth", "nose"].includes(field)) {
                    val = parseInt(val, 10);
                    if (Number.isNaN(val)) {
                        return;
                    }

                    if (field === "eyes") {
                        p[type][field][0].id = val;
                        p[type][field][1].id = val;
                    } else {
                        p[type][field].id = val;
                    }
                } else if (["eye-angle", "fatness"].includes(field)) {
                    if (field === "eye-angle") {
                        p[type].eyes[0].angle = val;
                        p[type].eyes[1].angle = val;
                    } else {
                        p[type][field] = val;
                    }
                } else if (field === "color") {
                    p[type][field] = val;
                } else if (field === "nose-flip") {
                    p[type].nose.flip = checked;
                }
            }

            return {
                p,
            };
        });
    }

    handleChangeAppearanceOption(e) {
        this.setState({
            appearanceOption: e.target.value,
        });
    }

    randomizeFace(e) {
        e.preventDefault(); // Don't submit whole form

        const face = faces.generate();

        // Round long decimals
        face.fatness = face.fatness.toFixed(2);
        face.eyes[0].angle = face.eyes[0].angle.toFixed(1);
        face.eyes[1].angle = face.eyes[1].angle.toFixed(1);

        this.setState(prevState => {
            prevState.p.face = face;
            return {
                p: prevState.p,
            };
        });
    }

    render() {
        const { godMode, originalTid, teams } = this.props;
        const { appearanceOption, p, saving } = this.state;

        const title =
            originalTid === undefined ? "Create Player" : "Edit Player";

        setTitle(title);

        if (!godMode) {
            return (
                <div>
                    <h1>Error</h1>
                    <p>
                        You can't customize players unless you enable{" "}
                        <a href={helpers.leagueUrl(["god_mode"])}>God Mode</a>
                    </p>
                </div>
            );
        }

        const r = p.ratings.length - 1;

        let pictureDiv = null;
        if (appearanceOption === "Cartoon Face") {
            pictureDiv = (
                <div className="row">
                    <div className="col-sm-4">
                        <div style={{ maxHeight: "225px", maxWidth: "150px" }}>
                            <PlayerPicture face={p.face} />
                        </div>
                        <center>
                            <button
                                type="button"
                                className="btn btn-default"
                                onClick={this.randomizeFace}
                            >
                                Randomize
                            </button>
                        </center>
                    </div>
                    <div className="col-sm-8">
                        <div className="row">
                            <div className="col-xs-6 form-group">
                                <label>Width (0 to 1)</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    onChange={this.handleChange.bind(
                                        this,
                                        "face",
                                        "fatness",
                                    )}
                                    value={p.face.fatness}
                                />
                            </div>
                            <div className="col-xs-6 form-group">
                                <label>Skin Color</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    onChange={this.handleChange.bind(
                                        this,
                                        "face",
                                        "color",
                                    )}
                                    value={p.face.color}
                                />
                            </div>
                            <div className="col-xs-6 form-group">
                                <label>Eyes</label>
                                <select
                                    className="form-control"
                                    onChange={this.handleChange.bind(
                                        this,
                                        "face",
                                        "eyes",
                                    )}
                                    value={p.face.eyes[0].id}
                                >
                                    {faceOptions.eyes.map(val => (
                                        <option key={val} value={val}>
                                            {val}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-xs-6 form-group">
                                <label>Eye Angle (-20 to 30)</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    onChange={this.handleChange.bind(
                                        this,
                                        "face",
                                        "eye-angle",
                                    )}
                                    value={p.face.eyes[0].angle}
                                />
                            </div>
                            <div className="col-xs-6 form-group">
                                <label>Nose</label>
                                <select
                                    className="form-control"
                                    onChange={this.handleChange.bind(
                                        this,
                                        "face",
                                        "nose",
                                    )}
                                    value={p.face.nose.id}
                                >
                                    {faceOptions.nose.map(val => (
                                        <option key={val} value={val}>
                                            {val}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-xs-6 form-group">
                                <label>Nose Flip</label>
                                <input
                                    type="checkbox"
                                    className="form-control"
                                    onChange={this.handleChange.bind(
                                        this,
                                        "face",
                                        "nose-flip",
                                    )}
                                    checked={p.face.nose.flip}
                                />
                            </div>
                            <div className="col-xs-6 form-group">
                                <label>Mouth</label>
                                <select
                                    className="form-control"
                                    onChange={this.handleChange.bind(
                                        this,
                                        "face",
                                        "mouth",
                                    )}
                                    value={p.face.mouth.id}
                                >
                                    {faceOptions.mouth.map(val => (
                                        <option key={val} value={val}>
                                            {val}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-xs-6 form-group">
                                <label>Hair</label>
                                <select
                                    className="form-control"
                                    onChange={this.handleChange.bind(
                                        this,
                                        "face",
                                        "hair",
                                    )}
                                    value={p.face.hair.id}
                                >
                                    {faceOptions.hair.map(val => (
                                        <option key={val} value={val}>
                                            {val}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            );
        } else {
            pictureDiv = (
                <div className="form-group">
                    <label>Image URL</label>
                    <input
                        type="text"
                        className="form-control"
                        onChange={this.handleChange.bind(
                            this,
                            "root",
                            "imgURL",
                        )}
                        value={p.imgURL}
                    />
                    <span className="help-block">
                        Your image must be hosted externally. If you need to
                        upload an image, try using{" "}
                        <a href="http://imgur.com/">imgur</a>. For ideal
                        display, crop your image so it has a 2:3 aspect ratio
                        (such as 100px wide and 150px tall).
                    </span>
                </div>
            );
        }

        return (
            <div>
                <h1>
                    {title} <NewWindowLink />
                </h1>

                <p>
                    Here, you can{" "}
                    {originalTid === undefined
                        ? "create a custom player with"
                        : "edit a player to have"}{" "}
                    whatever attributes and ratings you want. If you want to
                    make a whole league of custom players, you should probably
                    create a{" "}
                    <a href="https://basketball-gm.com/manual/customization/">
                        custom League File
                    </a>
                    .
                </p>

                <form onSubmit={this.handleSubmit}>
                    <div className="row">
                        <div className="col-md-7">
                            <h2>Attributes</h2>

                            <div className="row">
                                <div className="col-sm-3 form-group">
                                    <label>First Name</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        onChange={this.handleChange.bind(
                                            this,
                                            "root",
                                            "firstName",
                                        )}
                                        value={p.firstName}
                                    />
                                </div>
                                <div className="col-sm-3 form-group">
                                    <label>Last Name</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        onChange={this.handleChange.bind(
                                            this,
                                            "root",
                                            "lastName",
                                        )}
                                        value={p.lastName}
                                    />
                                </div>
                                <div className="col-sm-3 form-group">
                                    <label>Age</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        onChange={this.handleChange.bind(
                                            this,
                                            "root",
                                            "age",
                                        )}
                                        value={p.age}
                                    />
                                </div>
                                <div className="col-sm-3 form-group">
                                    <label>Team</label>
                                    <select
                                        className="form-control"
                                        onChange={this.handleChange.bind(
                                            this,
                                            "root",
                                            "tid",
                                        )}
                                        value={p.tid}
                                    >
                                        {teams.map(t => {
                                            return (
                                                <option
                                                    key={t.tid}
                                                    value={t.tid}
                                                >
                                                    {t.text}
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>
                                <div className="col-sm-3 form-group">
                                    <label>Height (inches)</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        onChange={this.handleChange.bind(
                                            this,
                                            "root",
                                            "hgt",
                                        )}
                                        value={p.hgt}
                                    />
                                </div>
                                <div className="col-sm-3 form-group">
                                    <label>Weight (lbs)</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        onChange={this.handleChange.bind(
                                            this,
                                            "root",
                                            "weight",
                                        )}
                                        value={p.weight}
                                    />
                                </div>
                                <div className="col-sm-3 form-group">
                                    <label>Position</label>
                                    <select
                                        className="form-control"
                                        onChange={this.handleChange.bind(
                                            this,
                                            "rating",
                                            "pos",
                                        )}
                                        value={p.ratings[r].pos}
                                    >
                                        {positions.map(pos => {
                                            return (
                                                <option key={pos} value={pos}>
                                                    {pos}
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>
                                <div className="col-sm-3 form-group">
                                    <label>Hometown</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        onChange={this.handleChange.bind(
                                            this,
                                            "born",
                                            "loc",
                                        )}
                                        value={p.born.loc}
                                    />
                                </div>
                                <div className="col-sm-6 form-group">
                                    <label>
                                        Year of Death (blank for alive)
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        onChange={this.handleChange.bind(
                                            this,
                                            "root",
                                            "diedYear",
                                        )}
                                        value={p.diedYear}
                                    />
                                </div>
                                <div className="col-sm-3 form-group">
                                    <label>From</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        onChange={this.handleChange.bind(
                                            this,
                                            "root",
                                            "college",
                                        )}
                                        value={p.college}
                                    />
                                </div>
                                <div className="col-sm-6 form-group">
                                    <label>Contract Amount</label>
                                    <div className="input-group">
                                        <span className="input-group-addon">
                                            $
                                        </span>
                                        <input
                                            type="text"
                                            className="form-control"
                                            onChange={this.handleChange.bind(
                                                this,
                                                "contract",
                                                "amount",
                                            )}
                                            value={p.contract.amount}
                                        />
                                        <span className="input-group-addon">
                                            M per year
                                        </span>
                                    </div>
                                </div>
                                <div className="col-sm-6 form-group">
                                    <label>Contract Expiration</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        onChange={this.handleChange.bind(
                                            this,
                                            "contract",
                                            "exp",
                                        )}
                                        value={p.contract.exp}
                                    />
                                </div>
                                <div className="col-sm-6 form-group">
                                    <label>Injury</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        onChange={this.handleChange.bind(
                                            this,
                                            "injury",
                                            "type",
                                        )}
                                        value={p.injury.type}
                                    />
                                </div>
                                <div className="col-sm-3 form-group">
                                    <label>Games Out</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        onChange={this.handleChange.bind(
                                            this,
                                            "injury",
                                            "gamesRemaining",
                                        )}
                                        value={p.injury.gamesRemaining}
                                    />
                                </div>
                            </div>

                            <h2>Appearance</h2>

                            <div className="form-group">
                                <label>
                                    You can either create a cartoon face or
                                    specify the URL to an image.
                                </label>
                                <select
                                    className="form-control"
                                    onChange={this.handleChangeAppearanceOption}
                                    style={{ maxWidth: "150px" }}
                                    value={appearanceOption}
                                >
                                    <option value="Cartoon Face">
                                        Cartoon Face
                                    </option>
                                    <option value="Image URL">Image URL</option>
                                </select>
                            </div>

                            {pictureDiv}
                        </div>

                        <div className="clearfix visible-sm visible-xs" />

                        <div className="col-md-5">
                            <h2>Ratings</h2>

                            <p>All ratings are on a scale of 0 to 100.</p>

                            <div className="row">
                                <div className="col-xs-4">
                                    <h3>Physical</h3>
                                    <div className="form-group">
                                        <label>Height</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            onChange={this.handleChange.bind(
                                                this,
                                                "rating",
                                                "hgt",
                                            )}
                                            value={p.ratings[r].hgt}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Strength</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            onChange={this.handleChange.bind(
                                                this,
                                                "rating",
                                                "stre",
                                            )}
                                            value={p.ratings[r].stre}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Speed</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            onChange={this.handleChange.bind(
                                                this,
                                                "rating",
                                                "spd",
                                            )}
                                            value={p.ratings[r].spd}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Jumping</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            onChange={this.handleChange.bind(
                                                this,
                                                "rating",
                                                "jmp",
                                            )}
                                            value={p.ratings[r].jmp}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Endurance</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            onChange={this.handleChange.bind(
                                                this,
                                                "rating",
                                                "endu",
                                            )}
                                            value={p.ratings[r].endu}
                                        />
                                    </div>
                                </div>
                                <div className="col-xs-4">
                                    <h3>Shooting</h3>
                                    <div className="form-group">
                                        <label>Inside</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            onChange={this.handleChange.bind(
                                                this,
                                                "rating",
                                                "ins",
                                            )}
                                            value={p.ratings[r].ins}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Dunks/Layups</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            onChange={this.handleChange.bind(
                                                this,
                                                "rating",
                                                "dnk",
                                            )}
                                            value={p.ratings[r].dnk}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Free Throws</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            onChange={this.handleChange.bind(
                                                this,
                                                "rating",
                                                "ft",
                                            )}
                                            value={p.ratings[r].ft}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Two Pointers</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            onChange={this.handleChange.bind(
                                                this,
                                                "rating",
                                                "fg",
                                            )}
                                            value={p.ratings[r].fg}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Three Pointers</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            onChange={this.handleChange.bind(
                                                this,
                                                "rating",
                                                "tp",
                                            )}
                                            value={p.ratings[r].tp}
                                        />
                                    </div>
                                </div>
                                <div className="col-xs-4">
                                    <h3>Skill</h3>
                                    <div className="form-group">
                                        <label>Offensive IQ</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            onChange={this.handleChange.bind(
                                                this,
                                                "rating",
                                                "oiq",
                                            )}
                                            value={p.ratings[r].oiq}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Defensive IQ</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            onChange={this.handleChange.bind(
                                                this,
                                                "rating",
                                                "diq",
                                            )}
                                            value={p.ratings[r].diq}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Dribbling</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            onChange={this.handleChange.bind(
                                                this,
                                                "rating",
                                                "drb",
                                            )}
                                            value={p.ratings[r].drb}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Passing</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            onChange={this.handleChange.bind(
                                                this,
                                                "rating",
                                                "pss",
                                            )}
                                            value={p.ratings[r].pss}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Rebounding</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            onChange={this.handleChange.bind(
                                                this,
                                                "rating",
                                                "reb",
                                            )}
                                            value={p.ratings[r].reb}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <br />
                    <center>
                        <button
                            type="submit"
                            className="btn btn-primary btn-lg"
                            disabled={saving}
                        >
                            {title}
                        </button>
                    </center>
                </form>
            </div>
        );
    }
}

CustomizePlayer.propTypes = {
    appearanceOption: PropTypes.oneOf(["Cartoon Face", "Image URL"]),
    godMode: PropTypes.bool.isRequired,
    originalTid: PropTypes.number,
    minContract: PropTypes.number,
    phase: PropTypes.number,
    p: PropTypes.object,
    season: PropTypes.number,
    teams: PropTypes.arrayOf(
        PropTypes.shape({
            text: PropTypes.string.isRequired,
            tid: PropTypes.number.isRequired,
        }),
    ),
};

export default CustomizePlayer;
