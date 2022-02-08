import "emscripten";
/**
 * JS wrapper for the moro8asm library written in ANSI C.
 *
 * This is written in TypeScript as to had some type checking
 * and prevent mistakes.
 */
/**
 * moro8asm is the module exported by emscripten for wrapping
 * the WASM binary.
 *
 * This is the entrypoint or moro8asm.js, so we export all our
 * constants and classes here.
 */
export class Instruction {
    private _manage_memory;
    private _next?;
    get pc(): number;
    get line(): number;
    get size(): number;
    get next(): Instruction;
    constructor();
    delete(): void;
}
export class Program {
    private _manage_memory;
    get num_labels(): number;
    get num_lines(): number;
    get size(): number;
    constructor();
    delete(): void;
    get_line(index: number): Instruction;
}
export function tokenize(program: string): number;
export function parse(token: number): Program;
export function compile(program: string): Uint8Array;

export interface Moro8ASMModule extends EmscriptenModule {
    Instruction: typeof Instruction; 
    Program: typeof Program; 
    tokenize: typeof tokenize; 
    parse: typeof parse; 
    compile: typeof compile; 
}

declare const factory: () => Promise<Moro8ASMModule>;
export default factory;