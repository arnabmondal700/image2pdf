/**
 * Vitest Setup for Angular
 *
 * 1. Load Angular JIT compiler — required for TestBed to compile components and injectables at runtime.
 *    Without this, Angular CDK/Material injectables like `_CdkPrivateStyleLoader` trigger a
 *    "JIT compiler not available" error because Angular's JIT compiler isn't registered.
 *
 * 2. Load zone.js — Angular's change detection and async test utilities (fakeAsync, tick, etc.)
 *    depend on zone.js patches being installed before any Angular code runs.
 *
 * 3. Initialize Angular TestBed — configure the default testing module so that each test
 *    file can use TestBed.configureTestingModule() and TestBed.inject() without extra boilerplate.
 */

// 1. Register the JIT compiler
import '@angular/compiler';

// 2. Load zone.js and its testing patches
import 'zone.js';
import 'zone.js/testing';

// 3. Initialize the Angular testing environment
import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';

getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting(),
  { teardown: { destroyAfterEach: true } }
);