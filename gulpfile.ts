import { src, dest, series } from 'gulp';
import through2 from 'through2';
import log from 'fancy-log';
import File from 'vinyl';
import solc, { JSON_INPUT } from '@frugal-wizard/solidity-compiler-wrapper';
import { abi2ts } from '@frugal-wizard/abi2ts';
import { spawn } from 'child_process';
import { readdirSync, writeFileSync } from 'fs';
import { resolve, relative } from 'path';
import rimraf from 'rimraf';
import { promisify } from 'util';

const promisifiedRimraf = promisify(rimraf);

export async function clean() {
    await promisifiedRimraf('artifacts/**');
    await promisifiedRimraf('src/!(tsconfig.json)');
    await promisifiedRimraf('dist/**');
}

export function compileContracts() {
    return src('contracts/**/*.sol')
        .pipe(through2.obj(function(file: File, _, callback) {
            const compileResult = solc(file.base, file.relative, file.contents as Buffer, { optimizer: { enabled: true } });

            const inputJson = file.clone();
            inputJson.contents = Buffer.from(JSON.stringify(compileResult[JSON_INPUT], null, 2));
            inputJson.extname = '.input.json';
            this.push(inputJson);

            const compileJson = file.clone();
            compileJson.contents = Buffer.from(JSON.stringify(compileResult, null, 2));
            compileJson.extname = '.json';
            this.push(compileJson);

            log(`>>> Compiled contracts/${file.relative}`);

            callback();
        }))
        .pipe(dest('artifacts'));
}

export function createContractsTS() {
    return src([ 'artifacts/**/*.json', '!artifacts/**/*.input.json' ])
        .pipe(through2.obj(function(file: File, _, callback) {
            file.contents = abi2ts(file.contents as Buffer);
            file.extname = '.ts';
            log(`>>> Created src/${file.relative}`);
            callback(null, file);
        }))
        .pipe(dest('src'));
}

export function createIndexTS(done: () => void) {
    function _createIndexTS(path: string) {
        const exports = [];
        for (const file of readdirSync(path, { withFileTypes: true })) {
            if (file.isDirectory()) {
                _createIndexTS(resolve(path, file.name));
                exports.push(`export * as ${file.name} from './${file.name}/index';`);
            } else if (file.name == 'index.ts') {
                continue;
            } else if (file.name.endsWith('.ts')) {
                const name = file.name.slice(0, -3);
                exports.push(`export * as ${name} from './${name}';`);
            }
        }
        const filepath = resolve(path, 'index.ts');
        writeFileSync(filepath, exports.join('\n'));
        log(`>>> Created ${relative(__dirname, filepath)}`);
    }
    _createIndexTS(resolve(__dirname, 'src'));
    done();
}

export function compileContractsTS() {
    return spawn('npx tsc -p src', { shell: true, stdio: 'inherit' });
}

export default function(done: () => void) {
    void series(clean, compileContracts, createContractsTS, createIndexTS, compileContractsTS)(done);
}
