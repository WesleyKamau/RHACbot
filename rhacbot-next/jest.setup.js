import '@testing-library/jest-dom'

// Polyfill for Web Streams API
import { ReadableStream, TransformStream, WritableStream } from 'node:stream/web'
global.ReadableStream = ReadableStream
global.TransformStream = TransformStream
global.WritableStream = WritableStream
