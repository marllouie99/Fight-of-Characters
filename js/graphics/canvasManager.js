import { state } from '../core/state.js';

// FLAME CANVAS SYSTEM (Performance Optimization)

let _flameCanvas = null;
let _flameCtx = null;
let _flameCanvasInitialized = false;
let _flameCanvasDirty = false;

export function initFlameCanvas() {
  if (_flameCanvasInitialized) return;
  _flameCanvas = document.createElement('canvas');
  _flameCtx = _flameCanvas.getContext('2d');
  _flameCanvas.width = state.canvas.width;
  _flameCanvas.height = state.canvas.height;
  _flameCanvasInitialized = true;
  _flameCanvasDirty = false;
}

export function resizeFlameCanvas() {
  if (!_flameCanvasInitialized) initFlameCanvas();
  if (_flameCanvas.width !== state.canvas.width || _flameCanvas.height !== state.canvas.height) {
    _flameCanvas.width = state.canvas.width;
    _flameCanvas.height = state.canvas.height;
    _flameCanvasDirty = false;
  }
}

export function getFlameCanvas() {
  if (!_flameCanvasInitialized) initFlameCanvas();
  _flameCanvasDirty = true;
  return { canvas: _flameCanvas, ctx: _flameCtx };
}

export function clearFlameCanvas() {
  if (!_flameCanvasInitialized || !_flameCanvasDirty) return;
  _flameCtx.clearRect(0, 0, _flameCanvas.width, _flameCanvas.height);
  _flameCanvasDirty = false;
}

export function drawFlamesToCanvas(flames) {
  if (!_flameCanvasInitialized) initFlameCanvas();
  if (_flameCanvasDirty) {
    _flameCtx.clearRect(0, 0, _flameCanvas.width, _flameCanvas.height);
    _flameCanvasDirty = false;
  }
  return;
}

export function compositeFlameCanvas() {
  if (!_flameCanvasInitialized || !_flameCanvas || !_flameCanvasDirty) return;
  state.ctx.drawImage(_flameCanvas, 0, 0);
}
