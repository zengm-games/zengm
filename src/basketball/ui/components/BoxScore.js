import PropTypes from "prop-types";
import React from "react";
import ResponsiveTableWrapper from "../../../deion/ui/components/ResponsiveTableWrapper";
import { helpers } from "../../../deion/ui/util";

const BoxScore = ({ boxScore, Row }) => {
    return (
        <>
            {boxScore.teams.map(t => (
                <div key={t.abbrev} className="mb-3">
                    <h3>
                        <a
                            href={helpers.leagueUrl([
                                "roster",
                                t.abbrev,
                                boxScore.season,
                            ])}
                        >
                            {t.region} {t.name}
                        </a>
                    </h3>
                    <ResponsiveTableWrapper>
                        <table className="table table-striped table-bordered table-sm table-hover">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Pos</th>
                                    <th>MP</th>
                                    <th>FG</th>
                                    <th>3Pt</th>
                                    <th>FT</th>
                                    <th>ORB</th>
                                    <th>TRB</th>
                                    <th>AST</th>
                                    <th>TO</th>
                                    <th>STL</th>
                                    <th>BLK</th>
                                    <th>BA</th>
                                    <th>PF</th>
                                    <th>PTS</th>
                                    <th>+/-</th>
                                    <th title="Game Score">GmSc</th>
                                </tr>
                            </thead>
                            <tbody>
                                {t.players.map((p, i) => {
                                    return <Row key={p.pid} i={i} p={p} />;
                                })}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <th>Total</th>
                                    <th />
                                    <th>
                                        {Number.isInteger(t.min)
                                            ? t.min
                                            : t.min.toFixed(1)}
                                    </th>
                                    <th>
                                        {t.fg}-{t.fga}
                                    </th>
                                    <th>
                                        {t.tp}-{t.tpa}
                                    </th>
                                    <th>
                                        {t.ft}-{t.fta}
                                    </th>
                                    <th>{t.orb}</th>
                                    <th>{t.drb + t.orb}</th>
                                    <th>{t.ast}</th>
                                    <th>{t.tov}</th>
                                    <th>{t.stl}</th>
                                    <th>{t.blk}</th>
                                    <th>{t.ba}</th>
                                    <th>{t.pf}</th>
                                    <th>{t.pts}</th>
                                    <th />
                                    <th />
                                </tr>
                                <tr>
                                    <th>Percentages</th>
                                    <th />
                                    <th />
                                    <th>
                                        {helpers.roundStat(
                                            (100 * t.fg) / t.fga,
                                            "fgp",
                                        )}
                                        %
                                    </th>
                                    <th>
                                        {helpers.roundStat(
                                            (100 * t.tp) / t.tpa,
                                            "tpp",
                                        )}
                                        %
                                    </th>
                                    <th>
                                        {helpers.roundStat(
                                            (100 * t.ft) / t.fta,
                                            "ftp",
                                        )}
                                        %
                                    </th>
                                    <th />
                                    <th />
                                    <th />
                                    <th />
                                    <th />
                                    <th />
                                    <th />
                                    <th />
                                    <th />
                                    <th />
                                    <th />
                                </tr>
                            </tfoot>
                        </table>
                    </ResponsiveTableWrapper>
                </div>
            ))}
        </>
    );
};

BoxScore.propTypes = {
    boxScore: PropTypes.object.isRequired,
    Row: PropTypes.any,
};

export default BoxScore;
