const bbgmViewReact = require('../util/bbgmViewReact');
const LostPassword = require('./views/LostPassword');

module.exports = bbgmViewReact.init({
    id: "lostPassword",
    inLeague: false,
    Component: LostPassword,
});
