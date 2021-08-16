AudioWorkletGlobalScope.WAM = AudioWorkletGlobalScope.WAM || {}; AudioWorkletGlobalScope.WAM.TemplateProject = { ENVIRONMENT: 'WEB' };


// The Module object: Our interface to the outside world. We import
// and export values on it. There are various ways Module can be used:
// 1. Not defined. We create it here
// 2. A function parameter, function(Module) { ..generated code.. }
// 3. pre-run appended it, var Module = {}; ..generated code..
// 4. External script tag defines var Module.
// We need to check if Module already exists (e.g. case 3 above).
// Substitution will be replaced with actual code on later stage of the build,
// this way Closure Compiler will not mangle it (e.g. case 4. above).
// Note that if you want to run closure, and also to use Module
// after the generated code, you will need to define   var Module = {};
// before the code. Then that object will be used in the code, and you
// can continue to use Module afterwards as well.
var Module = typeof AudioWorkletGlobalScope.WAM.TemplateProject !== 'undefined' ? AudioWorkletGlobalScope.WAM.TemplateProject : {};

// --pre-jses are emitted after the Module integration code, so that they can
// refer to Module (if they choose; they can also define Module)
// {{PRE_JSES}}

// Sometimes an existing Module object exists with properties
// meant to overwrite the default module functionality. Here
// we collect those properties and reapply _after_ we configure
// the current environment's defaults to avoid having to be so
// defensive during initialization.
var moduleOverrides = {};
var key;
for (key in Module) {
  if (Module.hasOwnProperty(key)) {
    moduleOverrides[key] = Module[key];
  }
}

var arguments_ = [];
var thisProgram = './this.program';
var quit_ = function(status, toThrow) {
  throw toThrow;
};

// Determine the runtime environment we are in. You can customize this by
// setting the ENVIRONMENT setting at compile time (see settings.js).

var ENVIRONMENT_IS_WEB = false;
var ENVIRONMENT_IS_WORKER = false;
var ENVIRONMENT_IS_NODE = false;
var ENVIRONMENT_IS_SHELL = false;
ENVIRONMENT_IS_WEB = typeof window === 'object';
ENVIRONMENT_IS_WORKER = typeof importScripts === 'function';
// N.b. Electron.js environment is simultaneously a NODE-environment, but
// also a web environment.
ENVIRONMENT_IS_NODE = typeof process === 'object' && typeof process.versions === 'object' && typeof process.versions.node === 'string';
ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;

// `/` should be present at the end if `scriptDirectory` is not empty
var scriptDirectory = '';
function locateFile(path) {
  if (Module['locateFile']) {
    return Module['locateFile'](path, scriptDirectory);
  }
  return scriptDirectory + path;
}

// Hooks that are implemented differently in different runtime environments.
var read_,
    readAsync,
    readBinary,
    setWindowTitle;

var nodeFS;
var nodePath;

if (ENVIRONMENT_IS_NODE) {
  if (ENVIRONMENT_IS_WORKER) {
    scriptDirectory = require('path').dirname(scriptDirectory) + '/';
  } else {
    scriptDirectory = __dirname + '/';
  }

// include: node_shell_read.js


read_ = function shell_read(filename, binary) {
  var ret = tryParseAsDataURI(filename);
  if (ret) {
    return binary ? ret : ret.toString();
  }
  if (!nodeFS) nodeFS = require('fs');
  if (!nodePath) nodePath = require('path');
  filename = nodePath['normalize'](filename);
  return nodeFS['readFileSync'](filename, binary ? null : 'utf8');
};

readBinary = function readBinary(filename) {
  var ret = read_(filename, true);
  if (!ret.buffer) {
    ret = new Uint8Array(ret);
  }
  assert(ret.buffer);
  return ret;
};

// end include: node_shell_read.js
  if (process['argv'].length > 1) {
    thisProgram = process['argv'][1].replace(/\\/g, '/');
  }

  arguments_ = process['argv'].slice(2);

  if (typeof module !== 'undefined') {
    module['exports'] = Module;
  }

  process['on']('uncaughtException', function(ex) {
    // suppress ExitStatus exceptions from showing an error
    if (!(ex instanceof ExitStatus)) {
      throw ex;
    }
  });

  process['on']('unhandledRejection', abort);

  quit_ = function(status) {
    process['exit'](status);
  };

  Module['inspect'] = function () { return '[Emscripten Module object]'; };

} else
if (ENVIRONMENT_IS_SHELL) {

  if (typeof read != 'undefined') {
    read_ = function shell_read(f) {
      var data = tryParseAsDataURI(f);
      if (data) {
        return intArrayToString(data);
      }
      return read(f);
    };
  }

  readBinary = function readBinary(f) {
    var data;
    data = tryParseAsDataURI(f);
    if (data) {
      return data;
    }
    if (typeof readbuffer === 'function') {
      return new Uint8Array(readbuffer(f));
    }
    data = read(f, 'binary');
    assert(typeof data === 'object');
    return data;
  };

  if (typeof scriptArgs != 'undefined') {
    arguments_ = scriptArgs;
  } else if (typeof arguments != 'undefined') {
    arguments_ = arguments;
  }

  if (typeof quit === 'function') {
    quit_ = function(status) {
      quit(status);
    };
  }

  if (typeof print !== 'undefined') {
    // Prefer to use print/printErr where they exist, as they usually work better.
    if (typeof console === 'undefined') console = /** @type{!Console} */({});
    console.log = /** @type{!function(this:Console, ...*): undefined} */ (print);
    console.warn = console.error = /** @type{!function(this:Console, ...*): undefined} */ (typeof printErr !== 'undefined' ? printErr : print);
  }

} else

// Note that this includes Node.js workers when relevant (pthreads is enabled).
// Node.js workers are detected as a combination of ENVIRONMENT_IS_WORKER and
// ENVIRONMENT_IS_NODE.
if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  if (ENVIRONMENT_IS_WORKER) { // Check worker, not web, since window could be polyfilled
    scriptDirectory = self.location.href;
  } else if (typeof document !== 'undefined' && document.currentScript) { // web
    scriptDirectory = document.currentScript.src;
  }
  // blob urls look like blob:http://site.com/etc/etc and we cannot infer anything from them.
  // otherwise, slice off the final part of the url to find the script directory.
  // if scriptDirectory does not contain a slash, lastIndexOf will return -1,
  // and scriptDirectory will correctly be replaced with an empty string.
  if (scriptDirectory.indexOf('blob:') !== 0) {
    scriptDirectory = scriptDirectory.substr(0, scriptDirectory.lastIndexOf('/')+1);
  } else {
    scriptDirectory = '';
  }

  // Differentiate the Web Worker from the Node Worker case, as reading must
  // be done differently.
  {

// include: web_or_worker_shell_read.js


  read_ = function(url) {
    try {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', url, false);
      xhr.send(null);
      return xhr.responseText;
    } catch (err) {
      var data = tryParseAsDataURI(url);
      if (data) {
        return intArrayToString(data);
      }
      throw err;
    }
  };

  if (ENVIRONMENT_IS_WORKER) {
    readBinary = function(url) {
      try {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, false);
        xhr.responseType = 'arraybuffer';
        xhr.send(null);
        return new Uint8Array(/** @type{!ArrayBuffer} */(xhr.response));
      } catch (err) {
        var data = tryParseAsDataURI(url);
        if (data) {
          return data;
        }
        throw err;
      }
    };
  }

  readAsync = function(url, onload, onerror) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'arraybuffer';
    xhr.onload = function() {
      if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) { // file URLs can return 0
        onload(xhr.response);
        return;
      }
      var data = tryParseAsDataURI(url);
      if (data) {
        onload(data.buffer);
        return;
      }
      onerror();
    };
    xhr.onerror = onerror;
    xhr.send(null);
  };

// end include: web_or_worker_shell_read.js
  }

  setWindowTitle = function(title) { document.title = title };
} else
{
}

// Set up the out() and err() hooks, which are how we can print to stdout or
// stderr, respectively.
var out = Module['print'] || console.log.bind(console);
var err = Module['printErr'] || console.warn.bind(console);

// Merge back in the overrides
for (key in moduleOverrides) {
  if (moduleOverrides.hasOwnProperty(key)) {
    Module[key] = moduleOverrides[key];
  }
}
// Free the object hierarchy contained in the overrides, this lets the GC
// reclaim data used e.g. in memoryInitializerRequest, which is a large typed array.
moduleOverrides = null;

// Emit code to handle expected values on the Module object. This applies Module.x
// to the proper local x. This has two benefits: first, we only emit it if it is
// expected to arrive, and second, by using a local everywhere else that can be
// minified.

if (Module['arguments']) arguments_ = Module['arguments'];

if (Module['thisProgram']) thisProgram = Module['thisProgram'];

if (Module['quit']) quit_ = Module['quit'];

// perform assertions in shell.js after we set up out() and err(), as otherwise if an assertion fails it cannot print the message




var STACK_ALIGN = 16;

function alignMemory(size, factor) {
  if (!factor) factor = STACK_ALIGN; // stack alignment (16-byte) by default
  return Math.ceil(size / factor) * factor;
}

function getNativeTypeSize(type) {
  switch (type) {
    case 'i1': case 'i8': return 1;
    case 'i16': return 2;
    case 'i32': return 4;
    case 'i64': return 8;
    case 'float': return 4;
    case 'double': return 8;
    default: {
      if (type[type.length-1] === '*') {
        return 4; // A pointer
      } else if (type[0] === 'i') {
        var bits = Number(type.substr(1));
        assert(bits % 8 === 0, 'getNativeTypeSize invalid bits ' + bits + ', type ' + type);
        return bits / 8;
      } else {
        return 0;
      }
    }
  }
}

function warnOnce(text) {
  if (!warnOnce.shown) warnOnce.shown = {};
  if (!warnOnce.shown[text]) {
    warnOnce.shown[text] = 1;
    err(text);
  }
}

// include: runtime_functions.js


// Wraps a JS function as a wasm function with a given signature.
function convertJsFunctionToWasm(func, sig) {

  // If the type reflection proposal is available, use the new
  // "WebAssembly.Function" constructor.
  // Otherwise, construct a minimal wasm module importing the JS function and
  // re-exporting it.
  if (typeof WebAssembly.Function === "function") {
    var typeNames = {
      'i': 'i32',
      'j': 'i64',
      'f': 'f32',
      'd': 'f64'
    };
    var type = {
      parameters: [],
      results: sig[0] == 'v' ? [] : [typeNames[sig[0]]]
    };
    for (var i = 1; i < sig.length; ++i) {
      type.parameters.push(typeNames[sig[i]]);
    }
    return new WebAssembly.Function(type, func);
  }

  // The module is static, with the exception of the type section, which is
  // generated based on the signature passed in.
  var typeSection = [
    0x01, // id: section,
    0x00, // length: 0 (placeholder)
    0x01, // count: 1
    0x60, // form: func
  ];
  var sigRet = sig.slice(0, 1);
  var sigParam = sig.slice(1);
  var typeCodes = {
    'i': 0x7f, // i32
    'j': 0x7e, // i64
    'f': 0x7d, // f32
    'd': 0x7c, // f64
  };

  // Parameters, length + signatures
  typeSection.push(sigParam.length);
  for (var i = 0; i < sigParam.length; ++i) {
    typeSection.push(typeCodes[sigParam[i]]);
  }

  // Return values, length + signatures
  // With no multi-return in MVP, either 0 (void) or 1 (anything else)
  if (sigRet == 'v') {
    typeSection.push(0x00);
  } else {
    typeSection = typeSection.concat([0x01, typeCodes[sigRet]]);
  }

  // Write the overall length of the type section back into the section header
  // (excepting the 2 bytes for the section id and length)
  typeSection[1] = typeSection.length - 2;

  // Rest of the module is static
  var bytes = new Uint8Array([
    0x00, 0x61, 0x73, 0x6d, // magic ("\0asm")
    0x01, 0x00, 0x00, 0x00, // version: 1
  ].concat(typeSection, [
    0x02, 0x07, // import section
      // (import "e" "f" (func 0 (type 0)))
      0x01, 0x01, 0x65, 0x01, 0x66, 0x00, 0x00,
    0x07, 0x05, // export section
      // (export "f" (func 0 (type 0)))
      0x01, 0x01, 0x66, 0x00, 0x00,
  ]));

   // We can compile this wasm module synchronously because it is very small.
  // This accepts an import (at "e.f"), that it reroutes to an export (at "f")
  var module = new WebAssembly.Module(bytes);
  var instance = new WebAssembly.Instance(module, {
    'e': {
      'f': func
    }
  });
  var wrappedFunc = instance.exports['f'];
  return wrappedFunc;
}

var freeTableIndexes = [];

// Weak map of functions in the table to their indexes, created on first use.
var functionsInTableMap;

function getEmptyTableSlot() {
  // Reuse a free index if there is one, otherwise grow.
  if (freeTableIndexes.length) {
    return freeTableIndexes.pop();
  }
  // Grow the table
  try {
    wasmTable.grow(1);
  } catch (err) {
    if (!(err instanceof RangeError)) {
      throw err;
    }
    throw 'Unable to grow wasm table. Set ALLOW_TABLE_GROWTH.';
  }
  return wasmTable.length - 1;
}

// Add a wasm function to the table.
function addFunctionWasm(func, sig) {
  // Check if the function is already in the table, to ensure each function
  // gets a unique index. First, create the map if this is the first use.
  if (!functionsInTableMap) {
    functionsInTableMap = new WeakMap();
    for (var i = 0; i < wasmTable.length; i++) {
      var item = wasmTable.get(i);
      // Ignore null values.
      if (item) {
        functionsInTableMap.set(item, i);
      }
    }
  }
  if (functionsInTableMap.has(func)) {
    return functionsInTableMap.get(func);
  }

  // It's not in the table, add it now.

  var ret = getEmptyTableSlot();

  // Set the new value.
  try {
    // Attempting to call this with JS function will cause of table.set() to fail
    wasmTable.set(ret, func);
  } catch (err) {
    if (!(err instanceof TypeError)) {
      throw err;
    }
    var wrapped = convertJsFunctionToWasm(func, sig);
    wasmTable.set(ret, wrapped);
  }

  functionsInTableMap.set(func, ret);

  return ret;
}

function removeFunction(index) {
  functionsInTableMap.delete(wasmTable.get(index));
  freeTableIndexes.push(index);
}

// 'sig' parameter is required for the llvm backend but only when func is not
// already a WebAssembly function.
function addFunction(func, sig) {

  return addFunctionWasm(func, sig);
}

// end include: runtime_functions.js
// include: runtime_debug.js


// end include: runtime_debug.js
function makeBigInt(low, high, unsigned) {
  return unsigned ? ((+((low>>>0)))+((+((high>>>0)))*4294967296.0)) : ((+((low>>>0)))+((+((high|0)))*4294967296.0));
}

var tempRet0 = 0;

var setTempRet0 = function(value) {
  tempRet0 = value;
};

var getTempRet0 = function() {
  return tempRet0;
};



// === Preamble library stuff ===

// Documentation for the public APIs defined in this file must be updated in:
//    site/source/docs/api_reference/preamble.js.rst
// A prebuilt local version of the documentation is available at:
//    site/build/text/docs/api_reference/preamble.js.txt
// You can also build docs locally as HTML or other formats in site/
// An online HTML version (which may be of a different version of Emscripten)
//    is up at http://kripken.github.io/emscripten-site/docs/api_reference/preamble.js.html

var wasmBinary;
if (Module['wasmBinary']) wasmBinary = Module['wasmBinary'];
var noExitRuntime = Module['noExitRuntime'] || true;

if (typeof WebAssembly !== 'object') {
  abort('no native wasm support detected');
}

// include: runtime_safe_heap.js


// In MINIMAL_RUNTIME, setValue() and getValue() are only available when building with safe heap enabled, for heap safety checking.
// In traditional runtime, setValue() and getValue() are always available (although their use is highly discouraged due to perf penalties)

/** @param {number} ptr
    @param {number} value
    @param {string} type
    @param {number|boolean=} noSafe */
function setValue(ptr, value, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch (type) {
      case 'i1': HEAP8[((ptr)>>0)] = value; break;
      case 'i8': HEAP8[((ptr)>>0)] = value; break;
      case 'i16': HEAP16[((ptr)>>1)] = value; break;
      case 'i32': HEAP32[((ptr)>>2)] = value; break;
      case 'i64': (tempI64 = [value>>>0,(tempDouble=value,(+(Math.abs(tempDouble))) >= 1.0 ? (tempDouble > 0.0 ? ((Math.min((+(Math.floor((tempDouble)/4294967296.0))), 4294967295.0))|0)>>>0 : (~~((+(Math.ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296.0)))))>>>0) : 0)],HEAP32[((ptr)>>2)] = tempI64[0],HEAP32[(((ptr)+(4))>>2)] = tempI64[1]); break;
      case 'float': HEAPF32[((ptr)>>2)] = value; break;
      case 'double': HEAPF64[((ptr)>>3)] = value; break;
      default: abort('invalid type for setValue: ' + type);
    }
}

/** @param {number} ptr
    @param {string} type
    @param {number|boolean=} noSafe */
function getValue(ptr, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch (type) {
      case 'i1': return HEAP8[((ptr)>>0)];
      case 'i8': return HEAP8[((ptr)>>0)];
      case 'i16': return HEAP16[((ptr)>>1)];
      case 'i32': return HEAP32[((ptr)>>2)];
      case 'i64': return HEAP32[((ptr)>>2)];
      case 'float': return HEAPF32[((ptr)>>2)];
      case 'double': return HEAPF64[((ptr)>>3)];
      default: abort('invalid type for getValue: ' + type);
    }
  return null;
}

// end include: runtime_safe_heap.js
// Wasm globals

var wasmMemory;

//========================================
// Runtime essentials
//========================================

// whether we are quitting the application. no code should run after this.
// set in exit() and abort()
var ABORT = false;

// set by exit() and abort().  Passed to 'onExit' handler.
// NOTE: This is also used as the process return code code in shell environments
// but only when noExitRuntime is false.
var EXITSTATUS;

/** @type {function(*, string=)} */
function assert(condition, text) {
  if (!condition) {
    abort('Assertion failed: ' + text);
  }
}

// Returns the C function with a specified identifier (for C++, you need to do manual name mangling)
function getCFunc(ident) {
  var func = Module['_' + ident]; // closure exported function
  assert(func, 'Cannot call unknown function ' + ident + ', make sure it is exported');
  return func;
}

