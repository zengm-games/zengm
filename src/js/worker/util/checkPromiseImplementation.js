// @flow

import Backboard from 'backboard';
import lie from '../../vendor/lie';

// Because of http://stackoverflow.com/q/28388129/786644 native promises often don't play nice with IndexedDB
// transactions, like in Firefox. Because of http://stackoverflow.com/q/42660581/786644 the best workaround I could find
// was (ugh) synchronous promises, implemented with a slightly modified version of https://github.com/calvinmetcalf/lie

const applyPromisePolyfill = () => {
    console.log('Using sync promise polyfill');

    self.Promise = lie;
    Backboard.setPromiseConstructor(self.Promise);

    // Keep track of when a transaction is active, which is used inside lie.js
    const nativeIDBDatabaseTransaction = IDBDatabase.prototype.transaction;
    const handleTransactionEnd = function () {
        this.txCount -= 1;
        if (this.txCount === 0) {
            self.Promise.idbTransaction = false;
        }
        if (this.txCount < 0) {
            this.txCount = 0;
            console.log('txCount below 0 should not be possible!');
        }
    };
    // $FlowFixMe
    IDBDatabase.prototype.transaction = function (...args) {
        self.Promise.idbTransaction = true;
        if (!this.hasOwnProperty('txCount') || this.txCount < 0) {
            this.txCount = 1;
        } else {
            this.txCount += 1;
        }
        const tx2 = nativeIDBDatabaseTransaction.apply(this, args);
        tx2.addEventListener('abort', handleTransactionEnd.bind(this));
        tx2.addEventListener('complete', handleTransactionEnd.bind(this));
        tx2.addEventListener('error', handleTransactionEnd.bind(this));
        return tx2;
    };
};

const checkPromiseImplementation = () => {
    return new Promise((resolve, reject) => {
        const request = self.indexedDB.open('test-idb-microtasks', 1);
        request.onerror = (event) => reject(event.target.error);
        request.onblocked = () => reject('Blocked');
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            db.createObjectStore('whatever', {keyPath: 'id'});
        };
        request.onsuccess = (event) => {
            const db = event.target.result;
            const tx = db.transaction('whatever');
            Promise.resolve().then(() => {
                // If the transaction is still open here, then everything will work and no polyfill is needed. But if
                // the transaction is closed, using it will produce an error here, and we'll need a polyfill to deal
                // with similar situations elsewhere.

                try {
                    tx.objectStore('whatever');
                    console.log('Using native promises');
                } catch (err) {
                    if (err.name === 'InvalidStateError') {
                        applyPromisePolyfill();
                    } else {
                        reject(err);
                        return;
                    }
                }

                resolve();
            });
        };
    });
};

export default checkPromiseImplementation;
