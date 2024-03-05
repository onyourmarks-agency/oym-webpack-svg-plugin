'use strict';

import { glob } from 'glob';
import {SvgOptionsType} from './_types/options';
import path from 'node:path';
import {FileGroup, TreeNode} from './_types/filesystem';
import {Compilation, Compiler} from 'webpack';
import {mkdirp} from 'mkdirp';
import fs from 'node:fs';
import SVGSpriter, {Config} from 'svg-sprite';

class WebpackSvgStore {
  constructor(
    protected inputPath: string,
    protected options: SvgOptionsType
  ) {
  }

  async apply(compiler: Compiler): Promise<void> {
    compiler.hooks.emit.tapAsync(
      'WebpackSvgStore',
      async (compilation: Compilation, callback) => {
        const files: string[] = await this.getFilesInFolder(this.inputPath, `${path.sep}**${path.sep}*.svg`);
        const fileTree: TreeNode[] = this.buildFileTree(files, this.inputPath);
        const spriteGroups: FileGroup[]= this.generateSpriteGroups(fileTree);

        for (const spriteGroup of spriteGroups) {
          await this.writeSvgSprites(
            spriteGroup,
            compilation
          );
        }
        callback();
      }
    );
  }

  async writeSvgSprites(spriteGroup: FileGroup, compilation: Compilation) {
    const clonedOptions: Config = Object.assign({}, this.options);

    clonedOptions.dest = this.options.dest.replace(/\/$/, '') + '/' + spriteGroup.path;
    const spriter = new SVGSpriter(clonedOptions);

    const baseInputPath = this.inputPath + spriteGroup.path;

    spriteGroup.files.forEach(fileName => {
      const fileInputPath = baseInputPath + '/' + fileName;
      spriter.add(fileInputPath, null, fs.readFileSync(fileInputPath, {encoding: 'utf-8'}));
      compilation.fileDependencies.add(fileInputPath);
    });

    spriter.compile(function (_, result) {
      for (const mode in result) {
        for (const resource in result[mode]) {
          mkdirp.sync(path.dirname(result[mode][resource].path));
          fs.writeFileSync(result[mode][resource].path, result[mode][resource].contents);
        }
      }
    });
  }

  async getFilesInFolder(folder: string, pattern: string): Promise<string[]> {
    return await glob(`${folder.replace(/\/$/, '')}${pattern}`);
  }

  generateSpriteGroups(files: TreeNode[], groupPath: string = ''): FileGroup[] {
    let groups:  FileGroup[] = [];

    const group: FileGroup = {
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

  buildFileTree(files: string[], rootPath: string): TreeNode[] {
    const result: TreeNode[] = [];

    for (const file of files) {
      const segments = file.replace(rootPath, '').split(path.sep);
      let currentLevel = result;

      for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];
        if (!segment) {
          continue;
        }
        const existingNode = currentLevel.find(node => node.name === segment);

        if (existingNode) {
          currentLevel = existingNode.children;
          continue;
        }

        const newNode: TreeNode = { name: segment, children: [] };
        currentLevel.push(newNode);
        currentLevel = newNode.children;
      }
    }

    return result;
  }
}

export default WebpackSvgStore;