// C calling interface.
/** @param {string|null=} returnType
    @param {Array=} argTypes
    @param {Arguments|Array=} args
    @param {Object=} opts */
function ccall(ident, returnType, argTypes, args, opts) {
  // For fast lookup of conversion functions
  var toC = {
    'string': function(str) {
      var ret = 0;
      if (str !== null && str !== undefined && str !== 0) { // null string
        // at most 4 bytes per UTF-8 code point, +1 for the trailing '\0'
        var len = (str.length << 2) + 1;
        ret = stackAlloc(len);
        stringToUTF8(str, ret, len);
      }
      return ret;
    },
    'array': function(arr) {
      var ret = stackAlloc(arr.length);
      writeArrayToMemory(arr, ret);
      return ret;
    }
  };

  function convertReturnValue(ret) {
    if (returnType === 'string') return UTF8ToString(ret);
    if (returnType === 'boolean') return Boolean(ret);
    return ret;
  }

  var func = getCFunc(ident);
  var cArgs = [];
  var stack = 0;
  if (args) {
    for (var i = 0; i < args.length; i++) {
      var converter = toC[argTypes[i]];
      if (converter) {
        if (stack === 0) stack = stackSave();
        cArgs[i] = converter(args[i]);
      } else {
        cArgs[i] = args[i];
      }
    }
  }
  var ret = func.apply(null, cArgs);

  ret = convertReturnValue(ret);
  if (stack !== 0) stackRestore(stack);
  return ret;
}

/** @param {string=} returnType
    @param {Array=} argTypes
    @param {Object=} opts */
function cwrap(ident, returnType, argTypes, opts) {
  argTypes = argTypes || [];
  // When the function takes numbers and returns a number, we can just return
  // the original function
  var numericArgs = argTypes.every(function(type){ return type === 'number'});
  var numericRet = returnType !== 'string';
  if (numericRet && numericArgs && !opts) {
    return getCFunc(ident);
  }
  return function() {
    return ccall(ident, returnType, argTypes, arguments, opts);
  }
}

var ALLOC_NORMAL = 0; // Tries to use _malloc()
var ALLOC_STACK = 1; // Lives for the duration of the current function call

// allocate(): This is for internal use. You can use it yourself as well, but the interface
//             is a little tricky (see docs right below). The reason is that it is optimized
//             for multiple syntaxes to save space in generated code. So you should
//             normally not use allocate(), and instead allocate memory using _malloc(),
//             initialize it with setValue(), and so forth.
// @slab: An array of data.
// @allocator: How to allocate memory, see ALLOC_*
/** @type {function((Uint8Array|Array<number>), number)} */
function allocate(slab, allocator) {
  var ret;

  if (allocator == ALLOC_STACK) {
    ret = stackAlloc(slab.length);
  } else {
    ret = _malloc(slab.length);
  }

  if (slab.subarray || slab.slice) {
    HEAPU8.set(/** @type {!Uint8Array} */(slab), ret);
  } else {
    HEAPU8.set(new Uint8Array(slab), ret);
  }
  return ret;
}

// include: runtime_strings.js


// runtime_strings.js: Strings related runtime functions that are part of both MINIMAL_RUNTIME and regular runtime.

// Given a pointer 'ptr' to a null-terminated UTF8-encoded string in the given array that contains uint8 values, returns
// a copy of that string as a Javascript String object.

var UTF8Decoder = typeof TextDecoder !== 'undefined' ? new TextDecoder('utf8') : undefined;

/**
 * @param {number} idx
 * @param {number=} maxBytesToRead
 * @return {string}
 */
function UTF8ArrayToString(heap, idx, maxBytesToRead) {
  var endIdx = idx + maxBytesToRead;
  var endPtr = idx;
  // TextDecoder needs to know the byte length in advance, it doesn't stop on null terminator by itself.
  // Also, use the length info to avoid running tiny strings through TextDecoder, since .subarray() allocates garbage.
  // (As a tiny code save trick, compare endPtr against endIdx using a negation, so that undefined means Infinity)
  while (heap[endPtr] && !(endPtr >= endIdx)) ++endPtr;

  if (endPtr - idx > 16 && heap.subarray && UTF8Decoder) {
    return UTF8Decoder.decode(heap.subarray(idx, endPtr));
  } else {
    var str = '';
    // If building with TextDecoder, we have already computed the string length above, so test loop end condition against that
    while (idx < endPtr) {
      // For UTF8 byte structure, see:
      // http://en.wikipedia.org/wiki/UTF-8#Description
      // https://www.ietf.org/rfc/rfc2279.txt
      // https://tools.ietf.org/html/rfc3629
      var u0 = heap[idx++];
      if (!(u0 & 0x80)) { str += String.fromCharCode(u0); continue; }
      var u1 = heap[idx++] & 63;
      if ((u0 & 0xE0) == 0xC0) { str += String.fromCharCode(((u0 & 31) << 6) | u1); continue; }
      var u2 = heap[idx++] & 63;
      if ((u0 & 0xF0) == 0xE0) {
        u0 = ((u0 & 15) << 12) | (u1 << 6) | u2;
      } else {
        u0 = ((u0 & 7) << 18) | (u1 << 12) | (u2 << 6) | (heap[idx++] & 63);
      }

      if (u0 < 0x10000) {
        str += String.fromCharCode(u0);
      } else {
        var ch = u0 - 0x10000;
        str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
      }
    }
  }
  return str;
}

// Given a pointer 'ptr' to a null-terminated UTF8-encoded string in the emscripten HEAP, returns a
// copy of that string as a Javascript String object.
// maxBytesToRead: an optional length that specifies the maximum number of bytes to read. You can omit
//                 this parameter to scan the string until the first \0 byte. If maxBytesToRead is
//                 passed, and the string at [ptr, ptr+maxBytesToReadr[ contains a null byte in the
//                 middle, then the string will cut short at that byte index (i.e. maxBytesToRead will
//                 not produce a string of exact length [ptr, ptr+maxBytesToRead[)
//                 N.B. mixing frequent uses of UTF8ToString() with and without maxBytesToRead may
//                 throw JS JIT optimizations off, so it is worth to consider consistently using one
//                 style or the other.
/**
 * @param {number} ptr
 * @param {number=} maxBytesToRead
 * @return {string}
 */
function UTF8ToString(ptr, maxBytesToRead) {
  return ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead) : '';
}

// Copies the given Javascript String object 'str' to the given byte array at address 'outIdx',
// encoded in UTF8 form and null-terminated. The copy will require at most str.length*4+1 bytes of space in the HEAP.
// Use the function lengthBytesUTF8 to compute the exact number of bytes (excluding null terminator) that this function will write.
// Parameters:
//   str: the Javascript string to copy.
//   heap: the array to copy to. Each index in this array is assumed to be one 8-byte element.
//   outIdx: The starting offset in the array to begin the copying.
//   maxBytesToWrite: The maximum number of bytes this function can write to the array.
//                    This count should include the null terminator,
//                    i.e. if maxBytesToWrite=1, only the null terminator will be written and nothing else.
//                    maxBytesToWrite=0 does not write any bytes to the output, not even the null terminator.
// Returns the number of bytes written, EXCLUDING the null terminator.

function stringToUTF8Array(str, heap, outIdx, maxBytesToWrite) {
  if (!(maxBytesToWrite > 0)) // Parameter maxBytesToWrite is not optional. Negative values, 0, null, undefined and false each don't write out any bytes.
    return 0;

  var startIdx = outIdx;
  var endIdx = outIdx + maxBytesToWrite - 1; // -1 for string null terminator.
  for (var i = 0; i < str.length; ++i) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! So decode UTF16->UTF32->UTF8.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    // For UTF8 byte structure, see http://en.wikipedia.org/wiki/UTF-8#Description and https://www.ietf.org/rfc/rfc2279.txt and https://tools.ietf.org/html/rfc3629
    var u = str.charCodeAt(i); // possibly a lead surrogate
    if (u >= 0xD800 && u <= 0xDFFF) {
      var u1 = str.charCodeAt(++i);
      u = 0x10000 + ((u & 0x3FF) << 10) | (u1 & 0x3FF);
    }
    if (u <= 0x7F) {
      if (outIdx >= endIdx) break;
      heap[outIdx++] = u;
    } else if (u <= 0x7FF) {
      if (outIdx + 1 >= endIdx) break;
      heap[outIdx++] = 0xC0 | (u >> 6);
      heap[outIdx++] = 0x80 | (u & 63);
    } else if (u <= 0xFFFF) {
      if (outIdx + 2 >= endIdx) break;
      heap[outIdx++] = 0xE0 | (u >> 12);
      heap[outIdx++] = 0x80 | ((u >> 6) & 63);
      heap[outIdx++] = 0x80 | (u & 63);
    } else {
      if (outIdx + 3 >= endIdx) break;
      heap[outIdx++] = 0xF0 | (u >> 18);
      heap[outIdx++] = 0x80 | ((u >> 12) & 63);
      heap[outIdx++] = 0x80 | ((u >> 6) & 63);
      heap[outIdx++] = 0x80 | (u & 63);
    }
  }
  // Null-terminate the pointer to the buffer.
  heap[outIdx] = 0;
  return outIdx - startIdx;
}

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF8 form. The copy will require at most str.length*4+1 bytes of space in the HEAP.
// Use the function lengthBytesUTF8 to compute the exact number of bytes (excluding null terminator) that this function will write.
// Returns the number of bytes written, EXCLUDING the null terminator.

function stringToUTF8(str, outPtr, maxBytesToWrite) {
  return stringToUTF8Array(str, HEAPU8,outPtr, maxBytesToWrite);
}

// Returns the number of bytes the given Javascript string takes if encoded as a UTF8 byte array, EXCLUDING the null terminator byte.
function lengthBytesUTF8(str) {
  var len = 0;
  for (var i = 0; i < str.length; ++i) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! So decode UTF16->UTF32->UTF8.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    var u = str.charCodeAt(i); // possibly a lead surrogate
    if (u >= 0xD800 && u <= 0xDFFF) u = 0x10000 + ((u & 0x3FF) << 10) | (str.charCodeAt(++i) & 0x3FF);
    if (u <= 0x7F) ++len;
    else if (u <= 0x7FF) len += 2;
    else if (u <= 0xFFFF) len += 3;
    else len += 4;
  }
  return len;
}

// end include: runtime_strings.js
// include: runtime_strings_extra.js


// runtime_strings_extra.js: Strings related runtime functions that are available only in regular runtime.

// Given a pointer 'ptr' to a null-terminated ASCII-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.

function AsciiToString(ptr) {
  var str = '';
  while (1) {
    var ch = HEAPU8[((ptr++)>>0)];
    if (!ch) return str;
    str += String.fromCharCode(ch);
  }
}

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in ASCII form. The copy will require at most str.length+1 bytes of space in the HEAP.

function stringToAscii(str, outPtr) {
  return writeAsciiToMemory(str, outPtr, false);
}

// Given a pointer 'ptr' to a null-terminated UTF16LE-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.

var UTF16Decoder = typeof TextDecoder !== 'undefined' ? new TextDecoder('utf-16le') : undefined;

function UTF16ToString(ptr, maxBytesToRead) {
  var endPtr = ptr;
  // TextDecoder needs to know the byte length in advance, it doesn't stop on null terminator by itself.
  // Also, use the length info to avoid running tiny strings through TextDecoder, since .subarray() allocates garbage.
  var idx = endPtr >> 1;
  var maxIdx = idx + maxBytesToRead / 2;
  // If maxBytesToRead is not passed explicitly, it will be undefined, and this
  // will always evaluate to true. This saves on code size.
  while (!(idx >= maxIdx) && HEAPU16[idx]) ++idx;
  endPtr = idx << 1;

  if (endPtr - ptr > 32 && UTF16Decoder) {
    return UTF16Decoder.decode(HEAPU8.subarray(ptr, endPtr));
  } else {
    var str = '';

    // If maxBytesToRead is not passed explicitly, it will be undefined, and the for-loop's condition
    // will always evaluate to true. The loop is then terminated on the first null char.
    for (var i = 0; !(i >= maxBytesToRead / 2); ++i) {
      var codeUnit = HEAP16[(((ptr)+(i*2))>>1)];
      if (codeUnit == 0) break;
      // fromCharCode constructs a character from a UTF-16 code unit, so we can pass the UTF16 string right through.
      str += String.fromCharCode(codeUnit);
    }

    return str;
  }
}

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF16 form. The copy will require at most str.length*4+2 bytes of space in the HEAP.
// Use the function lengthBytesUTF16() to compute the exact number of bytes (excluding null terminator) that this function will write.
// Parameters:
//   str: the Javascript string to copy.
//   outPtr: Byte address in Emscripten HEAP where to write the string to.
//   maxBytesToWrite: The maximum number of bytes this function can write to the array. This count should include the null
//                    terminator, i.e. if maxBytesToWrite=2, only the null terminator will be written and nothing else.
//                    maxBytesToWrite<2 does not write any bytes to the output, not even the null terminator.
// Returns the number of bytes written, EXCLUDING the null terminator.

function stringToUTF16(str, outPtr, maxBytesToWrite) {
  // Backwards compatibility: if max bytes is not specified, assume unsafe unbounded write is allowed.
  if (maxBytesToWrite === undefined) {
    maxBytesToWrite = 0x7FFFFFFF;
  }
  if (maxBytesToWrite < 2) return 0;
  maxBytesToWrite -= 2; // Null terminator.
  var startPtr = outPtr;
  var numCharsToWrite = (maxBytesToWrite < str.length*2) ? (maxBytesToWrite / 2) : str.length;
  for (var i = 0; i < numCharsToWrite; ++i) {
    // charCodeAt returns a UTF-16 encoded code unit, so it can be directly written to the HEAP.
    var codeUnit = str.charCodeAt(i); // possibly a lead surrogate
    HEAP16[((outPtr)>>1)] = codeUnit;
    outPtr += 2;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP16[((outPtr)>>1)] = 0;
  return outPtr - startPtr;
}

// Returns the number of bytes the given Javascript string takes if encoded as a UTF16 byte array, EXCLUDING the null terminator byte.

function lengthBytesUTF16(str) {
  return str.length*2;
}

function UTF32ToString(ptr, maxBytesToRead) {
  var i = 0;

  var str = '';
  // If maxBytesToRead is not passed explicitly, it will be undefined, and this
  // will always evaluate to true. This saves on code size.
  while (!(i >= maxBytesToRead / 4)) {
    var utf32 = HEAP32[(((ptr)+(i*4))>>2)];
    if (utf32 == 0) break;
    ++i;
    // Gotcha: fromCharCode constructs a character from a UTF-16 encoded code (pair), not from a Unicode code point! So encode the code point to UTF-16 for constructing.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    if (utf32 >= 0x10000) {
      var ch = utf32 - 0x10000;
      str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
    } else {
      str += String.fromCharCode(utf32);
    }
  }
  return str;
}

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF32 form. The copy will require at most str.length*4+4 bytes of space in the HEAP.
// Use the function lengthBytesUTF32() to compute the exact number of bytes (excluding null terminator) that this function will write.
// Parameters:
//   str: the Javascript string to copy.
//   outPtr: Byte address in Emscripten HEAP where to write the string to.
//   maxBytesToWrite: The maximum number of bytes this function can write to the array. This count should include the null
//                    terminator, i.e. if maxBytesToWrite=4, only the null terminator will be written and nothing else.
//                    maxBytesToWrite<4 does not write any bytes to the output, not even the null terminator.
// Returns the number of bytes written, EXCLUDING the null terminator.

function stringToUTF32(str, outPtr, maxBytesToWrite) {
  // Backwards compatibility: if max bytes is not specified, assume unsafe unbounded write is allowed.
  if (maxBytesToWrite === undefined) {
    maxBytesToWrite = 0x7FFFFFFF;
  }
  if (maxBytesToWrite < 4) return 0;
  var startPtr = outPtr;
  var endPtr = startPtr + maxBytesToWrite - 4;
  for (var i = 0; i < str.length; ++i) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! We must decode the string to UTF-32 to the heap.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    var codeUnit = str.charCodeAt(i); // possibly a lead surrogate
    if (codeUnit >= 0xD800 && codeUnit <= 0xDFFF) {
      var trailSurrogate = str.charCodeAt(++i);
      codeUnit = 0x10000 + ((codeUnit & 0x3FF) << 10) | (trailSurrogate & 0x3FF);
    }
    HEAP32[((outPtr)>>2)] = codeUnit;
    outPtr += 4;
    if (outPtr + 4 > endPtr) break;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP32[((outPtr)>>2)] = 0;
  return outPtr - startPtr;
}

// Returns the number of bytes the given Javascript string takes if encoded as a UTF16 byte array, EXCLUDING the null terminator byte.

function lengthBytesUTF32(str) {
  var len = 0;
  for (var i = 0; i < str.length; ++i) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! We must decode the string to UTF-32 to the heap.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    var codeUnit = str.charCodeAt(i);
    if (codeUnit >= 0xD800 && codeUnit <= 0xDFFF) ++i; // possibly a lead surrogate, so skip over the tail surrogate.
    len += 4;
  }

  return len;
}

// Allocate heap space for a JS string, and write it there.
// It is the responsibility of the caller to free() that memory.
function allocateUTF8(str) {
  var size = lengthBytesUTF8(str) + 1;
  var ret = _malloc(size);
  if (ret) stringToUTF8Array(str, HEAP8, ret, size);
  return ret;
}

// Allocate stack space for a JS string, and write it there.
function allocateUTF8OnStack(str) {
  var size = lengthBytesUTF8(str) + 1;
  var ret = stackAlloc(size);
  stringToUTF8Array(str, HEAP8, ret, size);
  return ret;
}

// Deprecated: This function should not be called because it is unsafe and does not provide
// a maximum length limit of how many bytes it is allowed to write. Prefer calling the
// function stringToUTF8Array() instead, which takes in a maximum length that can be used
// to be secure from out of bounds writes.
/** @deprecated
    @param {boolean=} dontAddNull */
function writeStringToMemory(string, buffer, dontAddNull) {
  warnOnce('writeStringToMemory is deprecated and should not be called! Use stringToUTF8() instead!');

  var /** @type {number} */ lastChar, /** @type {number} */ end;
  if (dontAddNull) {
    // stringToUTF8Array always appends null. If we don't want to do that, remember the
    // character that existed at the location where the null will be placed, and restore
    // that after the write (below).
    end = buffer + lengthBytesUTF8(string);
    lastChar = HEAP8[end];
  }
  stringToUTF8(string, buffer, Infinity);
  if (dontAddNull) HEAP8[end] = lastChar; // Restore the value under the null character.
}

