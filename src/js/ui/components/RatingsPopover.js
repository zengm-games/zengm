// @flow

import React from 'react';
import OverlayTrigger from 'react-bootstrap/lib/OverlayTrigger';
import Popover from 'react-bootstrap/lib/Popover';

const RatingsPopover = ({pid, ratings, stats}) => {
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
    const formatShot = (made, attempt, type) => {
        const f = made.toFixed(1);
        const fa = attempt.toFixed(1);
        const pct = attempt > 0 ? Math.round((made / attempt).toFixed(2) * 100) : 0;
        let color = "";
        if (type === 'fg') {
            color = pct > 45 ? "text-success" : color;
            color = pct < 40 ? "text-warning" : color;
            color = pct < 35 ? "text-danger" : color;
        } else if (type === 'tp') {
            color = pct > 40 ? "text-success" : color;
            color = pct < 35 ? "text-warning" : color;
            color = pct < 30 ? "text-danger" : color;
        } else if (type === 'ft') {
            color = pct > 85 ? "text-success" : color;
            color = pct < 80 ? "text-warning" : color;
            color = pct < 60 ? "text-danger" : color;
        }
        return <span className={color}>{f}/{fa}/{pct}%</span>;
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
            { (stats && stats.fg !== null && stats.fga !== null && stats.tp !== null && stats.tpa !== null &&
                stats.ft !== null && stats.fta !== null) &&
                <div>
                    <br />
                    <div className="row">
                        <div className="col-xs-4">
                            <b>FG</b><br />
                            {formatShot(stats.fg, stats.fga, 'fg')}
                        </div>
                        <div className="col-xs-4">
                            <b>3PT</b><br />
                            <span>{formatShot(stats.tp, stats.tpa, 'tp')}</span>
                        </div>
                        <div className="col-xs-4">
                            <b>FT</b><br />
                            <span>{formatShot(stats.ft, stats.fta, 'ft')}</span>
                        </div>
                    </div>
                </div>
                || null
            }
        </Popover>
    );

    return <OverlayTrigger trigger="click" rootClose placement="right" overlay={popoverPlayerRatings}>
        <span className="glyphicon glyphicon-th watch" aria-hidden="true" />
    </OverlayTrigger>;
};
RatingsPopover.propTypes = {
    pid: React.PropTypes.number,
    ratings: React.PropTypes.object,
    stats: React.PropTypes.object,
};

export default RatingsPopover;
