import { SvgOptionsType } from './_types/options';
import { FileGroup, TreeNode } from './_types/filesystem';
import { Compilation, Compiler } from 'webpack';
declare class WebpackSvgStore {
    protected inputPath: string;
    protected options: SvgOptionsType;
    constructor(inputPath: string, options: SvgOptionsType);
    apply(compiler: Compiler): Promise<void>;
    writeSvgSprites(spriteGroup: FileGroup, compilation: Compilation): Promise<void>;
    getFilesInFolder(folder: string, pattern: string): Promise<string[]>;
    generateSpriteGroups(files: TreeNode[], groupPath?: string): FileGroup[];
    buildFileTree(files: string[], rootPath: string): TreeNode[];
}
export default WebpackSvgStore;
