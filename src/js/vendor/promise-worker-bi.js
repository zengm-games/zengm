'use strict';

var messageIds = 0;

var MSGTYPE_QUERY = 0;
var MSGTYPE_RESPONSE = 1;

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
    self.onconnect = function(e) {
      this.port = e.ports[0];
      this.port.addEventListener('message', this._onMessage.bind(this));
      this.port.start();
    }.bind(this);
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
  return new Promise(function (resolve, reject) {
    var messageId = messageIds++;

    var messageToSend = [MSGTYPE_QUERY, messageId, userMessage];

    this._callbacks[messageId] = function (error, result) {
      if (error) {
        return reject(new Error(error.message));
      }
      resolve(result);
    };
    this._postMessageBi(messageToSend);
  }.bind(this));
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
      message: error.message
    }]);
  } else {
    this._postMessageBi([MSGTYPE_RESPONSE, messageId, null, result]);
  }
};

PromiseWorker.prototype._handleQuery = function (messageId, query) {
  var result = tryCatchFunc(this._queryCallback, query);

  if (result.err) {
    this._postResponse(messageId, result.err);
  } else if (!isPromise(result.res)) {
    this._postResponse(messageId, null, result.res);
  } else {
    result.res.then(function (finalResult) {
      this._postResponse(messageId, null, finalResult);
    }.bind(this), function (finalError) {
      this._postResponse(messageId, finalError);
    }.bind(this));
  }
};

PromiseWorker.prototype._onMessage = function (e) {
  var message = e.data;
  if (!Array.isArray(message) || message.length < 3 || message.length > 4) {
    // Ignore - this message is not for us.
    return;
  }
  var type = message[0];
  var messageId = message[1];

  if (type === MSGTYPE_QUERY) {
    var query = message[2];

    this._handleQuery(messageId, query);
  } else if (type === MSGTYPE_RESPONSE) {
    var error = message[2];
    var result = message[3];

    var callback = this._callbacks[messageId];

    if (!callback) {
      // Ignore - user might have created multiple PromiseWorkers.
      // This message is not for us.
      return;
    }

    delete this._callbacks[messageId];
    callback(error, result);
  }
};

module.exports = PromiseWorker;
