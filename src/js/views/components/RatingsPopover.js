// @flow

import React from 'react';
import OverlayTrigger from 'react-bootstrap/lib/OverlayTrigger';
import Popover from 'react-bootstrap/lib/Popover';

const RatingsPopover = ({pid, ratings}) => {
    const colorRating = (rating) => {
        if (rating >= 80) {
            return "text-success";
        } else if (rating > 30 && rating <= 60) {
            return "text-warning";
        } else if (rating <= 30) {
            return "text-danger";
        }
        return "";
    };
    const popoverPlayerRatings = (
        <Popover id={`ratings-pop-${pid}`}>
            <div className="row">
                <div className="col-xs-4">
                    <b>Physical</b><br />
                    <span>Hgt: {ratings.hgt}</span><br />
                    <span className={colorRating(ratings.stre)}>Str: {ratings.stre}</span><br />
                    <span className={colorRating(ratings.spd)}>Spd: {ratings.spd}</span><br />
                    <span className={colorRating(ratings.jmp)}>Jmp: {ratings.jmp}</span><br />
                    <span className={colorRating(ratings.endu)}>End: {ratings.endu}</span>
                </div>
                <div className="col-xs-4">
                    <b>Shooting</b><br />
                    <span className={colorRating(ratings.ins)}>Ins: {ratings.ins}</span><br />
                    <span className={colorRating(ratings.dnk)}>Dnk: {ratings.dnk}</span><br />
                    <span className={colorRating(ratings.ft)}>Ft: {ratings.ft}</span><br />
                    <span className={colorRating(ratings.fg)}>2Pt: {ratings.fg}</span><br />
                    <span className={colorRating(ratings.tp)}>3Pt: {ratings.tp}</span>
                </div>
                <div className="col-xs-4">
                    <b>Skill</b><br />
                    <span className={colorRating(ratings.blk)}>Blk: {ratings.blk}</span><br />
                    <span className={colorRating(ratings.stl)}>Stl: {ratings.stl}</span><br />
                    <span className={colorRating(ratings.drb)}>Drb: {ratings.drb}</span><br />
                    <span className={colorRating(ratings.pss)}>Pss: {ratings.pss}</span><br />
                    <span className={colorRating(ratings.reb)}>Reb: {ratings.reb}</span>
                </div>
            </div>
        </Popover>
    );

    return <OverlayTrigger trigger="click" rootClose placement="right" overlay={popoverPlayerRatings}>
        <span className="glyphicon glyphicon-th watch" aria-hidden="true" />
    </OverlayTrigger>;
};
RatingsPopover.propTypes = {
    pid: React.PropTypes.number,
    ratings: React.PropTypes.object,
};

export default RatingsPopover;
