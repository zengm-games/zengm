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
                    Endurance: {ratings[r].endu}
                </div>
                <div className="col-4">
                    <b>Passing</b>
                    <br />
                    Vision: {ratings[r].thv}
                    <br />
                    Power: {ratings[r].thp}
                    <br />
                    Accuracy: {ratings[r].tha}
                </div>
                <div className="col-4">
                    <b>Rushing/Receiving</b>
                    <br />
                    Elusiveness: {ratings[r].elu}
                    <br />
                    Route Running: {ratings[r].rtr}
                    <br />
                    Hands: {ratings[r].hnd}
                    <br />
                    Ball Security: {ratings[r].bsc}
                </div>
            </div>
            <div className="row mt-2">
                <div className="col-4">
                    <b>Blocking</b>
                    <br />
                    Run Blocking: {ratings[r].rbk}
                    <br />
                    Pass Blocking: {ratings[r].pbk}
                </div>
                <div className="col-4">
                    <b>Defense</b>
                    <br />
                    Pass Coverage: {ratings[r].pcv}
                    <br />
                    Tackling: {ratings[r].tck}
                    <br />
                    Pass Rushing: {ratings[r].prs}
                    <br />
                    Run Stopping: {ratings[r].rns}
                </div>
                <div className="col-4">
                    <b>Kicking</b>
                    <br />
                    Kick Power: {ratings[r].kpw}
                    <br />
                    Kick Accuracy: {ratings[r].kac}
                    <br />
                    Punt Power: {ratings[r].ppw}
                    <br />
                    Punt Accuracy: {ratings[r].pac}
                </div>
            </div>
        </>
    );
};

RatingsOverview.propTypes = {
    ratings: PropTypes.arrayOf(
        PropTypes.shape({
            ovr: PropTypes.number.isRequired,
            pot: PropTypes.number.isRequired,
            hgt: PropTypes.number.isRequired,
            stre: PropTypes.number.isRequired,
            spd: PropTypes.number.isRequired,
            endu: PropTypes.number.isRequired,
            thv: PropTypes.number.isRequired,
            thp: PropTypes.number.isRequired,
            tha: PropTypes.number.isRequired,
            bsc: PropTypes.number.isRequired,
            elu: PropTypes.number.isRequired,
            rtr: PropTypes.number.isRequired,
            hnd: PropTypes.number.isRequired,
            rbk: PropTypes.number.isRequired,
            pbk: PropTypes.number.isRequired,
            pcv: PropTypes.number.isRequired,
            tck: PropTypes.number.isRequired,
            prs: PropTypes.number.isRequired,
            rns: PropTypes.number.isRequired,
            kpw: PropTypes.number.isRequired,
            kac: PropTypes.number.isRequired,
            ppw: PropTypes.number.isRequired,
            pac: PropTypes.number.isRequired,
        }),
    ).isRequired,
};

export default RatingsOverview;