function writeArrayToMemory(array, buffer) {
  HEAP8.set(array, buffer);
}

/** @param {boolean=} dontAddNull */
function writeAsciiToMemory(str, buffer, dontAddNull) {
  for (var i = 0; i < str.length; ++i) {
    HEAP8[((buffer++)>>0)] = str.charCodeAt(i);
  }
  // Null-terminate the pointer to the HEAP.
  if (!dontAddNull) HEAP8[((buffer)>>0)] = 0;
}

// end include: runtime_strings_extra.js
// Memory management

function alignUp(x, multiple) {
  if (x % multiple > 0) {
    x += multiple - (x % multiple);
  }
  return x;
}

var HEAP,
/** @type {ArrayBuffer} */
  buffer,
/** @type {Int8Array} */
  HEAP8,
/** @type {Uint8Array} */
  HEAPU8,
/** @type {Int16Array} */
  HEAP16,
/** @type {Uint16Array} */
  HEAPU16,
/** @type {Int32Array} */
  HEAP32,
/** @type {Uint32Array} */
  HEAPU32,
/** @type {Float32Array} */
  HEAPF32,
/** @type {Float64Array} */
  HEAPF64;

function updateGlobalBufferAndViews(buf) {
  buffer = buf;
  Module['HEAP8'] = HEAP8 = new Int8Array(buf);
  Module['HEAP16'] = HEAP16 = new Int16Array(buf);
  Module['HEAP32'] = HEAP32 = new Int32Array(buf);
  Module['HEAPU8'] = HEAPU8 = new Uint8Array(buf);
  Module['HEAPU16'] = HEAPU16 = new Uint16Array(buf);
  Module['HEAPU32'] = HEAPU32 = new Uint32Array(buf);
  Module['HEAPF32'] = HEAPF32 = new Float32Array(buf);
  Module['HEAPF64'] = HEAPF64 = new Float64Array(buf);
}

var TOTAL_STACK = 5242880;

var INITIAL_MEMORY = Module['INITIAL_MEMORY'] || 16777216;

// include: runtime_init_table.js
// In regular non-RELOCATABLE mode the table is exported
// from the wasm module and this will be assigned once
// the exports are available.
var wasmTable;

// end include: runtime_init_table.js
// include: runtime_stack_check.js


// end include: runtime_stack_check.js
// include: runtime_assertions.js


// end include: runtime_assertions.js
var __ATPRERUN__  = []; // functions called before the runtime is initialized
var __ATINIT__    = []; // functions called during startup
var __ATMAIN__    = []; // functions called when main() is to be run
var __ATEXIT__    = []; // functions called during shutdown
var __ATPOSTRUN__ = []; // functions called after the main() is called

var runtimeInitialized = false;
var runtimeExited = false;

function preRun() {

  if (Module['preRun']) {
    if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
    while (Module['preRun'].length) {
      addOnPreRun(Module['preRun'].shift());
    }
  }

  callRuntimeCallbacks(__ATPRERUN__);
}

function initRuntime() {
  runtimeInitialized = true;

  
  callRuntimeCallbacks(__ATINIT__);
}

function preMain() {
  
  callRuntimeCallbacks(__ATMAIN__);
}

function exitRuntime() {
  runtimeExited = true;
}

function postRun() {

  if (Module['postRun']) {
    if (typeof Module['postRun'] == 'function') Module['postRun'] = [Module['postRun']];
    while (Module['postRun'].length) {
      addOnPostRun(Module['postRun'].shift());
    }
  }

  callRuntimeCallbacks(__ATPOSTRUN__);
}

function addOnPreRun(cb) {
  __ATPRERUN__.unshift(cb);
}

function addOnInit(cb) {
  __ATINIT__.unshift(cb);
}

function addOnPreMain(cb) {
  __ATMAIN__.unshift(cb);
}

function addOnExit(cb) {
}

function addOnPostRun(cb) {
  __ATPOSTRUN__.unshift(cb);
}

// include: runtime_math.js


// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/imul

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/fround

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/clz32

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/trunc

// end include: runtime_math.js
// A counter of dependencies for calling run(). If we need to
// do asynchronous work before running, increment this and
// decrement it. Incrementing must happen in a place like
// Module.preRun (used by emcc to add file preloading).
// Note that you can add dependencies in preRun, even though
// it happens right before run - run will be postponed until
// the dependencies are met.
var runDependencies = 0;
var runDependencyWatcher = null;
var dependenciesFulfilled = null; // overridden to take different actions when all run dependencies are fulfilled

function getUniqueRunDependency(id) {
  return id;
}

function addRunDependency(id) {
  runDependencies++;

  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }

}

function removeRunDependency(id) {
  runDependencies--;

  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }

  if (runDependencies == 0) {
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null;
    }
    if (dependenciesFulfilled) {
      var callback = dependenciesFulfilled;
      dependenciesFulfilled = null;
      callback(); // can add another dependenciesFulfilled
    }
  }
}

Module["preloadedImages"] = {}; // maps url to image data
Module["preloadedAudios"] = {}; // maps url to audio data

/** @param {string|number=} what */
function abort(what) {
  if (Module['onAbort']) {
    Module['onAbort'](what);
  }

  what += '';
  err(what);

  ABORT = true;
  EXITSTATUS = 1;

  what = 'abort(' + what + '). Build with -s ASSERTIONS=1 for more info.';

  // Use a wasm runtime error, because a JS error might be seen as a foreign
  // exception, which means we'd run destructors on it. We need the error to
  // simply make the program stop.
  var e = new WebAssembly.RuntimeError(what);

  // Throw the error whether or not MODULARIZE is set because abort is used
  // in code paths apart from instantiation where an exception is expected
  // to be thrown when abort is called.
  throw e;
}

// {{MEM_INITIALIZER}}

// include: memoryprofiler.js


// end include: memoryprofiler.js
// include: URIUtils.js


function hasPrefix(str, prefix) {
  return String.prototype.startsWith ?
      str.startsWith(prefix) :
      str.indexOf(prefix) === 0;
}

// Prefix of data URIs emitted by SINGLE_FILE and related options.
var dataURIPrefix = 'data:application/octet-stream;base64,';

// Indicates whether filename is a base64 data URI.
function isDataURI(filename) {
  return hasPrefix(filename, dataURIPrefix);
}

var fileURIPrefix = "file://";

// Indicates whether filename is delivered via file protocol (as opposed to http/https)
function isFileURI(filename) {
  return hasPrefix(filename, fileURIPrefix);
}

