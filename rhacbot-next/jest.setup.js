import '@testing-library/jest-dom'

// Polyfill for Web Streams API
import { ReadableStream, TransformStream, WritableStream } from 'node:stream/web'
global.ReadableStream = ReadableStream
global.TransformStream = TransformStream
global.WritableStream = WritableStream

// Mock Next.js server components for API route testing
if (typeof Request === 'undefined') {
  global.Request = class Request {
    constructor(input, init) {
      this.url = input
      this.method = init?.method || 'GET'
      this.headers = new Map(Object.entries(init?.headers || {}))
      this._body = init?.body
    }
    async json() {
      return JSON.parse(this._body || '{}')
    }
    async formData() {
      const FormData = require('form-data')
      return this._formData || new FormData()
    }
  }
}

if (typeof Response === 'undefined') {
  global.Response = class Response {
    constructor(body, init) {
      this.body = body
      this.status = init?.status || 200
      this.headers = new Map(Object.entries(init?.headers || {}))
    }
    
    static json(data, init) {
      return new Response(JSON.stringify(data), {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          ...(init?.headers || {}),
        },
      });
    }

    async json() {
      return JSON.parse(this.body);
    }
  }
}

if (typeof Headers === 'undefined') {
  global.Headers = Map
}

if (typeof FormData === 'undefined') {
  global.FormData = class FormData {
    constructor() {
      this._data = new Map()
    }
    append(key, value) {
      if (!this._data.has(key)) {
        this._data.set(key, [])
      }
      this._data.get(key).push(value)
    }
    get(key) {
      const values = this._data.get(key)
      return values ? values[0] : null
    }
    getAll(key) {
      return this._data.get(key) || []
    }
  }
}

if (typeof File === 'undefined') {
  global.File = class File {
    constructor(bits, name, options) {
      this.name = name
      this.type = options?.type || ''
      this._bits = bits
    }
    async arrayBuffer() {
      return Buffer.from(this._bits[0])
    }
  }
}
