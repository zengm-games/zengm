#!/bin/bash
cd node_modules/prebid.js
npm install
node_modules/.bin/gulp build --modules=appnexusBidAdapter,conversantBidAdapter,indexExchangeBidAdapter,pulsepointBidAdapter,sovrnBidAdapter
cp build/dist/prebid.js ../../src/js/vendor/prebid.js
