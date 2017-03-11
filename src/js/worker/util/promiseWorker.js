// @flow

import {MSGTYPE} from '../../common';

type QueryCallback = (any[]) => any;

// Inlined from https://github.com/then/is-promise
function isPromise(obj) {
    return !!obj && (typeof obj === 'object' || typeof obj === 'function') && typeof obj.then === 'function';
}

function tryCatchFunc(callback, message) {
    try {
        return {res: callback(message)};
    } catch (e) {
        return {err: e};
    }
}

let messageIds = 0;

class PromiseWorker {
    _callbacks: {
        [key: number]: (null | Error, any) => void,
    };
    _hosts: Map<number, {lid: number | void, port: MessagePort}>;
    _maxHostID: number;
    _queryCallback: QueryCallback;

    constructor() {
        this._hosts = new Map();
        this._maxHostID = -1;

        self.addEventListener('connect', (e) => {
            const port = e.ports[0];
            port.addEventListener('message', (e2: MessageEvent) => this._onMessage(e2)); // eslint-disable-line no-undef
            port.start();

            this._maxHostID += 1;
            const hostID = this._maxHostID;
            this._hosts.set(hostID, {lid: undefined, port});
        });

        this._callbacks = {};
    }

    register(cb: QueryCallback) {
        this._queryCallback = cb;
    }

    _postMessageBi(obj: any) {
        for (const {port} of this._hosts.values()) {
            port.postMessage(obj);
        }
    }

    postMessage(userMessage: any) {
        return new Promise((resolve, reject) => {
            const messageId = messageIds++;

            const messageToSend = [MSGTYPE.QUERY, messageId, userMessage];

            this._callbacks[messageId] = (error, result) => {
                if (error) {
                    return reject(new Error(error.message));
                }
                resolve(result);
            };
            this._postMessageBi(messageToSend);
        });
    }

    _postResponse(messageId: number, error: any, result: any) {
        if (error) {
            // This is to make errors easier to debug. I think it's important
            // enough to just leave here without giving the user an option
            // to silence it.
            console.error('Error when generating response:', error);
            this._postMessageBi([MSGTYPE.RESPONSE, messageId, {
                message: error.message,
            }]);
        } else {
            this._postMessageBi([MSGTYPE.RESPONSE, messageId, null, result]);
        }
    }

    _handleQuery(messageId: number, query: any) {
        const result = tryCatchFunc(this._queryCallback, query);

        if (result.err) {
            this._postResponse(messageId, result.err);
        } else if (!isPromise(result.res)) {
            this._postResponse(messageId, null, result.res);
        } else {
            result.res.then((finalResult) => {
                this._postResponse(messageId, null, finalResult);
            }, (finalError) => {
                this._postResponse(messageId, finalError);
            });
        }
    }

    _onMessage(e: MessageEvent) { // eslint-disable-line no-undef
        const message = e.data;
        if (!Array.isArray(message) || message.length < 3 || message.length > 4) {
            return;
        }

        const type = message[0];
        if (type !== MSGTYPE.QUERY && type !== MSGTYPE.RESPONSE) {
            return;
        }
        const messageId = message[1];
        if (typeof messageId !== 'number') {
            return;
        }


        if (type === MSGTYPE.QUERY) {
            const query = message[2];

            this._handleQuery(messageId, query);
        } else if (type === MSGTYPE.RESPONSE) {
            const error = message[2];
            const result = message[3];

            const callback = this._callbacks[messageId];

            if (!callback) {
                // Ignore - user might have created multiple PromiseWorkers.
                // This message is not for us.
                return;
            }

            delete this._callbacks[messageId];
            callback(error, result);
        }
    }
}

const promiseWorker = new PromiseWorker();

export default promiseWorker;
