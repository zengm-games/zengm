// @flow

// Check all properties of an object for NaN
const checkObject = (obj, foundNaN, replace) => {
    foundNaN = foundNaN !== undefined ? foundNaN : false;
    replace = replace !== undefined ? replace : false;

    for (const prop of Object.keys(obj)) {
        if (typeof obj[prop] === 'object' && obj[prop] !== null) {
            foundNaN = checkObject(obj[prop], foundNaN, replace);
        } else if (obj[prop] !== obj[prop]) {
            // NaN check from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/isNaN
            foundNaN = true;
            if (replace) {
                obj[prop] = 0;
            }
        }
    }

    return foundNaN;
};

const wrap = (parent: any, name, wrapper) => {
    const original = parent[name];
    parent[name] = wrapper(original);
};

const wrapperNaNChecker = (_super) => {
    return function (obj, ...args) {
        if (checkObject(obj)) {
            const err = new Error('NaN found before writing to IndexedDB');

            if (window.Bugsnag) {
                window.Bugsnag.notifyException(err, 'NaNFound', {
                    details: {
                        objectWithNaN: JSON.stringify(obj, (key, value) => {
                            if (Number.isNaN) {
                                return 'FUCKING NaN RIGHT HERE';
                            }

                            return value;
                        }),
                    },
                });
            }

            // Hard crash
/*            gSend = JSON.parse(JSON.stringify(g)); // deepCopy fails for some reason
            delete gSend.teamAbbrevsCache;
            delete gSend.teamRegionsCache;
            delete gSend.teamNamesCache;

            output = '<h1>Critical Error</h1><p>You ran into the infamous NaN bug. But there's good news! You can help fix it! Please email the following information to <a href=\'mailto:commissioner@basketball-gm.com\'>commissioner@basketball-gm.com</a> along with any information about what you think might have caused this glitch. If you want to be extra helpful, <a href=\'' + leagueUrl(['export_league']) + '\'>export your league</a> and send that too (if it's huge, upload to Google Drive or Dropbox or whatever). Thanks!</p>';

            output += '<textarea class='form-control' style='height: 300px'>';
            output += JSON.stringify({
                stack: err.stack,
                input: obj,
                'this': this,
                gSend: gSend
            }, (key, value) => {
                if (value != value) {
                    return 'NaN RIGHT HERE';
                }

                return value;
            }, 2);
            output += '</textarea>';

            // Find somewhere to show output
            contentNode = document.getElementById('league_content');
            if (!contentNode) {
                contentNode = document.getElementById('content');
            }
            if (!contentNode) {
                contentNode = document.body;
            }
            contentNode.innerHTML = output;

            throw err;*/

            // Try to recover gracefully
            checkObject(obj, false, true); // This will update obj
        }

        return _super.call(this, obj, ...args);
    };
};

const checkNaNs = () => {
    wrap(IDBObjectStore.prototype, 'add', wrapperNaNChecker);
    wrap(IDBObjectStore.prototype, 'put', wrapperNaNChecker);
    wrap(IDBCursor.prototype, 'update', wrapperNaNChecker);
};

export default checkNaNs;
