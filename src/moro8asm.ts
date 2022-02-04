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
declare let moro8asm: any;

/** @internal */
function push_array(buffer: Uint8Array, size: number): number
{
    const ptr = moro8asm._malloc(size * Uint8Array.BYTES_PER_ELEMENT);
    moro8asm.HEAPU8.set(buffer, ptr);
    return ptr;
}

/** @internal */
function pop_array(ptr: number, buffer: Uint8Array, size: number)
{
    for (let i = 0; i < size; ++i)
    {
        buffer[i] = moro8asm.HEAPU8[ptr + i];
    }
    moro8asm._free(ptr);
}

function compile(program: string): Uint8Array
{
    // Copy the program to an Uint8Array
    const program_buffer = new Uint8Array(program.length);

    for (let i = 0; i < program.length; ++i)
    {
        program_buffer[i] = program[i].charCodeAt(0);
    }

    // Copy to WASM memory
    const program_ptr = push_array(program_buffer, program_buffer.length);

    // Allocates an int for receiving the number of bytes written
    const size_buffer = new Uint8Array(4);
    const size_ptr = push_array(size_buffer, size_buffer.length);

    // Compile
    const bytes_ptr = moro8asm.ccall(
        "moro8asm_compile",
        "number",
        ["number", "number", "number"],
        [program_ptr, program_buffer.length, size_ptr]
    );

    // Delete program buffer
    pop_array(program_ptr, program_buffer, program_buffer.length);

    // Delete int buffer
    pop_array(size_ptr, size_buffer, size_buffer.length);

    // Copy back program bytes
    const size = size_buffer[0];
    const bytes = new Uint8Array(size);
    pop_array(bytes_ptr, bytes, bytes.length);
    return bytes;
}

moro8asm.compile = compile;