const React = require('react');
const helpers = require('../../util/helpers');

module.exports = ({children, parts}) => <a href={helpers.leagueUrl(parts)}>{children}</a>;
