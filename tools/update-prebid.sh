#!/bin/bash
cd node_modules/prebid.js
yarn
node_modules/.bin/gulp build --modules=appnexusBidAdapter,conversantBidAdapter,districtmDMXBidAdapter,indexExchangeBidAdapter,sovrnBidAdapter
cp build/dist/prebid.js ../../src/js/vendor/prebid.js
