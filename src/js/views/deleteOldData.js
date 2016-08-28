const bbgmViewReact = require('../util/bbgmViewReact');
const DeleteOldData = require('./views/DeleteOldData');

module.exports = bbgmViewReact.init({
    id: "deleteOldData",
    Component: DeleteOldData,
});
