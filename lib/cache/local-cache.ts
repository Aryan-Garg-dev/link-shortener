type Loader<T> = () => Promise<T | null>;

class Node<T> {
  key: string;
  value: T;
  expiresAt: number;
  staleUntil: number;
  prev: Node<T> | null = null;
  next: Node<T> | null = null;

  constructor(key: string, value: T, expiresAt: number, staleUntil: number) {
    this.key = key;
    this.value = value;
    this.expiresAt = expiresAt;
    this.staleUntil = staleUntil;
  }
}

export class LocalCache<T = any> {
  private map = new Map<string, Node<T>>();
  private inflight = new Map<string, Promise<T | null>>();

  private head: Node<T> | null = null; // MRU
  private tail: Node<T> | null = null; // LRU

  private capacity: number;
  private ttl: number;
  private staleTtl: number;

  private hits = 0;
  private misses = 0;

  constructor(opts?: {
    capacity?: number;
    ttl?: number;       // fresh TTL (seconds)
    staleTtl?: number;  // additional stale window (seconds)
  }) {
    this.capacity = opts?.capacity ?? 4096;
    this.ttl = opts?.ttl ?? 600;
    this.staleTtl = opts?.staleTtl ?? 60;
  }

  /* ---------- PUBLIC GET WITH LOADER ---------- */
  async get(key: string, loader?: Loader<T>): Promise<T | null> {
    const now = Date.now();
    const node = this.map.get(key);

    if (node) {
      // Fresh
      if (node.expiresAt > now) {
        this.hits++;
        this.moveToFront(node);
        return node.value;
      }

      // Stale but usable → serve stale, refresh in background
      if (node.staleUntil > now) {
        this.hits++;
        this.moveToFront(node);
        if (loader) this.refreshAsync(key, loader);
        return node.value;
      }

      // Fully expired
      this.deleteNode(node);
    }

    this.misses++;
    if (!loader) return null;

    // Deduplicate concurrent loads
    const existing = this.inflight.get(key);
    if (existing) return existing;

    const p = loader()
      .then((val) => {
        if (val !== null) this.set(key, val);
        this.inflight.delete(key);
        return val;
      })
      .catch((e) => {
        this.inflight.delete(key);
        throw e;
      });

    this.inflight.set(key, p);
    return p;
  }

  /* ---------- SET ---------- */
  set(key: string, value: T) {
    const now = Date.now();
    const expiresAt = now + this.ttl * 1000;
    const staleUntil = expiresAt + this.staleTtl * 1000;

    let node = this.map.get(key);

    if (node) {
      node.value = value;
      node.expiresAt = expiresAt;
      node.staleUntil = staleUntil;
      this.moveToFront(node);
      return;
    }

    node = new Node(key, value, expiresAt, staleUntil);
    this.map.set(key, node);
    this.addToFront(node);

    if (this.map.size > this.capacity) this.evictLRU();
  }

  delete(key: string) {
    const node = this.map.get(key);
    if (node) this.deleteNode(node);
  }

  clear() {
    this.map.clear();
    this.head = this.tail = null;
    this.inflight.clear();
  }

  size() {
    return this.map.size;
  }

  stats() {
    return {
      size: this.map.size,
      hits: this.hits,
      misses: this.misses,
      hitRate:
        this.hits + this.misses === 0
          ? 0
          : this.hits / (this.hits + this.misses),
      inflight: this.inflight.size,
    };
  }

  /* ---------- PRELOAD ---------- */
  preload(entries: Array<{ key: string; value: T }>) {
    for (const e of entries) {
      this.set(e.key, e.value);
    }
  }

  /* ---------- INTERNAL ---------- */

  private async refreshAsync(key: string, loader: Loader<T>) {
    if (this.inflight.has(key)) return;

    const p = loader()
      .then((val) => {
        if (val !== null) this.set(key, val);
        this.inflight.delete(key);
        return val;
      })
      .catch(() => {
        this.inflight.delete(key)
        return null;
      });

    this.inflight.set(key, p);
  }

  private moveToFront(node: Node<T>) {
    if (node === this.head) return;
    this.unlink(node);
    this.addToFront(node);
  }

  private addToFront(node: Node<T>) {
    node.prev = null;
    node.next = this.head;
    if (this.head) this.head.prev = node;
    this.head = node;
    if (!this.tail) this.tail = node;
  }

  private unlink(node: Node<T>) {
    if (node.prev) node.prev.next = node.next;
    if (node.next) node.next.prev = node.prev;
    if (node === this.head) this.head = node.next;
    if (node === this.tail) this.tail = node.prev;
  }

  private deleteNode(node: Node<T>) {
    this.unlink(node);
    this.map.delete(node.key);
  }

  private evictLRU() {
    if (this.tail) this.deleteNode(this.tail);
  }
}