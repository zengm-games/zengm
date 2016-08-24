const bbgmViewReact = require('../util/bbgmViewReact');
const ExportLeague = require('./views/ExportLeague');

module.exports = bbgmViewReact.init({
    id: "exportLeague",
    Component: ExportLeague,
});
