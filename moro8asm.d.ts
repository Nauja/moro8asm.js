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
export function compile(program: string): Uint8Array;

export interface Moro8ASMModule extends EmscriptenModule {
    compile: typeof compile; 
}

declare const factory: () => Promise<Moro8ASMModule>;
export default factory;