// end include: URIUtils.js
var wasmBinaryFile = 'data:application/octet-stream;base64,AGFzbQEAAAAB7YKAgAAzYAF/AX9gAAF/YAJ/fwF/YAF/AGACf38AYAN/f38Bf2ADf39/AGAEf39/fwBgBX9/f39/AGAEf39/fwF/YAN/f3wAYAZ/f39/f38AYAV/f39/fwF/YAAAYAV/fn5+fgBgBH9/f3wAYAR/f3x/AGACf3wAYAJ/fAF/YAF/AXxgA398fwF8YAR/fn5/AGACf38BfGACf3wBfGAHf39/f39/fwBgAn99AGADf3x/AGAGf3x/f39/AX9gAn5/AX9gBH5+fn4Bf2ACfH8BfGADf39+AGADf399AGAMf398fHx8f39/f39/AGACf34AYAN/fn4AYAN/fX8AYAZ/f39/f38Bf2AHf39/f39/fwF/YBl/f39/f39/f39/f39/f39/f39/f39/f39/AX9gA39/fAF/YAN+f38Bf2ACfn4Bf2ABfAF+YAJ/fwF+YAR/f39+AX5gAX0BfWACfn4BfWABfAF8YAJ+fgF8YAN8fHwBfAKwg4CAABEDZW52BHRpbWUAAANlbnYIc3RyZnRpbWUACQNlbnYMX19jeGFfYXRleGl0AAUDZW52GGVtc2NyaXB0ZW5fYXNtX2NvbnN0X2ludAAFA2VudhVfZW1iaW5kX3JlZ2lzdGVyX3ZvaWQABANlbnYVX2VtYmluZF9yZWdpc3Rlcl9ib29sAAgDZW52G19lbWJpbmRfcmVnaXN0ZXJfc3RkX3N0cmluZwAEA2VudhxfZW1iaW5kX3JlZ2lzdGVyX3N0ZF93c3RyaW5nAAYDZW52Fl9lbWJpbmRfcmVnaXN0ZXJfZW12YWwABANlbnYYX2VtYmluZF9yZWdpc3Rlcl9pbnRlZ2VyAAgDZW52Fl9lbWJpbmRfcmVnaXN0ZXJfZmxvYXQABgNlbnYcX2VtYmluZF9yZWdpc3Rlcl9tZW1vcnlfdmlldwAGA2VudgpfX2dtdGltZV9yAAIDZW52DV9fbG9jYWx0aW1lX3IAAgNlbnYFYWJvcnQADQNlbnYWZW1zY3JpcHRlbl9yZXNpemVfaGVhcAAAA2VudhVlbXNjcmlwdGVuX21lbWNweV9iaWcABQOGhoCAAIQGDQUFAAICAgkGBggBBwIFAgIEAgQCBAgCAgAAAAAAAAAAAAAAAAQAAwYAAgAABQAoAgAMAgkABQITLgIWCQAHAAAKAhEXEQMTFxAC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EJMFCyABDQcgBygCTCwAARCNBSEBIAcoAkwhDQJAAkAgAUUNACANLQACQSRHDQAgDUEDaiEBIA0sAAFBUGohEEEBIQoMAQsgDUEBaiEBQX8hEAsgByABNgJMQQAhEQJAAkAgASwAACIPQWBqIg5BH00NACABIQ0MAQtBACERIAEhDUEBIA50Ig5BidEEcUUNAANAIAcgAUEBaiINNgJMIA4gEXIhESABLAABIg9BYGoiDkEgTw0BIA0hAUEBIA50Ig5BidEEcQ0ACwsCQAJAIA9BKkcNAAJAAkAgDSwAARCNBUUNACAHKAJMIg0tAAJBJEcNACANLAABQQJ0IARqQcB+akEKNgIAIA1BA2ohASANLAABQQN0IANqQYB9aigCACESQQEhCgwBCyAKDQZBACEKQQAhEgJAIABFDQAgAiACKAIAIgFBBGo2AgAgASgCACESCyAHKAJMQQFqIQELIAcgATYCTCASQX9KDQFBACASayESIBFBgMAAciERDAELIAdBzABqEJQFIhJBAEgNBCAHKAJMIQELQX8hEwJAIAEtAABBLkcNAAJAIAEtAAFBKkcNAAJAIAEsAAIQjQVFDQAgBygCTCIBLQADQSRHDQAgASwAAkECdCAEakHAfmpBCjYCACABLAACQQN0IANqQYB9aigCACETIAcgAUEEaiIBNgJMDAILIAoNBQJAAkAgAA0AQQAhEwwBCyACIAIoAgAiAUEEajYCACABKAIAIRMLIAcgBygCTEECaiIBNgJMDAELIAcgAUEBajYCTCAHQcwAahCUBSETIAcoAkwhAQtBACENA0AgDSEOQX8hFCABLAAAQb9/akE5Sw0JIAcgAUEBaiIPNgJMIAEsAAAhDSAPIQEgDSAOQTpsakGvK2otAAAiDUF/akEISQ0ACwJAAkACQCANQRNGDQAgDUUNCwJAIBBBAEgNACAEIBBBAnRqIA02AgAgByADIBBBA3RqKQMANwNADAILIABFDQkgB0HAAGogDSACIAYQlQUgBygCTCEPDAILQX8hFCAQQX9KDQoLQQAhASAARQ0ICyARQf//e3EiFSARIBFBgMAAcRshDUEAIRRB2CshECAJIRECQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQCAPQX9qLAAAIgFBX3EgASABQQ9xQQNGGyABIA4bIgFBqH9qDiEE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f4V8IgEgAyAAKAIEIgVrrFkNACAFIAGnaiEECyAAIAQ2AmggACgCBCEEAkAgA0UNACAAIAApA3ggAyAEa0EBaqx8NwN4CwJAIAIgBEF/aiIALQAARg0AIAAgAjoAAAsgAgs1ACAAIAE3AwAgACAEQjCIp0GAgAJxIAJCMIinQf//AXFyrUIwhiACQv///////z+DhDcDCAvnAgEBfyMAQdAAayIEJAACQAJAIANBgIABSA0AIARBIGogASACQgBCgICAgICAgP//ABDMBSAEQSBqQQhqKQMAIQIgBCkDICEBAkAgA0H//wFODQAgA0GBgH9qIQMMAgsgBEEQaiABIAJCAEKAgICAgICA//8AEMwFIANB/f8CIANB/f8CSBtBgoB+aiEDIARBEGpBCGopAwAhAiAEKQMQIQEMAQsgA0GBgH9KDQAgBEHAAGogASACQgBCgICAgICAwAAQzAUgBEHAAGpBCGopAwAhAiAEKQNAIQECQCADQYOAfkwNACADQf7/AGohAwwBCyAEQTBqIAEgAkIAQoCAgICAgMAAEMwFIANBhoB9IANBhoB9ShtB/P8BaiEDIARBMGpBCGopAwAhAiAEKQMwIQELIAQgASACQgAgA0H//wBqrUIwhhDMBSAAIARBCGopAwA3AwggACAEKQMANwMAIARB0ABqJAALHAAgACACQv///////////wCDNwMIIAAgATcDAAveCAIGfwJ+IwBBMGsiBCQAQgAhCgJAAkAgAkECSw0AIAFBBGohBSACQQJ0IgJBzDBqKAIAIQYgAkHAMGooAgAhBwNAAkACQCABKAIEIgIgASgCaE8NACAFIAJBAWo2AgAgAi0AACECDAELIAEQoQUhAgsgAhCeBQ0AC0EBIQgCQAJAIAJBVWoOAwABAAELQX9BASACQS1GGyEIAkAgASgCBCICIAEoAmhPDQAgBSACQQFqNgIAIAItAAAhAgwBCyABEKEFIQILQQAhCQJAAkACQANAIAJBIHIgCUH1L2osAABHDQECQCAJQQZLDQACQCABKAIEIgIgASgCaE8NACAFIAJBAWo2AgAgAi0AACECDAELIAEQoQUhAgsgCUEBaiIJQQhHDQAMAgsACwJAIAlBA0YNACAJQQhGDQEgA0UNAiAJQQRJDQIgCUEIRg0BCwJAIAEoAmgiAUUNACAFIAUoAgBBf2o2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IQsMAQsgCyABakEAOgAACyAAKQN4IBF8IAAoAgQgACgCCGusfCERIAQgCUEAR2ohBAsgBkEBaiEBIAYtAAEiBg0ADAULAAtBACELQQAhDAsgBA0BC0F/IQQLIAhFDQAgCxCCBiAMEIIGCwJAIAVFDQAgABCQBgsgA0GwAmokACAECzIBAX8jAEEQayICIAA2AgwgAiABQQJ0IABqQXxqIAAgAUEBSxsiAEEEajYCCCAAKAIAC0MAAkAgAEUNAAJAAkACQAJAIAFBAmoOBgABAgIEAwQLIAAgAjwAAA8LIAAgAj0BAA8LIAAgAj4CAA8LIAAgAjcDAAsLVwEDfyAAKAJUIQMgASADIANBACACQYACaiIEEP0EIgUgA2sgBCAFGyIEIAIgBCACSRsiAhCKBhogACADIARqIgQ2AlQgACAENgIIIAAgAyACajYCBCACC0oBAX8jAEGQAWsiAyQAIANBAEGQARCLBiIDQX82AkwgAyAANgIsIANBogE2AiAgAyAANgJUIAMgASACEKwFIQAgA0GQAWokACAACwsAIAAgASACEK8FCygBAX8jAEEQayIDJAAgAyACNgIMIAAgASACELAFIQIgA0EQaiQAIAILjwEBBX8DQCAAIgFBAWohACABLAAAEJ4FDQALQQAhAkEAIQNBACEEAkACQAJAIAEsAAAiBUFVag4DAQIAAgtBASEDCyAALAAAIQUgACEBIAMhBAsCQCAFEI0FRQ0AA0AgAkEKbCABLAAAa0EwaiECIAEsAAEhACABQQFqIQEgABCNBQ0ACwsgAkEAIAJrIAQbCwoAIABBrMAAEAwLCgAgAEHYwAAQDQsGAEGEwQALBgBBjMEACwYAQZDBAAsFAEH8OQsEAEEACwQAQQALBABBAAsEAEEACwQAQQALBABBAAsEAEEAC+ABAgF/An5BASEEAkAgAEIAUiABQv///////////wCDIgVCgICAgICAwP//AFYgBUKAgICAgIDA//8AURsNACACQgBSIANC////////////AIMiBkKAgICAgIDA//8AViAGQoCAgICAgMD//wBRGw0AAkAgAiAAhCAGIAWEhFBFDQBBAA8LAkAgAyABg0IAUw0AQX8hBCAAIAJUIAEgA1MgASADURsNASAAIAKFIAEgA4WEQgBSDwtBfyEEIAAgAlYgASADVSABIANRGw0AIAAgAoUgASADhYRCAFIhBAsgBAvYAQIBfwJ+QX8hBAJAIABCAFIgAUL///////////8AgyIFQoCAgICAgMD//wBWIAVCgICAgICAwP//AFEbDQAgAkIAUiADQv///////////wCDIgZCgICAgICAwP//AFYgBkKAgICAgIDA//8AURsNAAJAIAIgAIQgBiAFhIRQRQ0AQQAPCwJAIAMgAYNCAFMNACAAIAJUIAEgA1MgASADURsNASAAIAKFIAEgA4WEQgBSDwsgACACViABIANVIAEgA1EbDQAgACAChSABIAOFhEIAUiEECyAEC3UBAX4gACAEIAF+IAIgA358IANCIIgiBCABQiCIIgJ+fCADQv////8PgyIDIAFC/////w+DIgF+IgVCIIggAyACfnwiA0IgiHwgA0L/////D4MgBCABfnwiA0IgiHw3AwggACADQiCGIAVC/////w+DhDcDAAtTAQF+AkACQCADQcAAcUUNACABIANBQGqthiECQgAhAQwBCyADRQ0AIAFBwAAgA2utiCACIAOtIgSGhCECIAEgBIYhAQsgACABNwMAIAAgAjcDCAsEAEEACwQAQQAL+AoCBH8EfiMAQfAAayIFJAAgBEL///////////8AgyEJAkACQAJAIAFCf3wiCkJ/USACQv///////////wCDIgsgCiABVK18Qn98IgpC////////v///AFYgCkL///////+///8AURsNACADQn98IgpCf1IgCSAKIANUrXxCf3wiCkL///////+///8AVCAKQv///////7///wBRGw0BCwJAIAFQIAtCgICAgICAwP//AFQgC0KAgICAgIDA//8AURsNACACQoCAgICAgCCEIQQgASEDDAILAkAgA1AgCUKAgICAgIDA//8AVCAJQoCAgICAgMD//wBRGw0AIARCgICAgICAIIQhBAwCCwJAIAEgC0KAgICAgIDA//8AhYRCAFINAEKAgICAgIDg//8AIAIgAyABhSAEIAKFQoCAgICAgICAgH+FhFAiBhshBEIAIAEgBhshAwwCCyADIAlCgICAgICAwP//AIWEUA0BAkAgASALhEIAUg0AIAMgCYRCAFINAiADIAGDIQMgBCACgyEEDAILIAMgCYRQRQ0AIAEhAyACIQQMAQsgAyABIAMgAVYgCSALViAJIAtRGyIHGyEJIAQgAiAHGyILQv///////z+DIQogAiAEIAcbIgJCMIinQf//AXEhCAJAIAtCMIinQf//AXEiBg0AIAVB4ABqIAkgCiAJIAogClAiBht5IAZBBnStfKciBkFxahDEBUEQIAZrIQYgBUHoAGopAwAhCiAFKQNgIQkLIAEgAyAHGyEDIAJC////////P4MhBAJAIAgNACAFQdAAaiADIAQgAyAEIARQIgcbeSAHQQZ0rXynIgdBcWoQxAVBECAHayEIIAVB2ABqKQMAIQQgBSkDUCEDCyAEQgOGIANCPYiEQoCAgICAgIAEhCEEIApCA4YgCUI9iIQhASADQgOGIQMgCyAChSEKAkAgBiAIayIHRQ0AAkAgB0H/AE0NAEIAIQRCASEDDAELIAVBwABqIAMgBEGAASAHaxDEBSAFQTBqIAMgBCAHEMkFIAUpAzAgBSkDQCAFQcAAakEIaikDAIRCAFKthCEDIAVBMGpBCGopAwAhBAsgAUKAgICAgICABIQhDCAJQgOGIQICQAJAIApCf1UNAAJAIAIgA30iASAMIAR9IAIgA1StfSIEhFBFDQBCACEDQgAhBAwDCyAEQv////////8DVg0BIAVBIGogASAEIAEgBCAEUCIHG3kgB0EGdK18p0F0aiIHEMQFIAYgB2shBiAFQShqKQMAIQQgBSkDICEBDAELIAQgDHwgAyACfCIBIANUrXwiBEKAgICAgICACINQDQAgAUIBiCAEQj+GhCABQgGDhCEBIAZBAWohBiAEQgGIIQQLIAtCgICAgICAgICAf4MhAgJAIAZB//8BSA0AIAJCgICAgICAwP//AIQhBEIAIQMMAQtBACEHAkACQCAGQQBMDQAgBiEHDAELIAVBEGogASAEIAZB/wBqEMQFIAUgASAEQQEgBmsQyQUgBSkDACAFKQMQIAVBEGpBCGopAwCEQgBSrYQhASAFQQhqKQMAIQQLIAFCA4ggBEI9hoQhAyAHrUIwhiAEQgOIQv///////z+DhCAChCEEIAGnQQdxIQYCQAJAAkACQAJAEMUFDgMAAQIDCyAEIAMgBkEES618IgEgA1StfCEEAkAgBkEERg0AIAEhAwwDCyAEIAFCAYMiAiABfCIDIAJUrXwhBAwDCyAEIAMgAkIAUiAGQQBHca18IgEgA1StfCEEIAEhAwwBCyAEIAMgAlAgBkEAR3GtfCIBIANUrXwhBCABIQMLIAZFDQELEMYFGgsgACADNwMAIAAgBDcDCCAFQfAAaiQAC+EBAgN/An4jAEEQayICJAACQAJAIAG8IgNB/////wdxIgRBgICAfGpB////9wdLDQAgBK1CGYZCgICAgICAgMA/fCEFQgAhBgwBCwJAIARBgICA/AdJDQAgA61CGYZCgICAgICAwP//AIQhBUIAIQYMAQsCQCAEDQBCACEGQgAhBQwBCyACIAStQgAgBGciBEHRAGoQxAUgAkEIaikDAEKAgICAgIDAAIVBif8AIARrrUIwhoQhBSACKQMAIQYLIAAgBjcDACAAIAUgA0GAgICAeHGtQiCGhDcDCCACQRBqJAALUwEBfgJAAkAgA0HAAHFFDQAgAiADQUBqrYghAUIAIQIMAQsgA0UNACACQcAAIANrrYYgASADrSIEiIQhASACIASIIQILIAAgATcDACAAIAI3AwgLxAMCA38BfiMAQSBrIgIkAAJAAkAgAUL///////////8AgyIFQoCAgICAgMC/QHwgBUKAgICAgIDAwL9/fFoNACABQhmIpyEDAkAgAFAgAUL///8PgyIFQoCAgAhUIAVCgICACFEbDQAgA0GBgICABGohBAwCCyADQYCAgIAEaiEEIAAgBUKAgIAIhYRCAFINASAEIANBAXFqIQQMAQsCQCAAUCAFQoCAgICAgMD//wBUIAVCgICAgICAwP//AFEbDQAgAUIZiKdB////AXFBgICA/gdyIQQMAQtBgICA/AchBCAFQv///////7+/wABWDQBBACEEIAVCMIinIgNBkf4ASQ0AIAJBEGogACABQv///////z+DQoCAgICAgMAAhCIFIANB/4F/ahDEBSACIAAgBUGB/wAgA2sQyQUgAkEIaikDACIFQhmIpyEEAkAgAikDACACKQMQIAJBEGpBCGopAwCEQgBSrYQiAFAgBUL///8PgyIFQoCAgAhUIAVCgICACFEbDQAgBEEBaiEEDAELIAAgBUKAgIAIhYRCAFINACAEQQFxIARqIQQLIAJBIGokACAEIAFCIIinQYCAgIB4cXK+C44CAgJ/A34jAEEQayICJAACQAJAIAG9IgRC////////////AIMiBUKAgICAgICAeHxC/////////+//AFYNACAFQjyGIQYgBUIEiEKAgICAgICAgDx8IQUMAQsCQCAFQoCAgICAgID4/wBUDQAgBEI8hiEGIARCBIhCgICAgICAwP//AIQhBQwBCwJAIAVQRQ0AQgAhBkIAIQUMAQsgAiAFQgAgBKdnQSBqIAVCIIinZyAFQoCAgIAQVBsiA0ExahDEBSACQQhqKQMAQoCAgICAgMAAhUGM+AAgA2utQjCGhCEFIAIpAwAhBgsgACAGNwMAIAAgBSAEQoCAgICAgICAgH+DhDcDCCACQRBqJAAL6wsCBX8PfiMAQeAAayIFJAAgAUIgiCACQiCGhCEKIANCEYggBEIvhoQhCyADQjGIIARC////////P4MiDEIPhoQhDSAEIAKFQoCAgICAgICAgH+DIQ4gAkL///////8/gyIPQiCIIRAgDEIRiCERIARCMIinQf//AXEhBgJAAkACQCACQjCIp0H//wFxIgdBf2pB/f8BSw0AQQAhCCAGQX9qQf7/AUkNAQsCQCABUCACQv///////////wCDIhJCgICAgICAwP//AFQgEkKAgICAgIDA//8AURsNACACQoCAgICAgCCEIQ4MAgsCQCADUCAEQv///////////wCDIgJCgICAgICAwP//AFQgAkKAgICAgIDA//8AURsNACAEQoCAgICAgCCEIQ4gAyEBDAILAkAgASASQoCAgICAgMD//wCFhEIAUg0AAkAgAyAChFBFDQBCgICAgICA4P//ACEOQgAhAQwDCyAOQoCAgICAgMD//wCEIQ5CACEBDAILAkAgAyACQoCAgICAgMD//wCFhEIAUg0AIAEgEoQhAkIAIQECQCACUEUNAEKAgICAgIDg//8AIQ4MAwsgDkKAgICAgIDA//8AhCEODAILAkAgASAShEIAUg0AQgAhAQwCCwJAIAMgAoRCAFINAEIAIQEMAgtBACEIAkAgEkL///////8/Vg0AIAVB0ABqIAEgDyABIA8gD1AiCBt5IAhBBnStfKciCEFxahDEBUEQIAhrIQggBSkDUCIBQiCIIAVB2ABqKQMAIg9CIIaEIQogD0IgiCEQCyACQv///////z9WDQAgBUHAAGogAyAMIAMgDCAMUCIJG3kgCUEGdK18pyIJQXFqEMQFIAggCWtBEGohCCAFKQNAIgNCMYggBUHIAGopAwAiAkIPhoQhDSADQhGIIAJCL4aEIQsgAkIRiCERCyALQv////8PgyICIAFC/////w+DIgR+IhMgA0IPhkKAgP7/D4MiASAKQv////8PgyIDfnwiCkIghiIMIAEgBH58IgsgDFStIAIgA34iFCABIA9C/////w+DIgx+fCISIA1C/////w+DIg8gBH58Ig0gCkIgiCAKIBNUrUIghoR8IhMgAiAMfiIVIAEgEEKAgASEIgp+fCIQIA8gA358IhYgEUL/////B4NCgICAgAiEIgEgBH58IhFCIIZ8Ihd8IQQgByAGaiAIakGBgH9qIQYCQAJAIA8gDH4iGCACIAp+fCICIBhUrSACIAEgA358IgMgAlStfCADIBIgFFStIA0gElStfHwiAiADVK18IAEgCn58IAEgDH4iAyAPIAp+fCIBIANUrUIghiABQiCIhHwgAiABQiCGfCIBIAJUrXwgASARQiCIIBAgFVStIBYgEFStfCARIBZUrXxCIIaEfCIDIAFUrXwgAyATIA1UrSAXIBNUrXx8IgIgA1StfCIBQoCAgICAgMAAg1ANACAGQQFqIQYMAQsgC0I/iCEDIAFCAYYgAkI/iIQhASACQgGGIARCP4iEIQIgC0IBhiELIAMgBEIBhoQhBAsCQCAGQf//AUgNACAOQoCAgICAgMD//wCEIQ5CACEBDAELAkACQCAGQQBKDQACQEEBIAZrIgdBgAFJDQBCACEBDAMLIAVBMGogCyAEIAZB/wBqIgYQxAUgBUEgaiACIAEgBhDEBSAFQRBqIAsgBCAHEMkFIAUgAiABIAcQyQUgBSkDICAFKQMQhCAFKQMwIAVBMGpBCGopAwCEQgBSrYQhCyAFQSBqQQhqKQMAIAVBEGpBCGopAwCEIQQgBUEIaikDACEBIAUpAwAhAgwBCyAGrUIwhiABQv///////z+DhCEBCyABIA6EIQ4CQCALUCAEQn9VIARCgICAgICAgICAf1EbDQAgDiACQgF8IgEgAlStfCEODAELAkAgCyAEQoCAgICAgICAgH+FhEIAUQ0AIAIhAQwBCyAOIAIgAkIBg3wiASACVK18IQ4LIAAgATcDACAAIA43AwggBUHgAGokAAtBAQF/IwBBEGsiBSQAIAUgASACIAMgBEKAgICAgICAgIB/hRDHBSAAIAUpAwA3AwAgACAFKQMINwMIIAVBEGokAAuNAQICfwJ+IwBBEGsiAiQAAkACQCABDQBCACEEQgAhBQwBCyACIAEgAUEfdSIDaiADcyIDrUIAIANnIgNB0QBqEMQFIAJBCGopAwBCgICAgICAwACFQZ6AASADa61CMIZ8IAFBgICAgHhxrUIghoQhBSACKQMAIQQLIAAgBDcDACAAIAU3AwggAkEQaiQAC58SAgV/DH4jAEHAAWsiBSQAIARC////////P4MhCiACQv///////z+DIQsgBCAChUKAgICAgICAgIB/gyEMIARCMIinQf//AXEhBgJAAkACQAJAIAJCMIinQf//AXEiB0F/akH9/wFLDQBBACEIIAZBf2pB/v8BSQ0BCwJAIAFQIAJC////////////AIMiDUKAgICAgIDA//8AVCANQoCAgICAgMD//wBRGw0AIAJCgICAgICAIIQhDAwCCwJAIANQIARC////////////AIMiAkKAgICAgIDA//8AVCACQoCAgICAgMD//wBRGw0AIARCgICAgICAIIQhDCADIQEMAgsCQCABIA1CgICAgICAwP//AIWEQgBSDQACQCADIAJCgICAgICAwP//AIWEUEUNAEIAIQFCgICAgICA4P//ACEMDAMLIAxCgICAgICAwP//AIQhDEIAIQEMAgsCQCADIAJCgICAgICAwP//AIWEQgBSDQBCACEBDAILIAEgDYRCAFENAgJAIAMgAoRCAFINACAMQoCAgICAgMD//wCEIQxCACEBDAILQQAhCAJAIA1C////////P1YNACAFQbABaiABIAsgASALIAtQIggbeSAIQQZ0rXynIghBcWoQxAVBECAIayEIIAVBuAFqKQMAIQsgBSkDsAEhAQsgAkL///////8/Vg0AIAVBoAFqIAMgCiADIAogClAiCRt5IAlBBnStfKciCUFxahDEBSAJIAhqQXBqIQggBUGoAWopAwAhCiAFKQOgASEDCyAFQZABaiADQjGIIApCgICAgICAwACEIg5CD4aEIgJCAEKEyfnOv+a8gvUAIAJ9IgRCABDDBSAFQYABakIAIAVBkAFqQQhqKQMAfUIAIARCABDDBSAFQfAAaiAFKQOAAUI/iCAFQYABakEIaikDAEIBhoQiBEIAIAJCABDDBSAFQeAAaiAEQgBCACAFQfAAakEIaikDAH1CABDDBSAFQdAAaiAFKQNgQj+IIAVB4ABqQQhqKQMAQgGGhCIEQgAgAkIAEMMFIAVBwABqIARCAEIAIAVB0ABqQQhqKQMAfUIAEMMFIAVBMGogBSkDQEI/iCAFQcAAakEIaikDAEIBhoQiBEIAIAJCABDDBSAFQSBqIARCAEIAIAVBMGpBCGopAwB9QgAQwwUgBUEQaiAFKQMgQj+IIAVBIGpBCGopAwBCAYaEIgRCACACQgAQwwUgBSAEQgBCACAFQRBqQQhqKQMAfUIAEMMFIAggByAGa2ohBgJAAkBCACAFKQMAQj+IIAVBCGopAwBCAYaEQn98Ig1C/////w+DIgQgAkIgiCIPfiIQIA1CIIgiDSACQv////8PgyIRfnwiAkIgiCACIBBUrUIghoQgDSAPfnwgAkIghiIPIAQgEX58IgIgD1StfCACIAQgA0IRiEL/////D4MiEH4iESANIANCD4ZCgID+/w+DIhJ+fCIPQiCGIhMgBCASfnwgE1StIA9CIIggDyARVK1CIIaEIA0gEH58fHwiDyACVK18IA9CAFKtfH0iAkL/////D4MiECAEfiIRIBAgDX4iEiAEIAJCIIgiE358IgJCIIZ8IhAgEVStIAJCIIggAiASVK1CIIaEIA0gE358fCAQQgAgD30iAkIgiCIPIAR+IhEgAkL/////D4MiEiANfnwiAkIghiITIBIgBH58IBNUrSACQiCIIAIgEVStQiCGhCAPIA1+fHx8IgIgEFStfCACQn58IhEgAlStfEJ/fCIPQv////8PgyICIAFCPoggC0IChoRC/////w+DIgR+IhAgAUIeiEL/////D4MiDSAPQiCIIg9+fCISIBBUrSASIBFCIIgiECALQh6IQv//7/8Pg0KAgBCEIgt+fCITIBJUrXwgCyAPfnwgAiALfiIUIAQgD358IhIgFFStQiCGIBJCIIiEfCATIBJCIIZ8IhIgE1StfCASIBAgDX4iFCARQv////8PgyIRIAR+fCITIBRUrSATIAIgAUIChkL8////D4MiFH58IhUgE1StfHwiEyASVK18IBMgFCAPfiISIBEgC358Ig8gECAEfnwiBCACIA1+fCICQiCIIA8gElStIAQgD1StfCACIARUrXxCIIaEfCIPIBNUrXwgDyAVIBAgFH4iBCARIA1+fCINQiCIIA0gBFStQiCGhHwiBCAVVK0gBCACQiCGfCAEVK18fCIEIA9UrXwiAkL/////////AFYNACABQjGGIARC/////w+DIgEgA0L/////D4MiDX4iD0IAUq19QgAgD30iESAEQiCIIg8gDX4iEiABIANCIIgiEH58IgtCIIYiE1StfSAEIA5CIIh+IAMgAkIgiH58IAIgEH58IA8gCn58QiCGIAJC/////w+DIA1+IAEgCkL/////D4N+fCAPIBB+fCALQiCIIAsgElStQiCGhHx8fSENIBEgE30hASAGQX9qIQYMAQsgBEIhiCEQIAFCMIYgBEIBiCACQj+GhCIEQv////8PgyIBIANC/////w+DIg1+Ig9CAFKtfUIAIA99IgsgASADQiCIIg9+IhEgECACQh+GhCISQv////8PgyITIA1+fCIQQiCGIhRUrX0gBCAOQiCIfiADIAJCIYh+fCACQgGIIgIgD358IBIgCn58QiCGIBMgD34gAkL/////D4MgDX58IAEgCkL/////D4N+fCAQQiCIIBAgEVStQiCGhHx8fSENIAsgFH0hASACIQILAkAgBkGAgAFIDQAgDEKAgICAgIDA//8AhCEMQgAhAQwBCyAGQf//AGohBwJAIAZBgYB/Sg0AAkAgBw0AIAJC////////P4MgBCABQgGGIANWIA1CAYYgAUI/iIQiASAOViABIA5RG618IgEgBFStfCIDQoCAgICAgMAAg1ANACADIAyEIQwMAgtCACEBDAELIAJC////////P4MgBCABQgGGIANaIA1CAYYgAUI/iIQiASAOWiABIA5RG618IgEgBFStfCAHrUIwhnwgDIQhDAsgACABNwMAIAAgDDcDCCAFQcABaiQADwsgAEIANwMAIABCgICAgICA4P//ACAMIAMgAoRQGzcDCCAFQcABaiQAC+oDAgJ/An4jAEEgayICJAACQAJAIAFC////////////AIMiBEKAgICAgIDA/0N8IARCgICAgICAwIC8f3xaDQAgAEI8iCABQgSGhCEEAkAgAEL//////////w+DIgBCgYCAgICAgIAIVA0AIARCgYCAgICAgIDAAHwhBQwCCyAEQoCAgICAgICAwAB8IQUgAEKAgICAgICAgAiFQgBSDQEgBSAEQgGDfCEFDAELAkAgAFAgBEKAgICAgIDA//8AVCAEQoCAgICAgMD//wBRGw0AIABCPIggAUIEhoRC/////////wODQoCAgICAgID8/wCEIQUMAQtCgICAgICAgPj/ACEFIARC////////v//DAFYNAEIAIQUgBEIwiKciA0GR9wBJDQAgAkEQaiAAIAFC////////P4NCgICAgICAwACEIgQgA0H/iH9qEMQFIAIgACAEQYH4ACADaxDJBSACKQMAIgRCPIggAkEIaikDAEIEhoQhBQJAIARC//////////8PgyACKQMQIAJBEGpBCGopAwCEQgBSrYQiBEKBgICAgICAgAhUDQAgBUIBfCEFDAELIARCgICAgICAgIAIhUIAUg0AIAVCAYMgBXwhBQsgAkEgaiQAIAUgAUKAgICAgICAgIB/g4S/C3ICAX8CfiMAQRBrIgIkAAJAAkAgAQ0AQgAhA0IAIQQMAQsgAiABrUIAIAFnIgFB0QBqEMQFIAJBCGopAwBCgICAgICAwACFQZ6AASABa61CMIZ8IQQgAikDACEDCyAAIAM3AwAgACAENwMIIAJBEGokAAszAQF/IABBASAAGyEBAkADQCABEIEGIgANAQJAEOQFIgBFDQAgABENAAwBCwsQDgALIAALBwAgABCCBgsDAAALIgEBfyMAQRBrIgEkACABIAAQ1gUQ1wUhACABQRBqJAAgAAsMACAAIAEQ2AUaIAALOQECfyMAQRBrIgEkAEEAIQICQCABQQhqIAAoAgQQ2QUQ2gUNACAAENsFENwFIQILIAFBEGokACACCyMAIABBADYCDCAAIAE2AgQgACABNgIAIAAgAUEBajYCCCAACwsAIAAgATYCACAACwoAIAAoAgAQ4QULBAAgAAs9AQJ/QQAhAQJAAkAgACgCCCICLQAAIgBBAUYNACAAQQJxDQEgAkECOgAAQQEhAQsgAQ8LQbw0QQAQ1AUACx4BAX8jAEEQayIBJAAgASAAENYFEN4FIAFBEGokAAssAQF/IwBBEGsiASQAIAFBCGogACgCBBDZBRDfBSAAENsFEOAFIAFBEGokAAsKACAAKAIAEOIFCwwAIAAoAghBAToAAAsHACAALQAACwkAIABBAToAAAsHACAAKAIACwkAQZTBABDjBQsLAEHyNEEAENQFAAsEACAACwoAIAAQ5gUaIAALAgALAgALDQAgABDnBRogABDTBQsNACAAEOcFGiAAENMFCw0AIAAQ5wUaIAAQ0wULDQAgABDnBRogABDTBQsLACAAIAFBABDvBQswAAJAIAIN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ZCBjaGFyAHVuc2lnbmVkIGNoYXIAc2hvcnQAdW5zaWduZWQgc2hvcnQAaW50AHVuc2lnbmVkIGludABsb25nAHVuc2lnbmVkIGxvbmcAZmxvYXQAZG91YmxlAHN0ZDo6c3RyaW5nAHN0ZDo6YmFzaWNfc3RyaW5nPHVuc2lnbmVkIGNoYXI+AHN0ZDo6d3N0cmluZwBzdGQ6OnUxNnN0cmluZwBzdGQ6OnUzMnN0cmluZwBlbXNjcmlwdGVuOjp2YWwAZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8Y2hhcj4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8c2lnbmVkIGNoYXI+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PHVuc2lnbmVkIGNoYXI+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PHNob3J0PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzx1bnNpZ25lZCBzaG9ydD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8aW50PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzx1bnNpZ25lZCBpbnQ+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PGxvbmc+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PHVuc2lnbmVkIGxvbmc+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PGludDhfdD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8dWludDhfdD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8aW50MTZfdD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8dWludDE2X3Q+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PGludDMyX3Q+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PHVpbnQzMl90PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxmbG9hdD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8ZG91YmxlPgBOU3QzX18yMTJiYXNpY19zdHJpbmdJaE5TXzExY2hhcl90cmFpdHNJaEVFTlNfOWFsbG9jYXRvckloRUVFRQAAAIAcAAAHEgAAAAAAAAEAAAD8CAAAAAAAAE5TdDNfXzIxMmJhc2ljX3N0cmluZ0l3TlNfMTFjaGFyX3RyYWl0c0l3RUVOU185YWxsb2NhdG9ySXdFRUVFAACAHAAAYBIAAAAAAAABAAAA/AgAAAAAAABOU3QzX18yMTJiYXNpY19zdHJpbmdJRHNOU18xMWNoYXJfdHJhaXRzSURzRUVOU185YWxsb2NhdG9ySURzRUVFRQAAAIAcAAC4EgAAAAAAAAEAAAD8CAAAAAAAAE5TdDNfXzIxMmJhc2ljX3N0cmluZ0lEaU5TXzExY2hhcl90cmFpdHNJRGlFRU5TXzlhbGxvY2F0b3JJRGlFRUVFAAAAgBwAABQTAAAAAAAAAQAAAPwIAAAAAAAATjEwZW1zY3JpcHRlbjN2YWxFAAD8GwAAcBMAAE4xMGVtc2NyaXB0ZW4xMW1lbW9yeV92aWV3SWNFRQAA/BsAAIwTAABOMTBlbXNjcmlwdGVuMTFtZW1vcnlfdmlld0lhRUUAAPwbAAC0EwAATjEwZW1zY3JpcHRlbjExbWVtb3J5X3ZpZXdJaEVFAAD8GwAA3BMAAE4xMGVtc2NyaXB0ZW4xMW1lbW9yeV92aWV3SXNFRQAA/BsAAAQUAABOMTBlbXNjcmlwdGVuMTFtZW1vcnlfdmlld0l0RUUAAPwbAAAsFAAATjEwZW1zY3JpcHRlbjExbWVtb3J5X3ZpZXdJaUVFAAD8GwAAVBQAAE4xMGVtc2NyaXB0ZW4xMW1lbW9yeV92aWV3SWpFRQAA/BsAAHwUAABOMTBlbXNjcmlwdGVuMTFtZW1vcnlfdmlld0lsRUUAAPwbAACkFAAATjEwZW1zY3JpcHRlbjExbWVtb3J5X3ZpZXdJbUVFAAD8GwAAzBQAAE4xMGVtc2NyaXB0ZW4xMW1lbW9yeV92aWV3SWZFRQAA/BsAAPQUAABOMTBlbXNjcmlwdGVuMTFtZW1vcnlfdmlld0lkRUUAAPwbAAAcFQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJ8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP//////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAC0rICAgMFgweAAobnVsbCkAAAAAAAAAABEACgAREREAAAAABQAAAAAAAAkAAAAACwAAAAAAAAAAEQAPChEREQMKBwABAAkLCwAACQYLAAALAAYRAAAAERERAAAAAAAAAAAAAAAAAAAAAAsAAAAAAAAAABEACgoREREACgAAAgAJCwAAAAkACwAACwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMAAAAAAAAAAAAAAAMAAAAAAwAAAAACQwAAAAAAAwAAAwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADgAAAAAAAAAAAAAADQAAAAQNAAAAAAkOAAAAAAAOAAAOAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAA8AAAAADwAAAAAJEAAAAAAAEAAAEAAAEgAAABISEgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAASAAAAEhISAAAAAAAACQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACwAAAAAAAAAAAAAACgAAAAAKAAAAAAkLAAAAAAALAAALAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwAAAAAAAAAAAAAAAwAAAAADAAAAAAJDAAAAAAADAAADAAAMDEyMzQ1Njc4OUFCQ0RFRi0wWCswWCAwWC0weCsweCAweABpbmYASU5GAG5hbgBOQU4ALgBpbmZpbml0eQBuYW4AAAAAAAAAAAAAAAAAAADRdJ4AV529KoBwUg///z4nCgAAAGQAAADoAwAAECcAAKCGAQBAQg8AgJaYAADh9QUYAAAANQAAAHEAAABr////zvv//5K///8AAAAAAAAAAP////////////////////////////////////////////////////////////////8AAQIDBAUGBwgJ/////////woLDA0ODxAREhMUFRYXGBkaGxwdHh8gISIj////////CgsMDQ4PEBESExQVFhcYGRobHB0eHyAhIiP/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////AAECBAcDBgUAAAAAAAAAAgAAwAMAAMAEAADABQAAwAYAAMAHAADACAAAwAkAAMAKAADACwAAwAwAAMANAADADgAAwA8AAMAQAADAEQAAwBIAAMATAADAFAAAwBUAAMAWAADAFwAAwBgAAMAZAADAGgAAwBsAAMAcAADAHQAAwB4AAMAfAADAAAAAswEAAMMCAADDAwAAwwQAAMMFAADDBgAAwwcAAMMIAADDCQAAwwoAAMMLAADDDAAAww0AANMOAADDDwAAwwAADLsBAAzDAgAMwwMADMMEAAzTX19jeGFfZ3VhcmRfYWNxdWlyZSBkZXRlY3RlZCByZWN1cnNpdmUgaW5pdGlhbGl6YXRpb24AUHVyZSB2aXJ0dWFsIGZ1bmN0aW9uIGNhbGxlZCEAU3Q5dHlwZV9pbmZvAAAAAPwbAACQGgAATjEwX19jeHhhYml2MTE2X19zaGltX3R5cGVfaW5mb0UAAAAAJBwAAKgaAACgGgAATjEwX19jeHhhYml2MTE3X19jbGFzc190eXBlX2luZm9FAAAAJBwAANgaAADMGgAAAAAAAEwbAACjAAAApAAAAKUAAACmAAAApwAAAE4xMF9fY3h4YWJpdjEyM19fZnVuZGFtZW50YWxfdHlwZV9pbmZvRQAkHAAAJBsAAMwaAAB2AAAAEBsAAFgbAABiAAAAEBsAAGQbAABjAAAAEBsAAHAbAABoAAAAEBsAAHwbAABhAAAAEBsAAIgbAABzAAAAEBsAAJQbAAB0AAAAEBsAAKAbAABpAAAAEBsAAKwbAABqAAAAEBsAALgbAABsAAAAEBsAAMQbAABtAAAAEBsAANAbAABmAAAAEBsAANwbAABkAAAAEBsAAOgbAAAAAAAA/BoAAKMAAACoAAAApQAAAKYAAACpAAAAqgAAAKsAAACsAAAAAAAAAGwcAACjAAAArQAAAKUAAACmAAAAqQAAAK4AAACvAAAAsAAAAE4xMF9fY3h4YWJpdjEyMF9fc2lfY2xhc3NfdHlwZV9pbmZvRQAAAAAkHAAARBwAAPwaAAAAAAAAyBwAAKMAAACxAAAApQAAAKYAAACpAAAAsgAAALMAAAC0AAAATjEwX19jeHhhYml2MTIxX192bWlfY2xhc3NfdHlwZV9pbmZvRQAAACQcAACgHAAA/BoAAABB4DkLhAKUBQAAmgUAAJ8FAACmBQAAqQUAALkFAADDBQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAkCJQAABB5DsLAA==';
if (!isDataURI(wasmBinaryFile)) {
  wasmBinaryFile = locateFile(wasmBinaryFile);
}

