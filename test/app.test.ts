import * as fs from 'fs';
import * as path from 'path';
import factory, { Moro8ASMModule } from "../moro8asm";

const PROGRAMS_PATH = "vendor/moro8asm/tests/test_programs";

describe("test moro8asm", () => {
    it("should parse alive.asm", (done) => {
        factory().then((moro8asm: Moro8ASMModule) => {
            // Load test program
            const program = fs.readFileSync(path.join(PROGRAMS_PATH, "alive.asm")).toString();
            expect(program.startsWith("; I'm alive")).toBeTruthy();

            // Tokenize
            const token = moro8asm.tokenize(program);
            expect(token).toBeTruthy();
            const parsed = moro8asm.parse(token);
            expect(parsed).toBeTruthy();
            expect(parsed.num_labels).toEqual(7);
            expect(parsed.num_lines).toEqual(44);
            expect(parsed.size).toEqual(135);
            parsed.delete();
            done();
        });
    });
    it("should compile alive.asm", (done) => {
        factory().then((moro8asm: Moro8ASMModule) => {
            // Load test program
            const program = fs.readFileSync(path.join(PROGRAMS_PATH, "alive.asm")).toString();
            expect(program.startsWith("; I'm alive")).toBeTruthy();

            // Compile
            const bytes: Uint8Array = moro8asm.compile(program);
            expect(bytes.length).toEqual(135);
            done();
        });
    });
});
