import PropTypes from "prop-types";
import React from "react";

const RatingsOverview = ({ ratings }) => {
    const r = ratings.length - 1;

    return (
        <>
            <div className="d-none d-lg-flex row">
                <div className="col-lg-8">
                    <h3>Overall: {ratings[r].ovr}</h3>
                </div>
                <div className="col-lg-4">
                    <h3>Potential: {ratings[r].pot}</h3>
                </div>
            </div>
            <div className="d-lg-none row">
                <div className="col-6">
                    <h3>Overall: {ratings[r].ovr}</h3>
                </div>
                <div className="col-6">
                    <h3 className="float-right">Potential: {ratings[r].pot}</h3>
                </div>
            </div>
            <div className="row">
                <div className="col-4">
                    <b>Physical</b>
                    <br />
                    Height: {ratings[r].hgt}
                    <br />
                    Strength: {ratings[r].stre}
                    <br />
                    Speed: {ratings[r].spd}
                    <br />
                    Jumping: {ratings[r].jmp}
                    <br />
                    Endurance: {ratings[r].endu}
                </div>
                <div className="col-4">
                    <b>Shooting</b>
                    <br />
                    Inside Scoring: {ratings[r].ins}
                    <br />
                    Dunks/Layups: {ratings[r].dnk}
                    <br />
                    Free Throws: {ratings[r].ft}
                    <br />
                    Two Pointers: {ratings[r].fg}
                    <br />
                    Three Pointers: {ratings[r].tp}
                </div>
                <div className="col-4">
                    <b>Skill</b>
                    <br />
                    Offensive IQ: {ratings[r].oiq}
                    <br />
                    Defensive IQ: {ratings[r].diq}
                    <br />
                    Dribbling: {ratings[r].drb}
                    <br />
                    Passing: {ratings[r].pss}
                    <br />
                    Rebounding: {ratings[r].reb}
                </div>
            </div>
        </>
    );
};

RatingsOverview.propTypes = {
    ratings: PropTypes.arrayOf(
        PropTypes.shape({
            diq: PropTypes.number.isRequired,
            dnk: PropTypes.number.isRequired,
            drb: PropTypes.number.isRequired,
            endu: PropTypes.number.isRequired,
            fg: PropTypes.number.isRequired,
            ft: PropTypes.number.isRequired,
            hgt: PropTypes.number.isRequired,
            ins: PropTypes.number.isRequired,
            jmp: PropTypes.number.isRequired,
            oiq: PropTypes.number.isRequired,
            ovr: PropTypes.number.isRequired,
            pot: PropTypes.number.isRequired,
            pss: PropTypes.number.isRequired,
            reb: PropTypes.number.isRequired,
            spd: PropTypes.number.isRequired,
            stre: PropTypes.number.isRequired,
            tp: PropTypes.number.isRequired,
        }),
    ).isRequired,
};

export default RatingsOverview;
