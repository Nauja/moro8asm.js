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

class Instruction {
    private _ptr?: number;
    private _manage_memory: boolean;
    private _next?: Instruction;

    get ptr(): number|undefined {
        return this._ptr;
    }

    get pc(): number {
        return moro8asm.ccall("moro8asm_instruction_get_pc", "number", ["number"], [this.ptr]);
    }

    get line(): number {
        return moro8asm.ccall("moro8asm_instruction_get_line", "number", ["number"], [this.ptr]);
    }

    get size(): number {
        return moro8asm.ccall("moro8asm_instruction_get_size", "number", ["number"], [this.ptr]);
    }

    get next(): Instruction {
        if (!this._next) {
            this._next = new Instruction(moro8asm.ccall("moro8asm_instruction_get_next", "number", ["number"], [this.ptr]));
        }

        return this._next;
    }

    constructor(ptr?: number) {
        this._ptr = ptr;
        this._manage_memory = false;

        if (this._ptr === undefined) {
            this._ptr = moro8asm.ccall("moro8asm_instruction_create", "number", null, null);
            this._manage_memory = true;
        }
    }

    delete(): void {
        if (this._ptr === undefined)
        {
            return;
        }

        if (this._manage_memory)
        {
            moro8asm.ccall("moro8asm_instruction_delete", null, "number", [this._ptr]);
        }
        this._ptr = undefined;
    }
}

class Program {
    private _ptr?: number;
    private _manage_memory: boolean;

    get ptr(): number|undefined {
        return this._ptr;
    }

    get num_labels(): number {
        return moro8asm.ccall("moro8asm_program_num_labels", "number", ["number"], [this.ptr]);
    }

    get num_lines(): number {
        return moro8asm.ccall("moro8asm_program_num_lines", "number", ["number"], [this.ptr]);
    }

    get size(): number {
        return moro8asm.ccall("moro8asm_program_size", "number", ["number"], [this.ptr]);
    }

    constructor(ptr?: number) {
        this._ptr = ptr;
        this._manage_memory = false;

        if (this._ptr === undefined) {
            this._ptr = moro8asm.ccall("moro8asm_program_create", "number", null, null);
            this._manage_memory = true;
        }
    }

    delete(): void {
        if (this._ptr === undefined)
        {
            return;
        }

        if (this._manage_memory)
        {
            moro8asm.ccall("moro8asm_program_delete", null, "number", [this._ptr]);
        }
        this._ptr = undefined;
    }

    get_line(index: number): Instruction {
        return new Instruction(moro8asm.ccall("moro8asm_program_get_line", "number", ["number", "number"], [this.ptr, index]));
    }
}

function tokenize(program: string): number
{
    // Copy the program to an Uint8Array
    const program_buffer = new Uint8Array(program.length);

    for (let i = 0; i < program.length; ++i)
    {
        program_buffer[i] = program[i].charCodeAt(0);
    }

    // Copy to WASM memory
    const program_ptr = push_array(program_buffer, program_buffer.length);

    const token_ptr = moro8asm.ccall(
        "moro8asm_tokenize",
        "number",
        ["number", "number"],
        [program_ptr, program_buffer.length]
    );

    // Delete program buffer
    pop_array(program_ptr, program_buffer, program_buffer.length);

    return token_ptr;
}

function parse(token: number): Program
{
    return new Program(moro8asm.ccall(
        "moro8asm_parse",
        "number",
        ["number"],
        [token]
    ));
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

moro8asm.Instruction = Instruction;
moro8asm.Program = Program;
moro8asm.tokenize = tokenize;
moro8asm.parse = parse;
moro8asm.compile = compile;