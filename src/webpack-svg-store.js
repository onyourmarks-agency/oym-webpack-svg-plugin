'use strict';

const glob = require('glob');
const path = require('path');
const fs = require('fs');
const SVGSpriter = require('svg-sprite');
const mkdirp = require('mkdirp');

class WebpackSvgStore {
  /**
   * @param inputPath
   * @param options
   */
  constructor(inputPath, options) {
    this.inputPath = inputPath;
    this.options = options;
  }

  /**
   * @param compiler
   * @returns {Promise}
   */
  async apply(compiler) {
    this.compiler = compiler;

    const that = this;
    compiler.hooks.emit.tapAsync(
      'WebpackSvgStore',
      async (compilation, callback) => {
        let files = await that.getFilesInFolder(that.inputPath, `${path.sep}**${path.sep}*.svg`);
        files = that.buildFileTree(files, that.inputPath);
        const spriteGroups = that.generateSpriteGroups(files,);

        for (const spriteGroup of spriteGroups) {
          await that.writeSvgSprites(
            spriteGroup,
            that.options,
            compilation
          );
        }
        callback();
      }
    );
  }

  generateSpriteGroups(files, groupPath) {
    groupPath = groupPath || '';

    let groups = [];

    const group = {
      path: groupPath,
      files: [],
    };

    for (const fileTree of files) {
      if (fileTree.children.length) {
        const childGroupPath = groupPath ? groupPath + '/' + fileTree.name : fileTree.name;
        const childGroups = this.generateSpriteGroups(fileTree.children, childGroupPath);
        groups = [...groups, ...childGroups];
      } else {
        group.files.push(fileTree.name);
      }
    }

    groups.push(group);
    return groups;
  }

  /**
   * @param files
   * @param options
   * @returns {Promise}
   */
  async writeSvgSprites(spriteGroup, options, compilation) {
    const clonedOptions = Object.assign({}, this.options);

    clonedOptions.dest = this.options.dest.replace(/\/$/, '') + '/' + spriteGroup.path;
    const spriter = new SVGSpriter(clonedOptions);

    const baseInputPath = this.inputPath + spriteGroup.path;

    for (let fileName of spriteGroup.files) {
      const fileInputPath = baseInputPath + '/' + fileName;
      spriter.add(fileInputPath, null, fs.readFileSync(fileInputPath, {encoding: 'utf-8'}));

      if (compilation.fileDependencies.add) {
        compilation.fileDependencies.add(fileInputPath);
      } else {
        compilation.fileDependencies.push(fileInputPath);
      }
    }

    spriter.compile(function (error, result) {
      for (let mode in result) {
        for (let resource in result[mode]) {
          mkdirp.sync(path.dirname(result[mode][resource].path));
          fs.writeFileSync(result[mode][resource].path, result[mode][resource].contents);
        }
      }
    });
  }

  /**
   * @param folder
   * @param pattern
   * @returns {Promise}
   */
  async getFilesInFolder(folder, pattern) {
    const that = this;

    return new Promise((resolve, reject) => {
      const folderList = {};

      glob(folder + pattern, (err, files) => {
        if (err) {
          return reject(err);
        }

        return resolve(files);
      });
    });
  }

  /**
   * @param files
   * @param rootPath
   * @returns {*[]}
   */
  buildFileTree(files, rootPath) {
    let result = [];
    let level = {result};

    files.forEach(file => {
      file = file.replace(rootPath, '');

      file.split(path.sep).reduce(
        (reducedResult, name) => {
          if (!reducedResult[name]) {
            reducedResult[name] = {
              result: []
            };

            reducedResult.result.push({
              name,
              children: reducedResult[name].result
            });
          }

          return reducedResult[name];
        },
        level
      )
    });

    return result;
  }
}

module.exports = WebpackSvgStore;
