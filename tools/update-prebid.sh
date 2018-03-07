#!/bin/bash
cd node_modules/prebid.js
yarn
node_modules/.bin/gulp build --modules=appnexusBidAdapter,conversantBidAdapter,districtmDMXBidAdapter,indexExchangeBidAdapter,pulsepointBidAdapter,sovrnBidAdapter
cp build/dist/prebid.js ../../src/js/vendor/prebid.js