function getBinary(file) {
  try {
    if (file == wasmBinaryFile && wasmBinary) {
      return new Uint8Array(wasmBinary);
    }
    var binary = tryParseAsDataURI(file);
    if (binary) {
      return binary;
    }
    if (readBinary) {
      return readBinary(file);
    } else {
      throw "sync fetching of the wasm failed: you can preload it to Module['wasmBinary'] manually, or emcc.py will do that for you when generating HTML (but not JS)";
    }
  }
  catch (err) {
    abort(err);
  }
}

function getBinaryPromise() {
  // If we don't have the binary yet, try to to load it asynchronously.
  // Fetch has some additional restrictions over XHR, like it can't be used on a file:// url.
  // See https://github.com/github/fetch/pull/92#issuecomment-140665932
  // Cordova or Electron apps are typically loaded from a file:// url.
  // So use fetch if it is available and the url is not a file, otherwise fall back to XHR.
  if (!wasmBinary && (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER)) {
    if (typeof fetch === 'function'
      && !isFileURI(wasmBinaryFile)
    ) {
      return fetch(wasmBinaryFile, { credentials: 'same-origin' }).then(function(response) {
        if (!response['ok']) {
          throw "failed to load wasm binary file at '" + wasmBinaryFile + "'";
        }
        return response['arrayBuffer']();
      }).catch(function () {
          return getBinary(wasmBinaryFile);
      });
    }
    else {
      if (readAsync) {
        // fetch is not available or url is file => try XHR (readAsync uses XHR internally)
        return new Promise(function(resolve, reject) {
          readAsync(wasmBinaryFile, function(response) { resolve(new Uint8Array(/** @type{!ArrayBuffer} */(response))) }, reject)
        });
      }
    }
  }
    
  // Otherwise, getBinary should be able to get it synchronously
  return Promise.resolve().then(function() { return getBinary(wasmBinaryFile); });
}

function instantiateSync(file, info) {
  var instance;
  var module;
  var binary;
  try {
    binary = getBinary(file);
    module = new WebAssembly.Module(binary);
    instance = new WebAssembly.Instance(module, info);
  } catch (e) {
    var str = e.toString();
    err('failed to compile wasm module: ' + str);
    if (str.indexOf('imported Memory') >= 0 ||
        str.indexOf('memory import') >= 0) {
      err('Memory size incompatibility issues may be due to changing INITIAL_MEMORY at runtime to something too large. Use ALLOW_MEMORY_GROWTH to allow any size memory (and also make sure not to set INITIAL_MEMORY at runtime to something smaller than it was at compile time).');
    }
    throw e;
  }
  return [instance, module];
}

// Create the wasm instance.
// Receives the wasm imports, returns the exports.
function createWasm() {
  // prepare imports
  var info = {
    'env': asmLibraryArg,
    'wasi_snapshot_preview1': asmLibraryArg,
  };
  // Load the wasm module and create an instance of using native support in the JS engine.
  // handle a generated wasm instance, receiving its exports and
  // performing other necessary setup
  /** @param {WebAssembly.Module=} module*/
  function receiveInstance(instance, module) {
    var exports = instance.exports;

    Module['asm'] = exports;

    wasmMemory = Module['asm']['memory'];
    updateGlobalBufferAndViews(wasmMemory.buffer);

    wasmTable = Module['asm']['__indirect_function_table'];

    addOnInit(Module['asm']['__wasm_call_ctors']);

    removeRunDependency('wasm-instantiate');
  }
  // we can't run yet (except in a pthread, where we have a custom sync instantiator)
  addRunDependency('wasm-instantiate');

  function receiveInstantiatedSource(output) {
    // 'output' is a WebAssemblyInstantiatedSource object which has both the module and instance.
    // receiveInstance() will swap in the exports (to Module.asm) so they can be called
    // TODO: Due to Closure regression https://github.com/google/closure-compiler/issues/3193, the above line no longer optimizes out down to the following line.
    // When the regression is fixed, can restore the above USE_PTHREADS-enabled path.
    receiveInstance(output['instance']);
  }

  function instantiateArrayBuffer(receiver) {
    return getBinaryPromise().then(function(binary) {
      var result = WebAssembly.instantiate(binary, info);
      return result;
    }).then(receiver, function(reason) {
      err('failed to asynchronously prepare wasm: ' + reason);

      abort(reason);
    });
  }

  // Prefer streaming instantiation if available.

  // User shell pages can write their own Module.instantiateWasm = function(imports, successCallback) callback
  // to manually instantiate the Wasm module themselves. This allows pages to run the instantiation parallel
  // to any other async startup actions they are performing.
  if (Module['instantiateWasm']) {
    try {
      var exports = Module['instantiateWasm'](info, receiveInstance);
      return exports;
    } catch(e) {
      err('Module.instantiateWasm callback failed with error: ' + e);
      return false;
    }
  }

  var result = instantiateSync(wasmBinaryFile, info);
  // TODO: Due to Closure regression https://github.com/google/closure-compiler/issues/3193,
  // the above line no longer optimizes out down to the following line.
  // When the regression is fixed, we can remove this if/else.
  receiveInstance(result[0]);
  return Module['asm']; // exports were assigned here
}

// Globals used by JS i64 conversions (see makeSetValue)
var tempDouble;
var tempI64;

// === Body ===

