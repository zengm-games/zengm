import {MSGTYPE} from '../../common';

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
    constructor() {
        self.addEventListener('connect', (e) => {
            this.port = e.ports[0];
            this.port.addEventListener('message', this._onMessage.bind(this));
            this.port.start();
        });

        this._callbacks = {};
    }

    register(cb) {
        this._queryCallback = cb;
    }

    _postMessageBi(obj) {
        this.port.postMessage(obj);
    }

    postMessage(userMessage) {
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

    _postResponse(messageId, error, result) {
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

    _handleQuery(messageId, query) {
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

    _onMessage(e) {
        const message = e.data;
        if (!Array.isArray(message) || message.length < 3 || message.length > 4) {
            // Ignore - this message is not for us.
            return;
        }
        const type = message[0];
        const messageId = message[1];

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
