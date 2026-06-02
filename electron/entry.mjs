/**
 * ESM entry point for Electron.
 *
 * Deletes ELECTRON_RUN_AS_NODE before loading the CJS main bundle.
 * This variable (if present, even as empty string) causes Electron to run as
 * plain Node.js, stripping all electron built-in APIs.
 */
import { createRequire } from 'node:module';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const req = createRequire(import.meta.url);

// Remove ELECTRON_RUN_AS_NODE so Electron's built-in module system works.
// Electron checks for the EXISTENCE of this variable, not its value.
delete process.env.ELECTRON_RUN_AS_NODE;

// Load the CJS main bundle. require('electron') will now work correctly.
req('./main.js');
