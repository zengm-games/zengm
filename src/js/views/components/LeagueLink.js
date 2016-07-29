const helpers = require('../../util/helpers');
const React = require('react');

module.exports = ({children, parts}) => <a href={helpers.leagueUrl(parts)}>{children}</a>;
