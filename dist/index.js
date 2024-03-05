'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const glob_1 = require("glob");
const node_path_1 = __importDefault(require("node:path"));
const mkdirp_1 = require("mkdirp");
const node_fs_1 = __importDefault(require("node:fs"));
const svg_sprite_1 = __importDefault(require("svg-sprite"));
class WebpackSvgStore {
    inputPath;
    options;
    constructor(inputPath, options) {
        this.inputPath = inputPath;
        this.options = options;
    }
    async apply(compiler) {
        compiler.hooks.emit.tapAsync('WebpackSvgStore', async (compilation, callback) => {
            const files = await this.getFilesInFolder(this.inputPath, `${node_path_1.default.sep}**${node_path_1.default.sep}*.svg`);
            const fileTree = this.buildFileTree(files, this.inputPath);
            const spriteGroups = this.generateSpriteGroups(fileTree);
            for (const spriteGroup of spriteGroups) {
                await this.writeSvgSprites(spriteGroup, compilation);
            }
            callback();
        });
    }
    async writeSvgSprites(spriteGroup, compilation) {
        const clonedOptions = Object.assign({}, this.options);
        clonedOptions.dest = this.options.dest.replace(/\/$/, '') + '/' + spriteGroup.path;
        const spriter = new svg_sprite_1.default(clonedOptions);
        const baseInputPath = this.inputPath + spriteGroup.path;
        spriteGroup.files.forEach(fileName => {
            const fileInputPath = baseInputPath + '/' + fileName;
            spriter.add(fileInputPath, null, node_fs_1.default.readFileSync(fileInputPath, { encoding: 'utf-8' }));
            compilation.fileDependencies.add(fileInputPath);
        });
        spriter.compile(function (_, result) {
            for (const mode in result) {
                for (const resource in result[mode]) {
                    mkdirp_1.mkdirp.sync(node_path_1.default.dirname(result[mode][resource].path));
                    node_fs_1.default.writeFileSync(result[mode][resource].path, result[mode][resource].contents);
                }
            }
        });
    }
    async getFilesInFolder(folder, pattern) {
        return await (0, glob_1.glob)(`${folder.replace(/\/$/, '')}${pattern}`);
    }
    generateSpriteGroups(files, groupPath = '') {
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
            }
            else {
                group.files.push(fileTree.name);
            }
        }
        groups.push(group);
        return groups;
    }
    buildFileTree(files, rootPath) {
        const result = [];
        for (const file of files) {
            const segments = file.replace(rootPath, '').split(node_path_1.default.sep);
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
                const newNode = { name: segment, children: [] };
                currentLevel.push(newNode);
                currentLevel = newNode.children;
            }
        }
        return result;
    }
}
exports.default = WebpackSvgStore;
//# sourceMappingURL=index.js.map