var ASM_CONSTS = {
  7652: function($0, $1, $2) {var msg = {}; msg.verb = Module.UTF8ToString($0); msg.prop = Module.UTF8ToString($1); msg.data = Module.UTF8ToString($2); Module.port.postMessage(msg);},  
 7808: function($0, $1, $2, $3) {var arr = new Uint8Array($3); arr.set(Module.HEAP8.subarray($2,$2+$3)); var msg = {}; msg.verb = Module.UTF8ToString($0); msg.prop = Module.UTF8ToString($1); msg.data = arr.buffer; Module.port.postMessage(msg);},  
 8023: function($0) {Module.print(UTF8ToString($0))},  
 8054: function($0) {Module.print($0)}
};






  function callRuntimeCallbacks(callbacks) {
      while (callbacks.length > 0) {
        var callback = callbacks.shift();
        if (typeof callback == 'function') {
          callback(Module); // Pass the module as the first argument.
          continue;
        }
        var func = callback.func;
        if (typeof func === 'number') {
          if (callback.arg === undefined) {
            wasmTable.get(func)();
          } else {
            wasmTable.get(func)(callback.arg);
          }
        } else {
          func(callback.arg === undefined ? null : callback.arg);
        }
      }
    }

  function demangle(func) {
      return func;
    }

  function demangleAll(text) {
      var regex =
        /\b_Z[\w\d_]+/g;
      return text.replace(regex,
        function(x) {
          var y = demangle(x);
          return x === y ? x : (y + ' [' + x + ']');
        });
    }

  function jsStackTrace() {
      var error = new Error();
      if (!error.stack) {
        // IE10+ special cases: It does have callstack info, but it is only populated if an Error object is thrown,
        // so try that as a special-case.
        try {
          throw new Error();
        } catch(e) {
          error = e;
        }
        if (!error.stack) {
          return '(no stack trace available)';
        }
      }
      return error.stack.toString();
    }

  var runtimeKeepaliveCounter=0;
  function keepRuntimeAlive() {
      return noExitRuntime || runtimeKeepaliveCounter > 0;
    }

  function stackTrace() {
      var js = jsStackTrace();
      if (Module['extraStackTrace']) js += '\n' + Module['extraStackTrace']();
      return demangleAll(js);
    }

  function _atexit(func, arg) {
    }
  function ___cxa_atexit(a0,a1
  ) {
  return _atexit(a0,a1);
  }

  function _gmtime_r(time, tmPtr) {
      var date = new Date(HEAP32[((time)>>2)]*1000);
      HEAP32[((tmPtr)>>2)] = date.getUTCSeconds();
      HEAP32[(((tmPtr)+(4))>>2)] = date.getUTCMinutes();
      HEAP32[(((tmPtr)+(8))>>2)] = date.getUTCHours();
      HEAP32[(((tmPtr)+(12))>>2)] = date.getUTCDate();
      HEAP32[(((tmPtr)+(16))>>2)] = date.getUTCMonth();
      HEAP32[(((tmPtr)+(20))>>2)] = date.getUTCFullYear()-1900;
      HEAP32[(((tmPtr)+(24))>>2)] = date.getUTCDay();
      HEAP32[(((tmPtr)+(36))>>2)] = 0;
      HEAP32[(((tmPtr)+(32))>>2)] = 0;
      var start = Date.UTC(date.getUTCFullYear(), 0, 1, 0, 0, 0, 0);
      var yday = ((date.getTime() - start) / (1000 * 60 * 60 * 24))|0;
      HEAP32[(((tmPtr)+(28))>>2)] = yday;
      // Allocate a string "GMT" for us to point to.
      if (!_gmtime_r.GMTString) _gmtime_r.GMTString = allocateUTF8("GMT");
      HEAP32[(((tmPtr)+(40))>>2)] = _gmtime_r.GMTString;
      return tmPtr;
    }
  function ___gmtime_r(a0,a1
  ) {
  return _gmtime_r(a0,a1);
  }

  function _tzset() {
      // TODO: Use (malleable) environment variables instead of system settings.
      if (_tzset.called) return;
      _tzset.called = true;
  
      var currentYear = new Date().getFullYear();
      var winter = new Date(currentYear, 0, 1);
      var summer = new Date(currentYear, 6, 1);
      var winterOffset = winter.getTimezoneOffset();
      var summerOffset = summer.getTimezoneOffset();
  
      // Local standard timezone offset. Local standard time is not adjusted for daylight savings.
      // This code uses the fact that getTimezoneOffset returns a greater value during Standard Time versus Daylight Saving Time (DST). 
      // Thus it determines the expected output during Standard Time, and it compares whether the output of the given date the same (Standard) or less (DST).
      var stdTimezoneOffset = Math.max(winterOffset, summerOffset);
  
      // timezone is specified as seconds west of UTC ("The external variable
      // `timezone` shall be set to the difference, in seconds, between
      // Coordinated Universal Time (UTC) and local standard time."), the same
      // as returned by stdTimezoneOffset.
      // See http://pubs.opengroup.org/onlinepubs/009695399/functions/tzset.html
      HEAP32[((__get_timezone())>>2)] = stdTimezoneOffset * 60;
  
      HEAP32[((__get_daylight())>>2)] = Number(winterOffset != summerOffset);
  
      function extractZone(date) {
        var match = date.toTimeString().match(/\(([A-Za-z ]+)\)$/);
        return match ? match[1] : "GMT";
      };
      var winterName = extractZone(winter);
      var summerName = extractZone(summer);
      var winterNamePtr = allocateUTF8(winterName);
      var summerNamePtr = allocateUTF8(summerName);
      if (summerOffset < winterOffset) {
        // Northern hemisphere
        HEAP32[((__get_tzname())>>2)] = winterNamePtr;
        HEAP32[(((__get_tzname())+(4))>>2)] = summerNamePtr;
      } else {
        HEAP32[((__get_tzname())>>2)] = summerNamePtr;
        HEAP32[(((__get_tzname())+(4))>>2)] = winterNamePtr;
      }
    }
  function _localtime_r(time, tmPtr) {
      _tzset();
      var date = new Date(HEAP32[((time)>>2)]*1000);
      HEAP32[((tmPtr)>>2)] = date.getSeconds();
      HEAP32[(((tmPtr)+(4))>>2)] = date.getMinutes();
      HEAP32[(((tmPtr)+(8))>>2)] = date.getHours();
      HEAP32[(((tmPtr)+(12))>>2)] = date.getDate();
      HEAP32[(((tmPtr)+(16))>>2)] = date.getMonth();
      HEAP32[(((tmPtr)+(20))>>2)] = date.getFullYear()-1900;
      HEAP32[(((tmPtr)+(24))>>2)] = date.getDay();
  
      var start = new Date(date.getFullYear(), 0, 1);
      var yday = ((date.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))|0;
      HEAP32[(((tmPtr)+(28))>>2)] = yday;
      HEAP32[(((tmPtr)+(36))>>2)] = -(date.getTimezoneOffset() * 60);
  
      // Attention: DST is in December in South, and some regions don't have DST at all.
      var summerOffset = new Date(date.getFullYear(), 6, 1).getTimezoneOffset();
      var winterOffset = start.getTimezoneOffset();
      var dst = (summerOffset != winterOffset && date.getTimezoneOffset() == Math.min(winterOffset, summerOffset))|0;
      HEAP32[(((tmPtr)+(32))>>2)] = dst;
  
      var zonePtr = HEAP32[(((__get_tzname())+(dst ? 4 : 0))>>2)];
      HEAP32[(((tmPtr)+(40))>>2)] = zonePtr;
  
      return tmPtr;
    }
  function ___localtime_r(a0,a1
  ) {
  return _localtime_r(a0,a1);
  }

  function getShiftFromSize(size) {
      switch (size) {
          case 1: return 0;
          case 2: return 1;
          case 4: return 2;
          case 8: return 3;
          default:
              throw new TypeError('Unknown type size: ' + size);
      }
    }
  
  function embind_init_charCodes() {
      var codes = new Array(256);
      for (var i = 0; i < 256; ++i) {
          codes[i] = String.fromCharCode(i);
      }
      embind_charCodes = codes;
    }
  var embind_charCodes=undefined;
  function readLatin1String(ptr) {
      var ret = "";
      var c = ptr;
      while (HEAPU8[c]) {
          ret += embind_charCodes[HEAPU8[c++]];
      }
      return ret;
    }
  
  var awaitingDependencies={};
  
  var registeredTypes={};
  
  var typeDependencies={};
  
  var char_0=48;
  
  var char_9=57;
  function makeLegalFunctionName(name) {
      if (undefined === name) {
          return '_unknown';
      }
      name = name.replace(/[^a-zA-Z0-9_]/g, '$');
      var f = name.charCodeAt(0);
      if (f >= char_0 && f <= char_9) {
          return '_' + name;
      } else {
          return name;
      }
    }
  function createNamedFunction(name, body) {
      name = makeLegalFunctionName(name);
      /*jshint evil:true*/
      return new Function(
          "body",
          "return function " + name + "() {\n" +
          "    \"use strict\";" +
          "    return body.apply(this, arguments);\n" +
          "};\n"
      )(body);
    }
  function extendError(baseErrorType, errorName) {
      var errorClass = createNamedFunction(errorName, function(message) {
          this.name = errorName;
          this.message = message;
  
          var stack = (new Error(message)).stack;
          if (stack !== undefined) {
              this.stack = this.toString() + '\n' +
                  stack.replace(/^Error(:[^\n]*)?\n/, '');
          }
      });
      errorClass.prototype = Object.create(baseErrorType.prototype);
      errorClass.prototype.constructor = errorClass;
      errorClass.prototype.toString = function() {
          if (this.message === undefined) {
              return this.name;
          } else {
              return this.name + ': ' + this.message;
          }
      };
  
      return errorClass;
    }
  var BindingError=undefined;
  function throwBindingError(message) {
      throw new BindingError(message);
    }
  
  var InternalError=undefined;
  function throwInternalError(message) {
      throw new InternalError(message);
    }
  function whenDependentTypesAreResolved(myTypes, dependentTypes, getTypeConverters) {
      myTypes.forEach(function(type) {
          typeDependencies[type] = dependentTypes;
      });
  
      function onComplete(typeConverters) {
          var myTypeConverters = getTypeConverters(typeConverters);
          if (myTypeConverters.length !== myTypes.length) {
              throwInternalError('Mismatched type converter count');
          }
          for (var i = 0; i < myTypes.length; ++i) {
              registerType(myTypes[i], myTypeConverters[i]);
          }
      }
  
      var typeConverters = new Array(dependentTypes.length);
      var unregisteredTypes = [];
      var registered = 0;
      dependentTypes.forEach(function(dt, i) {
          if (registeredTypes.hasOwnProperty(dt)) {
              typeConverters[i] = registeredTypes[dt];
          } else {
              unregisteredTypes.push(dt);
              if (!awaitingDependencies.hasOwnProperty(dt)) {
                  awaitingDependencies[dt] = [];
              }
              awaitingDependencies[dt].push(function() {
                  typeConverters[i] = registeredTypes[dt];
                  ++registered;
                  if (registered === unregisteredTypes.length) {
                      onComplete(typeConverters);
                  }
              });
          }
      });
      if (0 === unregisteredTypes.length) {
          onComplete(typeConverters);
      }
    }
  /** @param {Object=} options */
  function registerType(rawType, registeredInstance, options) {
      options = options || {};
  
      if (!('argPackAdvance' in registeredInstance)) {
          throw new TypeError('registerType registeredInstance requires argPackAdvance');
      }
  
      var name = registeredInstance.name;
      if (!rawType) {
          throwBindingError('type "' + name + '" must have a positive integer typeid pointer');
      }
      if (registeredTypes.hasOwnProperty(rawType)) {
          if (options.ignoreDuplicateRegistrations) {
              return;
          } else {
              throwBindingError("Cannot register type '" + name + "' twice");
          }
      }
  
      registeredTypes[rawType] = registeredInstance;
      delete typeDependencies[rawType];
  
      if (awaitingDependencies.hasOwnProperty(rawType)) {
          var callbacks = awaitingDependencies[rawType];
          delete awaitingDependencies[rawType];
          callbacks.forEach(function(cb) {
              cb();
          });
      }
    }
  function __embind_register_bool(rawType, name, size, trueValue, falseValue) {
      var shift = getShiftFromSize(size);
  
      name = readLatin1String(name);
      registerType(rawType, {
          name: name,
          'fromWireType': function(wt) {
              // ambiguous emscripten ABI: sometimes return values are
              // true or false, and sometimes integers (0 or 1)
              return !!wt;
          },
          'toWireType': function(destructors, o) {
              return o ? trueValue : falseValue;
          },
          'argPackAdvance': 8,
          'readValueFromPointer': function(pointer) {
              // TODO: if heap is fixed (like in asm.js) this could be executed outside
              var heap;
              if (size === 1) {
                  heap = HEAP8;
              } else if (size === 2) {
                  heap = HEAP16;
              } else if (size === 4) {
                  heap = HEAP32;
              } else {
                  throw new TypeError("Unknown boolean type size: " + name);
              }
              return this['fromWireType'](heap[pointer >> shift]);
          },
          destructorFunction: null, // This type does not need a destructor
      });
    }

  var emval_free_list=[];
  
  var emval_handle_array=[{},{value:undefined},{value:null},{value:true},{value:false}];
  function __emval_decref(handle) {
      if (handle > 4 && 0 === --emval_handle_array[handle].refcount) {
          emval_handle_array[handle] = undefined;
          emval_free_list.push(handle);
      }
    }
  
  function count_emval_handles() {
      var count = 0;
      for (var i = 5; i < emval_handle_array.length; ++i) {
          if (emval_handle_array[i] !== undefined) {
              ++count;
          }
      }
      return count;
    }
  
  function get_first_emval() {
      for (var i = 5; i < emval_handle_array.length; ++i) {
          if (emval_handle_array[i] !== undefined) {
              return emval_handle_array[i];
          }
      }
      return null;
    }
  function init_emval() {
      Module['count_emval_handles'] = count_emval_handles;
      Module['get_first_emval'] = get_first_emval;
    }
  function __emval_register(value) {
      switch (value) {
        case undefined :{ return 1; }
        case null :{ return 2; }
        case true :{ return 3; }
        case false :{ return 4; }
        default:{
          var handle = emval_free_list.length ?
              emval_free_list.pop() :
              emval_handle_array.length;
  
          emval_handle_array[handle] = {refcount: 1, value: value};
          return handle;
          }
        }
    }
  
  function simpleReadValueFromPointer(pointer) {
      return this['fromWireType'](HEAPU32[pointer >> 2]);
    }
  function __embind_register_emval(rawType, name) {
      name = readLatin1String(name);
      registerType(rawType, {
          name: name,
          'fromWireType': function(handle) {
              var rv = emval_handle_array[handle].value;
              __emval_decref(handle);
              return rv;
          },
          'toWireType': function(destructors, value) {
              return __emval_register(value);
          },
          'argPackAdvance': 8,
          'readValueFromPointer': simpleReadValueFromPointer,
          destructorFunction: null, // This type does not need a destructor
  
          // TODO: do we need a deleteObject here?  write a test where
          // emval is passed into JS via an interface
      });
    }

  function _embind_repr(v) {
      if (v === null) {
          return 'null';
      }
      var t = typeof v;
      if (t === 'object' || t === 'array' || t === 'function') {
          return v.toString();
      } else {
          return '' + v;
      }
    }
  
  function floatReadValueFromPointer(name, shift) {
      switch (shift) {
          case 2: return function(pointer) {
              return this['fromWireType'](HEAPF32[pointer >> 2]);
          };
          case 3: return function(pointer) {
              return this['fromWireType'](HEAPF64[pointer >> 3]);
          };
          default:
              throw new TypeError("Unknown float type: " + name);
      }
    }
  function __embind_register_float(rawType, name, size) {
      var shift = getShiftFromSize(size);
      name = readLatin1String(name);
      registerType(rawType, {
          name: name,
          'fromWireType': function(value) {
              return value;
          },
          'toWireType': function(destructors, value) {
              // todo: Here we have an opportunity for -O3 level "unsafe" optimizations: we could
              // avoid the following if() and assume value is of proper type.
              if (typeof value !== "number" && typeof value !== "boolean") {
                  throw new TypeError('Cannot convert "' + _embind_repr(value) + '" to ' + this.name);
              }
              return value;
          },
          'argPackAdvance': 8,
          'readValueFromPointer': floatReadValueFromPointer(name, shift),
          destructorFunction: null, // This type does not need a destructor
      });
    }

  function integerReadValueFromPointer(name, shift, signed) {
      // integers are quite common, so generate very specialized functions
      switch (shift) {
          case 0: return signed ?
              function readS8FromPointer(pointer) { return HEAP8[pointer]; } :
              function readU8FromPointer(pointer) { return HEAPU8[pointer]; };
          case 1: return signed ?
              function readS16FromPointer(pointer) { return HEAP16[pointer >> 1]; } :
              function readU16FromPointer(pointer) { return HEAPU16[pointer >> 1]; };
          case 2: return signed ?
              function readS32FromPointer(pointer) { return HEAP32[pointer >> 2]; } :
              function readU32FromPointer(pointer) { return HEAPU32[pointer >> 2]; };
          default:
              throw new TypeError("Unknown integer type: " + name);
      }
    }
  function __embind_register_integer(primitiveType, name, size, minRange, maxRange) {
      name = readLatin1String(name);
      if (maxRange === -1) { // LLVM doesn't have signed and unsigned 32-bit types, so u32 literals come out as 'i32 -1'. Always treat those as max u32.
          maxRange = 4294967295;
      }
  
      var shift = getShiftFromSize(size);
  
      var fromWireType = function(value) {
          return value;
      };
  
      if (minRange === 0) {
          var bitshift = 32 - 8*size;
          fromWireType = function(value) {
              return (value << bitshift) >>> bitshift;
          };
      }
  
      var isUnsignedType = (name.indexOf('unsigned') != -1);
  
      registerType(primitiveType, {
          name: name,
          'fromWireType': fromWireType,
          'toWireType': function(destructors, value) {
              // todo: Here we have an opportunity for -O3 level "unsafe" optimizations: we could
              // avoid the following two if()s and assume value is of proper type.
              if (typeof value !== "number" && typeof value !== "boolean") {
                  throw new TypeError('Cannot convert "' + _embind_repr(value) + '" to ' + this.name);
              }
              if (value < minRange || value > maxRange) {
                  throw new TypeError('Passing a number "' + _embind_repr(value) + '" from JS side to C/C++ side to an argument of type "' + name + '", which is outside the valid range [' + minRange + ', ' + maxRange + ']!');
              }
              return isUnsignedType ? (value >>> 0) : (value | 0);
          },
          'argPackAdvance': 8,
          'readValueFromPointer': integerReadValueFromPointer(name, shift, minRange !== 0),
          destructorFunction: null, // This type does not need a destructor
      });
    }

  function __embind_register_memory_view(rawType, dataTypeIndex, name) {
      var typeMapping = [
          Int8Array,
          Uint8Array,
          Int16Array,
          Uint16Array,
          Int32Array,
          Uint32Array,
          Float32Array,
          Float64Array,
      ];
  
      var TA = typeMapping[dataTypeIndex];
  
      function decodeMemoryView(handle) {
          handle = handle >> 2;
          var heap = HEAPU32;
          var size = heap[handle]; // in elements
          var data = heap[handle + 1]; // byte offset into emscripten heap
          return new TA(buffer, data, size);
      }
  
      name = readLatin1String(name);
      registerType(rawType, {
          name: name,
          'fromWireType': decodeMemoryView,
          'argPackAdvance': 8,
          'readValueFromPointer': decodeMemoryView,
      }, {
          ignoreDuplicateRegistrations: true,
      });
    }

  function __embind_register_std_string(rawType, name) {
      name = readLatin1String(name);
      var stdStringIsUTF8
      //process only std::string bindings with UTF8 support, in contrast to e.g. std::basic_string<unsigned char>
      = (name === "std::string");
  
      registerType(rawType, {
          name: name,
          'fromWireType': function(value) {
              var length = HEAPU32[value >> 2];
  
              var str;
              if (stdStringIsUTF8) {
                  var decodeStartPtr = value + 4;
                  // Looping here to support possible embedded '0' bytes
                  for (var i = 0; i <= length; ++i) {
                      var currentBytePtr = value + 4 + i;
                      if (i == length || HEAPU8[currentBytePtr] == 0) {
                          var maxRead = currentBytePtr - decodeStartPtr;
                          var stringSegment = UTF8ToString(decodeStartPtr, maxRead);
                          if (str === undefined) {
                              str = stringSegment;
                          } else {
                              str += String.fromCharCode(0);
                              str += stringSegment;
                          }
                          decodeStartPtr = currentBytePtr + 1;
                      }
                  }
              } else {
                  var a = new Array(length);
                  for (var i = 0; i < length; ++i) {
                      a[i] = String.fromCharCode(HEAPU8[value + 4 + i]);
                  }
                  str = a.join('');
              }
  
              _free(value);
  
              return str;
          },
          'toWireType': function(destructors, value) {
              if (value instanceof ArrayBuffer) {
                  value = new Uint8Array(value);
              }
  
              var getLength;
              var valueIsOfTypeString = (typeof value === 'string');
  
              if (!(valueIsOfTypeString || value instanceof Uint8Array || value instanceof Uint8ClampedArray || value instanceof Int8Array)) {
                  throwBindingError('Cannot pass non-string to std::string');
              }
              if (stdStringIsUTF8 && valueIsOfTypeString) {
                  getLength = function() {return lengthBytesUTF8(value);};
              } else {
                  getLength = function() {return value.length;};
              }
  
              // assumes 4-byte alignment
              var length = getLength();
              var ptr = _malloc(4 + length + 1);
              HEAPU32[ptr >> 2] = length;
              if (stdStringIsUTF8 && valueIsOfTypeString) {
                  stringToUTF8(value, ptr + 4, length + 1);
              } else {
                  if (valueIsOfTypeString) {
                      for (var i = 0; i < length; ++i) {
                          var charCode = value.charCodeAt(i);
                          if (charCode > 255) {
                              _free(ptr);
                              throwBindingError('String has UTF-16 code units that do not fit in 8 bits');
                          }
                          HEAPU8[ptr + 4 + i] = charCode;
                      }
                  } else {
                      for (var i = 0; i < length; ++i) {
                          HEAPU8[ptr + 4 + i] = value[i];
                      }
                  }
              }
  
              if (destructors !== null) {
                  destructors.push(_free, ptr);
              }
              return ptr;
          },
          'argPackAdvance': 8,
          'readValueFromPointer': simpleReadValueFromPointer,
          destructorFunction: function(ptr) { _free(ptr); },
      });
    }

  function __embind_register_std_wstring(rawType, charSize, name) {
      name = readLatin1String(name);
      var decodeString, encodeString, getHeap, lengthBytesUTF, shift;
      if (charSize === 2) {
          decodeString = UTF16ToString;
          encodeString = stringToUTF16;
          lengthBytesUTF = lengthBytesUTF16;
          getHeap = function() { return HEAPU16; };
          shift = 1;
      } else if (charSize === 4) {
          decodeString = UTF32ToString;
          encodeString = stringToUTF32;
          lengthBytesUTF = lengthBytesUTF32;
          getHeap = function() { return HEAPU32; };
          shift = 2;
      }
      registerType(rawType, {
          name: name,
          'fromWireType': function(value) {
              // Code mostly taken from _embind_register_std_string fromWireType
              var length = HEAPU32[value >> 2];
              var HEAP = getHeap();
              var str;
  
              var decodeStartPtr = value + 4;
              // Looping here to support possible embedded '0' bytes
              for (var i = 0; i <= length; ++i) {
                  var currentBytePtr = value + 4 + i * charSize;
                  if (i == length || HEAP[currentBytePtr >> shift] == 0) {
                      var maxReadBytes = currentBytePtr - decodeStartPtr;
                      var stringSegment = decodeString(decodeStartPtr, maxReadBytes);
                      if (str === undefined) {
                          str = stringSegment;
                      } else {
                          str += String.fromCharCode(0);
                          str += stringSegment;
                      }
                      decodeStartPtr = currentBytePtr + charSize;
                  }
              }
  
              _free(value);
  
              return str;
          },
          'toWireType': function(destructors, value) {
              if (!(typeof value === 'string')) {
                  throwBindingError('Cannot pass non-string to C++ string type ' + name);
              }
  
              // assumes 4-byte alignment
              var length = lengthBytesUTF(value);
              var ptr = _malloc(4 + length + charSize);
              HEAPU32[ptr >> 2] = length >> shift;
  
              encodeString(value, ptr + 4, length + charSize);
  
              if (destructors !== null) {
                  destructors.push(_free, ptr);
              }
              return ptr;
          },
          'argPackAdvance': 8,
          'readValueFromPointer': simpleReadValueFromPointer,
          destructorFunction: function(ptr) { _free(ptr); },
      });
    }

  function __embind_register_void(rawType, name) {
      name = readLatin1String(name);
      registerType(rawType, {
          isVoid: true, // void return values can be optimized out sometimes
          name: name,
          'argPackAdvance': 0,
          'fromWireType': function() {
              return undefined;
          },
          'toWireType': function(destructors, o) {
              // TODO: assert if anything else is given?
              return undefined;
          },
      });
    }

  function _abort() {
      abort();
    }

  function _emscripten_asm_const_int(code, sigPtr, argbuf) {
      var args = readAsmConstArgs(sigPtr, argbuf);
      return ASM_CONSTS[code].apply(null, args);
    }

  function _emscripten_memcpy_big(dest, src, num) {
      HEAPU8.copyWithin(dest, src, src + num);
    }

  function emscripten_realloc_buffer(size) {
      try {
        // round size grow request up to wasm page size (fixed 64KB per spec)
        wasmMemory.grow((size - buffer.byteLength + 65535) >>> 16); // .grow() takes a delta compared to the previous size
        updateGlobalBufferAndViews(wasmMemory.buffer);
        return 1 /*success*/;
      } catch(e) {
      }
      // implicit 0 return to save code size (caller will cast "undefined" into 0
      // anyhow)
    }
  function _emscripten_resize_heap(requestedSize) {
      var oldSize = HEAPU8.length;
      // With pthreads, races can happen (another thread might increase the size in between), so return a failure, and let the caller retry.
  
      // Memory resize rules:
      // 1. Always increase heap size to at least the requested size, rounded up to next page multiple.
      // 2a. If MEMORY_GROWTH_LINEAR_STEP == -1, excessively resize the heap geometrically: increase the heap size according to 
      //                                         MEMORY_GROWTH_GEOMETRIC_STEP factor (default +20%),
      //                                         At most overreserve by MEMORY_GROWTH_GEOMETRIC_CAP bytes (default 96MB).
      // 2b. If MEMORY_GROWTH_LINEAR_STEP != -1, excessively resize the heap linearly: increase the heap size by at least MEMORY_GROWTH_LINEAR_STEP bytes.
      // 3. Max size for the heap is capped at 2048MB-WASM_PAGE_SIZE, or by MAXIMUM_MEMORY, or by ASAN limit, depending on which is smallest
      // 4. If we were unable to allocate as much memory, it may be due to over-eager decision to excessively reserve due to (3) above.
      //    Hence if an allocation fails, cut down on the amount of excess growth, in an attempt to succeed to perform a smaller allocation.
  
      // A limit was set for how much we can grow. We should not exceed that
      // (the wasm binary specifies it, so if we tried, we'd fail anyhow).
      // In CAN_ADDRESS_2GB mode, stay one Wasm page short of 4GB: while e.g. Chrome is able to allocate full 4GB Wasm memories, the size will wrap
      // back to 0 bytes in Wasm side for any code that deals with heap sizes, which would require special casing all heap size related code to treat
      // 0 specially.
      var maxHeapSize = 2147483648;
      if (requestedSize > maxHeapSize) {
        return false;
      }
  
      // Loop through potential heap size increases. If we attempt a too eager reservation that fails, cut down on the
      // attempted size and reserve a smaller bump instead. (max 3 times, chosen somewhat arbitrarily)
      for (var cutDown = 1; cutDown <= 4; cutDown *= 2) {
        var overGrownHeapSize = oldSize * (1 + 0.2 / cutDown); // ensure geometric growth
        // but limit overreserving (default to capping at +96MB overgrowth at most)
        overGrownHeapSize = Math.min(overGrownHeapSize, requestedSize + 100663296 );
  
        var newSize = Math.min(maxHeapSize, alignUp(Math.max(requestedSize, overGrownHeapSize), 65536));
  
        var replacement = emscripten_realloc_buffer(newSize);
        if (replacement) {
  
          return true;
        }
      }
      return false;
    }

  function __isLeapYear(year) {
        return year%4 === 0 && (year%100 !== 0 || year%400 === 0);
    }
  
  function __arraySum(array, index) {
      var sum = 0;
      for (var i = 0; i <= index; sum += array[i++]) {
        // no-op
      }
      return sum;
    }
  
  var __MONTH_DAYS_LEAP=[31,29,31,30,31,30,31,31,30,31,30,31];
  
  var __MONTH_DAYS_REGULAR=[31,28,31,30,31,30,31,31,30,31,30,31];
  function __addDays(date, days) {
      var newDate = new Date(date.getTime());
      while (days > 0) {
        var leap = __isLeapYear(newDate.getFullYear());
        var currentMonth = newDate.getMonth();
        var daysInCurrentMonth = (leap ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR)[currentMonth];
  
        if (days > daysInCurrentMonth-newDate.getDate()) {
          // we spill over to next month
          days -= (daysInCurrentMonth-newDate.getDate()+1);
          newDate.setDate(1);
          if (currentMonth < 11) {
            newDate.setMonth(currentMonth+1)
          } else {
            newDate.setMonth(0);
            newDate.setFullYear(newDate.getFullYear()+1);
          }
        } else {
          // we stay in current month
          newDate.setDate(newDate.getDate()+days);
          return newDate;
        }
      }
  
      return newDate;
    }
  function _strftime(s, maxsize, format, tm) {
      // size_t strftime(char *restrict s, size_t maxsize, const char *restrict format, const struct tm *restrict timeptr);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/strftime.html
  
      var tm_zone = HEAP32[(((tm)+(40))>>2)];
  
      var date = {
        tm_sec: HEAP32[((tm)>>2)],
        tm_min: HEAP32[(((tm)+(4))>>2)],
        tm_hour: HEAP32[(((tm)+(8))>>2)],
        tm_mday: HEAP32[(((tm)+(12))>>2)],
        tm_mon: HEAP32[(((tm)+(16))>>2)],
        tm_year: HEAP32[(((tm)+(20))>>2)],
        tm_wday: HEAP32[(((tm)+(24))>>2)],
        tm_yday: HEAP32[(((tm)+(28))>>2)],
        tm_isdst: HEAP32[(((tm)+(32))>>2)],
        tm_gmtoff: HEAP32[(((tm)+(36))>>2)],
        tm_zone: tm_zone ? UTF8ToString(tm_zone) : ''
      };
  
      var pattern = UTF8ToString(format);
  
      // expand format
      var EXPANSION_RULES_1 = {
        '%c': '%a %b %d %H:%M:%S %Y',     // Replaced by the locale's appropriate date and time representation - e.g., Mon Aug  3 14:02:01 2013
        '%D': '%m/%d/%y',                 // Equivalent to %m / %d / %y
        '%F': '%Y-%m-%d',                 // Equivalent to %Y - %m - %d
        '%h': '%b',                       // Equivalent to %b
        '%r': '%I:%M:%S %p',              // Replaced by the time in a.m. and p.m. notation
        '%R': '%H:%M',                    // Replaced by the time in 24-hour notation
        '%T': '%H:%M:%S',                 // Replaced by the time
        '%x': '%m/%d/%y',                 // Replaced by the locale's appropriate date representation
        '%X': '%H:%M:%S',                 // Replaced by the locale's appropriate time representation
        // Modified Conversion Specifiers
        '%Ec': '%c',                      // Replaced by the locale's alternative appropriate date and time representation.
        '%EC': '%C',                      // Replaced by the name of the base year (period) in the locale's alternative representation.
        '%Ex': '%m/%d/%y',                // Replaced by the locale's alternative date representation.
        '%EX': '%H:%M:%S',                // Replaced by the locale's alternative time representation.
        '%Ey': '%y',                      // Replaced by the offset from %EC (year only) in the locale's alternative representation.
        '%EY': '%Y',                      // Replaced by the full alternative year representation.
        '%Od': '%d',                      // Replaced by the day of the month, using the locale's alternative numeric symbols, filled as needed with leading zeros if there is any alternative symbol for zero; otherwise, with leading <space> characters.
        '%Oe': '%e',                      // Replaced by the day of the month, using the locale's alternative numeric symbols, filled as needed with leading <space> characters.
        '%OH': '%H',                      // Replaced by the hour (24-hour clock) using the locale's alternative numeric symbols.
        '%OI': '%I',                      // Replaced by the hour (12-hour clock) using the locale's alternative numeric symbols.
        '%Om': '%m',                      // Replaced by the month using the locale's alternative numeric symbols.
        '%OM': '%M',                      // Replaced by the minutes using the locale's alternative numeric symbols.
        '%OS': '%S',                      // Replaced by the seconds using the locale's alternative numeric symbols.
        '%Ou': '%u',                      // Replaced by the weekday as a number in the locale's alternative representation (Monday=1).
        '%OU': '%U',                      // Replaced by the week number of the year (Sunday as the first day of the week, rules corresponding to %U ) using the locale's alternative numeric symbols.
        '%OV': '%V',                      // Replaced by the week number of the year (Monday as the first day of the week, rules corresponding to %V ) using the locale's alternative numeric symbols.
        '%Ow': '%w',                      // Replaced by the number of the weekday (Sunday=0) using the locale's alternative numeric symbols.
        '%OW': '%W',                      // Replaced by the week number of the year (Monday as the first day of the week) using the locale's alternative numeric symbols.
        '%Oy': '%y',                      // Replaced by the year (offset from %C ) using the locale's alternative numeric symbols.
      };
      for (var rule in EXPANSION_RULES_1) {
        pattern = pattern.replace(new RegExp(rule, 'g'), EXPANSION_RULES_1[rule]);
      }
  
      var WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
      function leadingSomething(value, digits, character) {
        var str = typeof value === 'number' ? value.toString() : (value || '');
        while (str.length < digits) {
          str = character[0]+str;
        }
        return str;
      }
  
      function leadingNulls(value, digits) {
        return leadingSomething(value, digits, '0');
      }
  
      function compareByDay(date1, date2) {
        function sgn(value) {
          return value < 0 ? -1 : (value > 0 ? 1 : 0);
        }
  
        var compare;
        if ((compare = sgn(date1.getFullYear()-date2.getFullYear())) === 0) {
          if ((compare = sgn(date1.getMonth()-date2.getMonth())) === 0) {
            compare = sgn(date1.getDate()-date2.getDate());
          }
        }
        return compare;
      }
  
      function getFirstWeekStartDate(janFourth) {
          switch (janFourth.getDay()) {
            case 0: // Sunday
              return new Date(janFourth.getFullYear()-1, 11, 29);
            case 1: // Monday
              return janFourth;
            case 2: // Tuesday
              return new Date(janFourth.getFullYear(), 0, 3);
            case 3: // Wednesday
              return new Date(janFourth.getFullYear(), 0, 2);
            case 4: // Thursday
              return new Date(janFourth.getFullYear(), 0, 1);
            case 5: // Friday
              return new Date(janFourth.getFullYear()-1, 11, 31);
            case 6: // Saturday
              return new Date(janFourth.getFullYear()-1, 11, 30);
          }
      }
  
      function getWeekBasedYear(date) {
          var thisDate = __addDays(new Date(date.tm_year+1900, 0, 1), date.tm_yday);
  
          var janFourthThisYear = new Date(thisDate.getFullYear(), 0, 4);
          var janFourthNextYear = new Date(thisDate.getFullYear()+1, 0, 4);
  
          var firstWeekStartThisYear = getFirstWeekStartDate(janFourthThisYear);
          var firstWeekStartNextYear = getFirstWeekStartDate(janFourthNextYear);
  
          if (compareByDay(firstWeekStartThisYear, thisDate) <= 0) {
            // this date is after the start of the first week of this year
            if (compareByDay(firstWeekStartNextYear, thisDate) <= 0) {
              return thisDate.getFullYear()+1;
            } else {
              return thisDate.getFullYear();
            }
          } else {
            return thisDate.getFullYear()-1;
          }
      }
  
      var EXPANSION_RULES_2 = {
        '%a': function(date) {
          return WEEKDAYS[date.tm_wday].substring(0,3);
        },
        '%A': function(date) {
          return WEEKDAYS[date.tm_wday];
        },
        '%b': function(date) {
          return MONTHS[date.tm_mon].substring(0,3);
        },
        '%B': function(date) {
          return MONTHS[date.tm_mon];
        },
        '%C': function(date) {
          var year = date.tm_year+1900;
          return leadingNulls((year/100)|0,2);
        },
        '%d': function(date) {
          return leadingNulls(date.tm_mday, 2);
        },
        '%e': function(date) {
          return leadingSomething(date.tm_mday, 2, ' ');
        },
        '%g': function(date) {
          // %g, %G, and %V give values according to the ISO 8601:2000 standard week-based year.
          // In this system, weeks begin on a Monday and week 1 of the year is the week that includes
          // January 4th, which is also the week that includes the first Thursday of the year, and
          // is also the first week that contains at least four days in the year.
          // If the first Monday of January is the 2nd, 3rd, or 4th, the preceding days are part of
          // the last week of the preceding year; thus, for Saturday 2nd January 1999,
          // %G is replaced by 1998 and %V is replaced by 53. If December 29th, 30th,
          // or 31st is a Monday, it and any following days are part of week 1 of the following year.
          // Thus, for Tuesday 30th December 1997, %G is replaced by 1998 and %V is replaced by 01.
  
          return getWeekBasedYear(date).toString().substring(2);
        },
        '%G': function(date) {
          return getWeekBasedYear(date);
        },
        '%H': function(date) {
          return leadingNulls(date.tm_hour, 2);
        },
        '%I': function(date) {
          var twelveHour = date.tm_hour;
          if (twelveHour == 0) twelveHour = 12;
          else if (twelveHour > 12) twelveHour -= 12;
          return leadingNulls(twelveHour, 2);
        },
        '%j': function(date) {
          // Day of the year (001-366)
          return leadingNulls(date.tm_mday+__arraySum(__isLeapYear(date.tm_year+1900) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, date.tm_mon-1), 3);
        },
        '%m': function(date) {
          return leadingNulls(date.tm_mon+1, 2);
        },
        '%M': function(date) {
          return leadingNulls(date.tm_min, 2);
        },
        '%n': function() {
          return '\n';
        },
        '%p': function(date) {
          if (date.tm_hour >= 0 && date.tm_hour < 12) {
            return 'AM';
          } else {
            return 'PM';
          }
        },
        '%S': function(date) {
          return leadingNulls(date.tm_sec, 2);
        },
        '%t': function() {
          return '\t';
        },
        '%u': function(date) {
          return date.tm_wday || 7;
        },
        '%U': function(date) {
          // Replaced by the week number of the year as a decimal number [00,53].
          // The first Sunday of January is the first day of week 1;
          // days in the new year before this are in week 0. [ tm_year, tm_wday, tm_yday]
          var janFirst = new Date(date.tm_year+1900, 0, 1);
          var firstSunday = janFirst.getDay() === 0 ? janFirst : __addDays(janFirst, 7-janFirst.getDay());
          var endDate = new Date(date.tm_year+1900, date.tm_mon, date.tm_mday);
  
          // is target date after the first Sunday?
          if (compareByDay(firstSunday, endDate) < 0) {
            // calculate difference in days between first Sunday and endDate
            var februaryFirstUntilEndMonth = __arraySum(__isLeapYear(endDate.getFullYear()) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, endDate.getMonth()-1)-31;
            var firstSundayUntilEndJanuary = 31-firstSunday.getDate();
            var days = firstSundayUntilEndJanuary+februaryFirstUntilEndMonth+endDate.getDate();
            return leadingNulls(Math.ceil(days/7), 2);
          }
  
          return compareByDay(firstSunday, janFirst) === 0 ? '01': '00';
        },
        '%V': function(date) {
          // Replaced by the week number of the year (Monday as the first day of the week)
          // as a decimal number [01,53]. If the week containing 1 January has four
          // or more days in the new year, then it is considered week 1.
          // Otherwise, it is the last week of the previous year, and the next week is week 1.
          // Both January 4th and the first Thursday of January are always in week 1. [ tm_year, tm_wday, tm_yday]
          var janFourthThisYear = new Date(date.tm_year+1900, 0, 4);
          var janFourthNextYear = new Date(date.tm_year+1901, 0, 4);
  
          var firstWeekStartThisYear = getFirstWeekStartDate(janFourthThisYear);
          var firstWeekStartNextYear = getFirstWeekStartDate(janFourthNextYear);
  
          var endDate = __addDays(new Date(date.tm_year+1900, 0, 1), date.tm_yday);
  
          if (compareByDay(endDate, firstWeekStartThisYear) < 0) {
            // if given date is before this years first week, then it belongs to the 53rd week of last year
            return '53';
          }
  
          if (compareByDay(firstWeekStartNextYear, endDate) <= 0) {
            // if given date is after next years first week, then it belongs to the 01th week of next year
            return '01';
          }
  
          // given date is in between CW 01..53 of this calendar year
          var daysDifference;
          if (firstWeekStartThisYear.getFullYear() < date.tm_year+1900) {
            // first CW of this year starts last year
            daysDifference = date.tm_yday+32-firstWeekStartThisYear.getDate()
          } else {
            // first CW of this year starts this year
            daysDifference = date.tm_yday+1-firstWeekStartThisYear.getDate();
          }
          return leadingNulls(Math.ceil(daysDifference/7), 2);
        },
        '%w': function(date) {
          return date.tm_wday;
        },
        '%W': function(date) {
          // Replaced by the week number of the year as a decimal number [00,53].
          // The first Monday of January is the first day of week 1;
          // days in the new year before this are in week 0. [ tm_year, tm_wday, tm_yday]
          var janFirst = new Date(date.tm_year, 0, 1);
          var firstMonday = janFirst.getDay() === 1 ? janFirst : __addDays(janFirst, janFirst.getDay() === 0 ? 1 : 7-janFirst.getDay()+1);
          var endDate = new Date(date.tm_year+1900, date.tm_mon, date.tm_mday);
  
          // is target date after the first Monday?
          if (compareByDay(firstMonday, endDate) < 0) {
            var februaryFirstUntilEndMonth = __arraySum(__isLeapYear(endDate.getFullYear()) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, endDate.getMonth()-1)-31;
            var firstMondayUntilEndJanuary = 31-firstMonday.getDate();
            var days = firstMondayUntilEndJanuary+februaryFirstUntilEndMonth+endDate.getDate();
            return leadingNulls(Math.ceil(days/7), 2);
          }
          return compareByDay(firstMonday, janFirst) === 0 ? '01': '00';
        },
        '%y': function(date) {
          // Replaced by the last two digits of the year as a decimal number [00,99]. [ tm_year]
          return (date.tm_year+1900).toString().substring(2);
        },
        '%Y': function(date) {
          // Replaced by the year as a decimal number (for example, 1997). [ tm_year]
          return date.tm_year+1900;
        },
        '%z': function(date) {
          // Replaced by the offset from UTC in the ISO 8601:2000 standard format ( +hhmm or -hhmm ).
          // For example, "-0430" means 4 hours 30 minutes behind UTC (west of Greenwich).
          var off = date.tm_gmtoff;
          var ahead = off >= 0;
          off = Math.abs(off) / 60;
          // convert from minutes into hhmm format (which means 60 minutes = 100 units)
          off = (off / 60)*100 + (off % 60);
          return (ahead ? '+' : '-') + String("0000" + off).slice(-4);
        },
        '%Z': function(date) {
          return date.tm_zone;
        },
        '%%': function() {
          return '%';
        }
      };
      for (var rule in EXPANSION_RULES_2) {
        if (pattern.indexOf(rule) >= 0) {
          pattern = pattern.replace(new RegExp(rule, 'g'), EXPANSION_RULES_2[rule](date));
        }
      }
  
      var bytes = intArrayFromString(pattern, false);
      if (bytes.length > maxsize) {
        return 0;
      }
  
      writeArrayToMemory(bytes, s);
      return bytes.length-1;
    }

  function _time(ptr) {
      var ret = (Date.now()/1000)|0;
      if (ptr) {
        HEAP32[((ptr)>>2)] = ret;
      }
      return ret;
    }

  var readAsmConstArgsArray=[];
  function readAsmConstArgs(sigPtr, buf) {
      readAsmConstArgsArray.length = 0;
      var ch;
      // Most arguments are i32s, so shift the buffer pointer so it is a plain
      // index into HEAP32.
      buf >>= 2;
      while (ch = HEAPU8[sigPtr++]) {
        // A double takes two 32-bit slots, and must also be aligned - the backend
        // will emit padding to avoid that.
        var double = ch < 105;
        if (double && (buf & 1)) buf++;
        readAsmConstArgsArray.push(double ? HEAPF64[buf++ >> 1] : HEAP32[buf]);
        ++buf;
      }
      return readAsmConstArgsArray;
    }
