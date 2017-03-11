let messageIds = 0;

const MSGTYPE_QUERY = 0;
const MSGTYPE_RESPONSE = 1;

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

function PromiseWorker(worker) {
    if (worker === undefined) {
        self.onconnect = (e) => {
            this.port = e.ports[0];
            this.port.addEventListener('message', this._onMessage.bind(this));
            this.port.start();
        };
    } else {
        this._worker = worker;
        worker.port.addEventListener('message', this._onMessage.bind(this));
        worker.port.start();
    }

    this._callbacks = {};
}

PromiseWorker.prototype.register = function (cb) {
    this._queryCallback = cb;
};

PromiseWorker.prototype._postMessageBi = function (obj) {
    if (this._worker) {
        this._worker.port.postMessage(obj);
    } else {
        this.port.postMessage(obj);
    }
};

PromiseWorker.prototype.postMessage = function (userMessage) {
    return new Promise((resolve, reject) => {
        const messageId = messageIds++;

        const messageToSend = [MSGTYPE_QUERY, messageId, userMessage];

        this._callbacks[messageId] = (error, result) => {
            if (error) {
                return reject(new Error(error.message));
            }
            resolve(result);
        };
        this._postMessageBi(messageToSend);
    });
};

PromiseWorker.prototype._postResponse = function (messageId, error, result) {
    if (error) {
        /* istanbul ignore else */
        if (typeof console !== 'undefined' && 'error' in console) {
            // This is to make errors easier to debug. I think it's important
            // enough to just leave here without giving the user an option
            // to silence it.
            console.error('Error when generating response:', error);
        }
        this._postMessageBi([MSGTYPE_RESPONSE, messageId, {
            message: error.message,
        }]);
    } else {
        this._postMessageBi([MSGTYPE_RESPONSE, messageId, null, result]);
    }
};

PromiseWorker.prototype._handleQuery = function (messageId, query) {
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
};

PromiseWorker.prototype._onMessage = function (e) {
    const message = e.data;
    if (!Array.isArray(message) || message.length < 3 || message.length > 4) {
        // Ignore - this message is not for us.
        return;
    }
    const type = message[0];
    const messageId = message[1];

    if (type === MSGTYPE_QUERY) {
        const query = message[2];

        this._handleQuery(messageId, query);
    } else if (type === MSGTYPE_RESPONSE) {
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
};

const worker = new SharedWorker('/gen/worker.js');
const promiseWorker = new PromiseWorker(worker);

export default promiseWorker;
