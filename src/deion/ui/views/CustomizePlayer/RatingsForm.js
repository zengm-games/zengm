import PropTypes from "prop-types";
import React from "react";
import { getCols } from "../../util";

const rows =
    process.env.SPORT === "basketball"
        ? [
              [
                  { Physical: ["hgt", "stre", "spd", "jmp", "endu"] },
                  { Shooting: ["ins", "dnk", "ft", "fg", "tp"] },
                  { Skill: ["oiq", "diq", "drb", "pss", "reb"] },
              ],
          ]
        : [
              [
                  { Physical: ["hgt", "stre", "spd", "endu"] },
                  { Passing: ["thv", "thp", "tha"] },
                  { "Rush/Rec": ["elu", "rtr", "hnd", "bsc"] },
              ],
              [
                  { Blocking: ["rbk", "pbk"] },
                  { Defense: ["pcv", "tck", "prs", "rns"] },
                  { Kicking: ["kpw", "kac", "ppw", "pac"] },
              ],
          ];

const RatingsForm = ({ handleChange, ratingsRow }) => {
    return (
        <>
            {rows.map((row, i) => {
                return (
                    <div className="row" key={i}>
                        {row.map((block, j) => {
                            return (
                                <div key={j} className="col-4">
                                    {Object.entries(block).map(
                                        ([title, ratings]) => {
                                            return (
                                                <React.Fragment key={title}>
                                                    <h3>{title}</h3>
                                                    {ratings.map(rating => {
                                                        return (
                                                            <div
                                                                key={rating}
                                                                className="form-group"
                                                            >
                                                                <label>
                                                                    {
                                                                        getCols(
                                                                            [
                                                                                `rating:${rating}`,
                                                                            ],
                                                                        )[0]
                                                                            .desc
                                                                    }
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    className="form-control"
                                                                    onChange={event => {
                                                                        handleChange(
                                                                            "rating",
                                                                            rating,
                                                                            event,
                                                                        );
                                                                    }}
                                                                    value={
                                                                        ratingsRow[
                                                                            rating
                                                                        ]
                                                                    }
                                                                />
                                                            </div>
                                                        );
                                                    })}
                                                </React.Fragment>
                                            );
                                        },
                                    )}
                                </div>
                            );
                        })}
                    </div>
                );
            })}
        </>
    );
};

RatingsForm.propTypes = {
    handleChange: PropTypes.func,
    ratingsRow: PropTypes.object,
};

export default RatingsForm;