embind_init_charCodes();
BindingError = Module['BindingError'] = extendError(Error, 'BindingError');;
InternalError = Module['InternalError'] = extendError(Error, 'InternalError');;
init_emval();;
var ASSERTIONS = false;



/** @type {function(string, boolean=, number=)} */
function intArrayFromString(stringy, dontAddNull, length) {
  var len = length > 0 ? length : lengthBytesUTF8(stringy)+1;
  var u8array = new Array(len);
  var numBytesWritten = stringToUTF8Array(stringy, u8array, 0, u8array.length);
  if (dontAddNull) u8array.length = numBytesWritten;
  return u8array;
}

function intArrayToString(array) {
  var ret = [];
  for (var i = 0; i < array.length; i++) {
    var chr = array[i];
    if (chr > 0xFF) {
      if (ASSERTIONS) {
        assert(false, 'Character code ' + chr + ' (' + String.fromCharCode(chr) + ')  at offset ' + i + ' not in 0x00-0xFF.');
      }
      chr &= 0xFF;
    }
    ret.push(String.fromCharCode(chr));
  }
  return ret.join('');
}


// Copied from https://github.com/strophe/strophejs/blob/e06d027/src/polyfills.js#L149

// This code was written by Tyler Akins and has been placed in the
// public domain.  It would be nice if you left this header intact.
// Base64 code from Tyler Akins -- http://rumkin.com

