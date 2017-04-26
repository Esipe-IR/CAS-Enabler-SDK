tsc
uglifyjs dist/sdk.js > dist/upem_sdk.npm.min.js
rm dist/sdk.js
browserify dist/upem_sdk.npm.min.js --standalone upem-sdk > dist/upem_sdk.min.js
