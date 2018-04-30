'use strict';

const glob = require('glob');
const path = require('path');
const fs = require('fs');
const SVGSpriter = require('svg-sprite');
const mkdirp = require('mkdirp');

/**
 * @param inputPath
 * @param options
 * @constructor
 */
const WebpackSvgStore = function (inputPath, options) {
  this.inputPath = inputPath;
  this.spriter = new SVGSpriter(options);
};

/**
 * @param compiler
 */
WebpackSvgStore.prototype.apply = function (compiler) {
  let that = this;

  compiler.plugin('emit', function (compilation, callback) {
    glob(that.inputPath + '/**/*.svg', function (err, files) {
      for (let fileKey in files) {
        that.spriter.add(files[fileKey], null, fs.readFileSync(files[fileKey], {encoding: 'utf-8'}));

        let file = files[fileKey];
        if (compilation.fileDependencies.add) {
          compilation.fileDependencies.add(file);
        } else {
          compilation.fileDependencies.push(file);
        }
      }

      that.spriter.compile(function (error, result) {
        for (let mode in result) {
          for (let resource in result[mode]) {
            mkdirp.sync(path.dirname(result[mode][resource].path));
            fs.writeFileSync(result[mode][resource].path, result[mode][resource].contents);
          }
        }

        callback();
      });
    });
  });
};

/**
 * @type {WebpackSvgStore}
 */
module.exports = WebpackSvgStore;
