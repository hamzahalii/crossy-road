/**
 * Simple object pool for mesh recycling.
 * Avoids GC pressure from creating/destroying Three.js objects each frame.
 */
export class ObjectPool {
  constructor(factory, initialSize = 10) {
    this._factory = factory;
    this._pool = [];
    this._active = new Set();
    for (let i = 0; i < initialSize; i++) {
      this._pool.push(this._factory());
    }
  }

  get() {
    let obj = this._pool.pop();
    if (!obj) {
      obj = this._factory();
    }
    this._active.add(obj);
    return obj;
  }

  release(obj) {
    if (this._active.has(obj)) {
      this._active.delete(obj);
      // Reset visibility
      if (obj.visible !== undefined) obj.visible = false;
      this._pool.push(obj);
    }
  }

  releaseAll() {
    for (const obj of this._active) {
      if (obj.visible !== undefined) obj.visible = false;
      this._pool.push(obj);
    }
    this._active.clear();
  }

  get activeCount() {
    return this._active.size;
  }
}

