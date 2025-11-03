/**
 * Trace Context API for manual instrumentation
 * Provides a simple API for creating custom spans within traces
 * 
 * @module trace-context
 */

import { startSpan, endSpan, addSpanAttributes, getTraceContext } from './tracing.js';

/**
 * Trace context API
 */
export const trace = {
  /**
   * Start a new span within the current trace context
   * @param {string} name - Span name
   * @param {Object} options - Span options
   * @param {string} options.kind - Span kind: "server", "client", "internal"
   * @param {Object} options.attributes - Span attributes
   * @returns {Span|null} Span object with end() method or null if no active trace
   */
  startSpan(name, options = {}) {
    const spanId = startSpan({
      name,
      kind: options.kind || 'internal',
      attributes: options.attributes || {},
    });

    if (!spanId) {
      return null;
    }

    return {
      spanId,
      end() {
        endSpan({ spanId, status: 'ok' });
      },
      setStatus(status, error) {
        endSpan({ spanId, status, error });
      },
      setAttributes(attributes) {
        const context = getTraceContext();
        if (context && context.sampled) {
          addSpanAttributes(attributes);
        }
      },
    };
  },

  /**
   * Get the current trace context
   * @returns {Object|null} Current trace context or null
   */
  getContext() {
    return getTraceContext();
  },
};

export default trace;

