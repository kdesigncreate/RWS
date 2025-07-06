/**
 * CORS ミドルウェア
 */

export interface CorsOptions {
  origin?: string | string[] | boolean;
  methods?: string[];
  allowedHeaders?: string[];
  credentials?: boolean;
  maxAge?: number;
}

export const createCorsMiddleware = (options: CorsOptions = {}) => {
  const {
    origin = true,
    methods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders = [
      'Authorization',
      'Content-Type',
      'Accept',
      'Origin',
      'X-Requested-With'
    ],
    credentials = true,
    maxAge = 86400 // 24 hours
  } = options;

  return (request: Request): Headers => {
    const headers = new Headers();

    // Origin の処理
    const requestOrigin = request.headers.get('Origin');
    if (origin === true) {
      headers.set('Access-Control-Allow-Origin', requestOrigin || '*');
    } else if (origin === false) {
      // Do nothing
    } else if (typeof origin === 'string') {
      headers.set('Access-Control-Allow-Origin', origin);
    } else if (Array.isArray(origin)) {
      if (requestOrigin && origin.includes(requestOrigin)) {
        headers.set('Access-Control-Allow-Origin', requestOrigin);
      }
    }

    // Methods
    headers.set('Access-Control-Allow-Methods', methods.join(', '));

    // Headers
    headers.set('Access-Control-Allow-Headers', allowedHeaders.join(', '));

    // Credentials
    if (credentials) {
      headers.set('Access-Control-Allow-Credentials', 'true');
    }

    // Max Age
    headers.set('Access-Control-Max-Age', maxAge.toString());

    return headers;
  };
};

export const handlePreflightRequest = (corsHeaders: Headers): Response => {
  return new Response(null, {
    status: 204,
    headers: corsHeaders
  });
};