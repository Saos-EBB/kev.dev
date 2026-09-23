// Runs the original Java programs in the browser through CheerpJ, with the
// program's stdin/stdout wired to our own terminal. No source changes, no
// server: CheerpJ executes the compiled bytecode (public/java/grundlagen.jar,
// built by scripts/build-java.sh) via WebAssembly.
//
// CheerpJ's public API has no stdin. The runtime gives every Java process
// its file descriptors 0/1/2 in `cheerpOSInitFds`, backed by a console
// object whose input callback is empty (a `Scanner` read would block
// forever). We replace `cheerpOSInitFds` to hand each process a console
// backed by our own callbacks. Both globals are internal to the runtime, so
// the loader URL below is pinned to an exact version on purpose; re-test the
// bridge before bumping it.
//
// Free for personal projects under the CheerpJ Community License; the
// widget shows the required credit.

const LOADER_URL = "https://cjrtnc.leaningtech.com/4.3/loader.js";
const JAR = "/app/java/grundlagen.jar";

type ReadCallback = (
  param: unknown,
  fileOffset: number,
  buf: Uint8Array,
  off: number,
  len: number,
  cb: (n: number) => void,
) => void;

declare global {
  function cheerpjInit(options?: { version?: number; status?: string }): Promise<void>;
  function cheerpjRunMain(cls: string, classPath: string, ...args: string[]): Promise<number>;
  function cheerpjRunLibrary(classPath: string): Promise<any>;
  function cheerpjCreateConsole(param: unknown, inCb: ReadCallback | null, outCb: ReadCallback): { refCount: number };
  var cheerpOSInitFds: (fds: unknown[]) => void;
}

export interface JavaIO {
  onOutput(text: string): void;
  onExit(code: number): void;
}

export interface JavaProcess {
  sendLine(line: string): void;
  stop(): void;
}

class Session {
  private pending: number[] = [];
  private waiter: { buf: Uint8Array; off: number; len: number; cb: (n: number) => void } | null = null;
  private decoder = new TextDecoder("utf-8");
  private io: JavaIO;
  ended = false;

  constructor(io: JavaIO) {
    this.io = io;
  }

  // A read blocks until a line is available; after stop() it returns EOF,
  // which makes Scanner throw and the program end.
  read: ReadCallback = (_p, _o, buf, off, len, cb) => {
    this.waiter = { buf, off, len, cb };
    this.deliver();
  };

  // Multi-byte characters can be split across writes, hence stream: true.
  write: ReadCallback = (_p, _o, buf, off, len, cb) => {
    if (!this.ended) {
      this.io.onOutput(this.decoder.decode(buf.subarray(off, off + len), { stream: true }));
    }
    cb(len);
  };

  sendLine(line: string) {
    this.pending.push(...new TextEncoder().encode(line + "\n"));
    this.deliver();
  }

  end() {
    this.ended = true;
    this.deliver();
  }

  private deliver() {
    const w = this.waiter;
    if (!w) return;
    if (this.ended) {
      this.waiter = null;
      w.cb(0);
      return;
    }
    if (this.pending.length === 0) return;
    this.waiter = null;
    const n = Math.min(w.len, this.pending.length);
    for (let i = 0; i < n; i++) w.buf[w.off + i] = this.pending.shift()!;
    w.cb(n);
  }
}

let starting: Session | null = null;
let runtime: Promise<void> | null = null;

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const el = document.createElement("script");
    el.src = src;
    el.onload = () => resolve();
    el.onerror = () => reject(new Error("CheerpJ konnte nicht geladen werden."));
    document.head.appendChild(el);
  });
}

// Loads and initialises the runtime once; call early to hide the startup time.
export function warmUp(): Promise<void> {
  runtime ??= (async () => {
    await loadScript(LOADER_URL);
    await cheerpjInit({ version: 17, status: "none" });
    const dead = new Session({ onOutput() {}, onExit() {} });
    dead.end();
    globalThis.cheerpOSInitFds = (fds) => {
      // Whoever starts a process sets `starting` first; anything else
      // (e.g. library mode) gets a console that discards output.
      const session = starting ?? dead;
      starting = null;
      const fd = cheerpjCreateConsole(session, session.read, session.write);
      const entry = { fileData: fd, offset: 0, flags: 0 };
      fds[0] = entry;
      fds[1] = entry;
      fds[2] = entry;
      fd.refCount += 3;
    };
  })();
  runtime.catch(() => (runtime = null));
  return runtime;
}

// Writes text files into the virtual /files/ mount (java.io reads them like
// normal relative-path files, since the working directory is /files/).
export async function writeFiles(files: Record<string, string>) {
  await warmUp();
  const lib = await cheerpjRunLibrary("");
  const File = await lib.java.io.File;
  const FileWriter = await lib.java.io.FileWriter;
  for (const [path, text] of Object.entries(files)) {
    const dir = path.slice(0, path.lastIndexOf("/"));
    await (await new File("/files/" + dir)).mkdirs();
    const writer = await new FileWriter("/files/" + path);
    await writer.write(text);
    await writer.close();
  }
}

export async function runJava(project: string, io: JavaIO): Promise<JavaProcess> {
  await warmUp();
  const session = new Session(io);
  starting = session;
  cheerpjRunMain("Launcher", JAR, project)
    .then((code) => io.onExit(code))
    .catch(() => io.onExit(1));
  return {
    sendLine: (line) => session.sendLine(line),
    stop: () => session.end(),
  };
}