/**
 * Decodes a base64 string.
 * @param {string} input The string to decode.
 */
var decodeBase64 = typeof atob === 'function' ? atob : function (input) {
  var keyStr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

  var output = '';
  var chr1, chr2, chr3;
  var enc1, enc2, enc3, enc4;
  var i = 0;
  // remove all characters that are not A-Z, a-z, 0-9, +, /, or =
  input = input.replace(/[^A-Za-z0-9\+\/\=]/g, '');
  do {
    enc1 = keyStr.indexOf(input.charAt(i++));
    enc2 = keyStr.indexOf(input.charAt(i++));
    enc3 = keyStr.indexOf(input.charAt(i++));
    enc4 = keyStr.indexOf(input.charAt(i++));

    chr1 = (enc1 << 2) | (enc2 >> 4);
    chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
    chr3 = ((enc3 & 3) << 6) | enc4;

    output = output + String.fromCharCode(chr1);

    if (enc3 !== 64) {
      output = output + String.fromCharCode(chr2);
    }
    if (enc4 !== 64) {
      output = output + String.fromCharCode(chr3);
    }
  } while (i < input.length);
  return output;
};

// Converts a string of base64 into a byte array.
// Throws error on invalid input.
function intArrayFromBase64(s) {
  if (typeof ENVIRONMENT_IS_NODE === 'boolean' && ENVIRONMENT_IS_NODE) {
    var buf;
    try {
      // TODO: Update Node.js externs, Closure does not recognize the following Buffer.from()
      /**@suppress{checkTypes}*/
      buf = Buffer.from(s, 'base64');
    } catch (_) {
      buf = new Buffer(s, 'base64');
    }
    return new Uint8Array(buf['buffer'], buf['byteOffset'], buf['byteLength']);
  }

  try {
    var decoded = decodeBase64(s);
    var bytes = new Uint8Array(decoded.length);
    for (var i = 0 ; i < decoded.length ; ++i) {
      bytes[i] = decoded.charCodeAt(i);
    }
    return bytes;
  } catch (_) {
    throw new Error('Converting base64 string to bytes failed.');
  }
}

// If filename is a base64 data URI, parses and returns data (Buffer on node,
// Uint8Array otherwise). If filename is not a base64 data URI, returns undefined.
function tryParseAsDataURI(filename) {
  if (!isDataURI(filename)) {
    return;
  }

  return intArrayFromBase64(filename.slice(dataURIPrefix.length));
}


var asmLibraryArg = {
  "__cxa_atexit": ___cxa_atexit,
  "__gmtime_r": ___gmtime_r,
  "__localtime_r": ___localtime_r,
  "_embind_register_bool": __embind_register_bool,
  "_embind_register_emval": __embind_register_emval,
  "_embind_register_float": __embind_register_float,
  "_embind_register_integer": __embind_register_integer,
  "_embind_register_memory_view": __embind_register_memory_view,
  "_embind_register_std_string": __embind_register_std_string,
  "_embind_register_std_wstring": __embind_register_std_wstring,
  "_embind_register_void": __embind_register_void,
  "abort": _abort,
  "emscripten_asm_const_int": _emscripten_asm_const_int,
  "emscripten_memcpy_big": _emscripten_memcpy_big,
  "emscripten_resize_heap": _emscripten_resize_heap,
  "strftime": _strftime,
  "time": _time
};
var asm = createWasm();
/** @type {function(...*):?} */
var ___wasm_call_ctors = Module["___wasm_call_ctors"] = asm["__wasm_call_ctors"]

/** @type {function(...*):?} */
var _free = Module["_free"] = asm["free"]

/** @type {function(...*):?} */
var _malloc = Module["_malloc"] = asm["malloc"]

/** @type {function(...*):?} */
var _createModule = Module["_createModule"] = asm["createModule"]

/** @type {function(...*):?} */
var __ZN3WAM9Processor4initEjjPv = Module["__ZN3WAM9Processor4initEjjPv"] = asm["_ZN3WAM9Processor4initEjjPv"]

/** @type {function(...*):?} */
var _wam_init = Module["_wam_init"] = asm["wam_init"]

/** @type {function(...*):?} */
var _wam_terminate = Module["_wam_terminate"] = asm["wam_terminate"]

/** @type {function(...*):?} */
var _wam_resize = Module["_wam_resize"] = asm["wam_resize"]

/** @type {function(...*):?} */
var _wam_onparam = Module["_wam_onparam"] = asm["wam_onparam"]

/** @type {function(...*):?} */
var _wam_onmidi = Module["_wam_onmidi"] = asm["wam_onmidi"]

/** @type {function(...*):?} */
var _wam_onsysex = Module["_wam_onsysex"] = asm["wam_onsysex"]

/** @type {function(...*):?} */
var _wam_onprocess = Module["_wam_onprocess"] = asm["wam_onprocess"]

/** @type {function(...*):?} */
var _wam_onpatch = Module["_wam_onpatch"] = asm["wam_onpatch"]

/** @type {function(...*):?} */
var _wam_onmessageN = Module["_wam_onmessageN"] = asm["wam_onmessageN"]

/** @type {function(...*):?} */
var _wam_onmessageS = Module["_wam_onmessageS"] = asm["wam_onmessageS"]

/** @type {function(...*):?} */
var _wam_onmessageA = Module["_wam_onmessageA"] = asm["wam_onmessageA"]

/** @type {function(...*):?} */
var ___getTypeName = Module["___getTypeName"] = asm["__getTypeName"]

/** @type {function(...*):?} */
var ___embind_register_native_and_builtin_types = Module["___embind_register_native_and_builtin_types"] = asm["__embind_register_native_and_builtin_types"]

/** @type {function(...*):?} */
var ___errno_location = Module["___errno_location"] = asm["__errno_location"]

/** @type {function(...*):?} */
var __get_tzname = Module["__get_tzname"] = asm["_get_tzname"]

/** @type {function(...*):?} */
var __get_daylight = Module["__get_daylight"] = asm["_get_daylight"]

/** @type {function(...*):?} */
var __get_timezone = Module["__get_timezone"] = asm["_get_timezone"]

/** @type {function(...*):?} */
var stackSave = Module["stackSave"] = asm["stackSave"]

/** @type {function(...*):?} */
var stackRestore = Module["stackRestore"] = asm["stackRestore"]

/** @type {function(...*):?} */
var stackAlloc = Module["stackAlloc"] = asm["stackAlloc"]





// === Auto-generated postamble setup entry stuff ===

Module["ccall"] = ccall;
Module["cwrap"] = cwrap;
Module["setValue"] = setValue;
Module["UTF8ToString"] = UTF8ToString;

var calledRun;

/**
 * @constructor
 * @this {ExitStatus}
 */
function ExitStatus(status) {
  this.name = "ExitStatus";
  this.message = "Program terminated with exit(" + status + ")";
  this.status = status;
}

var calledMain = false;

dependenciesFulfilled = function runCaller() {
  // If run has never been called, and we should call run (INVOKE_RUN is true, and Module.noInitialRun is not false)
  if (!calledRun) run();
  if (!calledRun) dependenciesFulfilled = runCaller; // try this again later, after new deps are fulfilled
};

/** @type {function(Array=)} */
function run(args) {
  args = args || arguments_;

  if (runDependencies > 0) {
    return;
  }

  preRun();

  // a preRun added a dependency, run will be called later
  if (runDependencies > 0) {
    return;
  }

  function doRun() {
    // run may have just been called through dependencies being fulfilled just in this very frame,
    // or while the async setStatus time below was happening
    if (calledRun) return;
    calledRun = true;
    Module['calledRun'] = true;

    if (ABORT) return;

    initRuntime();

    preMain();

    if (Module['onRuntimeInitialized']) Module['onRuntimeInitialized']();

    postRun();
  }

  if (Module['setStatus']) {
    Module['setStatus']('Running...');
    setTimeout(function() {
      setTimeout(function() {
        Module['setStatus']('');
      }, 1);
      doRun();
    }, 1);
  } else
  {
    doRun();
  }
}
Module['run'] = run;

/** @param {boolean|number=} implicit */
function exit(status, implicit) {
  EXITSTATUS = status;

  // if this is just main exit-ing implicitly, and the status is 0, then we
  // don't need to do anything here and can just leave. if the status is
  // non-zero, though, then we need to report it.
  // (we may have warned about this earlier, if a situation justifies doing so)
  if (implicit && keepRuntimeAlive() && status === 0) {
    return;
  }

  if (keepRuntimeAlive()) {
  } else {

    exitRuntime();

    if (Module['onExit']) Module['onExit'](status);

    ABORT = true;
  }

  quit_(status, new ExitStatus(status));
}

if (Module['preInit']) {
  if (typeof Module['preInit'] == 'function') Module['preInit'] = [Module['preInit']];
  while (Module['preInit'].length > 0) {
    Module['preInit'].pop()();
  }
}

run();





