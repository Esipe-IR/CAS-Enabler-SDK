tsc
uglifyjs dist/sdk.js > dist/sdk.npm.min.js
browserify dist/sdk.npm.min.js -o dist/sdk.min.js
