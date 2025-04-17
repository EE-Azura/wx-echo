[简体中文](./README.md) | English

# WX Echo

[![npm version](https://img.shields.io/npm/v/wx-echo.svg?style=flat)](https://www.npmjs.com/package/wx-echo)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.0-blue.svg)](https://www.typescriptlang.org/)

A lightweight, middleware-based HTTP request library designed for flexibility and extensibility, especially suitable for the WeChat Mini Program environment.

## 📖 Introduction

WX Echo provides a concise yet powerful HTTP client, featuring a core middleware-based architecture. This makes it particularly suitable for scenarios requiring fine-grained control over the request flow, such as adding request/response processing, custom error handling, authentication flows, etc. The library natively supports the WeChat Mini Program environment and can also be used in other JavaScript environments.

## ✨ Features

- **Middleware Architecture**: Utilizes a Koa-like middleware system for easy extension and customization of the request flow.
- **Chainable API**: Supports chainable calls for simpler configuration.
- **Type Safe**: Written in TypeScript with complete type definitions.
- **Flexible Configuration**: Supports global and request-level configuration options.
- **Custom Adapters**: Allows customization of the underlying request implementation to be compatible with various environments (Browser, WeChat Mini Program, etc.).
- **Request Control**: Provides access to the underlying request task, supporting advanced features like request cancellation.
- **WeChat Mini Program Compatible**: Supports the WeChat Mini Program environment by default without extra configuration.

## 🚀 Installation

```bash
# Using npm
npm install wx-echo
```

**Note for TypeScript Users:**

For full type support (especially when using the default WeChat Mini Program adapter), you also need to install the WeChat Mini Program type definitions:

```bash
# Using npm
npm install --save-dev @types/wechat-miniprogram
```

## 🔰 Quick Start

```typescript
import { Echo } from 'wx-echo';

// Create a request instance
const echo = new Echo();

// Configure the base URL
echo.useBaseUrl('https://api.example.com');

// Add a request middleware
echo.use(async (ctx, next) => {
  console.log('Request started:', ctx.request.url);
  const startTime = Date.now();
  await next(); // Execute the next middleware or send the request
  const endTime = Date.now();
  console.log('Request completed:', ctx.request.url, `Duration: ${endTime - startTime}ms`);
});

// Add an authentication middleware
echo.use(async (ctx, next) => {
  // Add authentication info to the request headers
  if (ctx.request.options.headers) {
    ctx.request.options.headers['Authorization'] = 'Bearer your-token';
  }
  await next();
});

// Add an error handling middleware
echo.catch(async (ctx, next) => {
  console.error('Request error:', ctx.error);

  // Optionally handle specific types of errors
  if (ctx.error && typeof ctx.error === 'object' && 'statusCode' in ctx.error) {
    if (ctx.error.statusCode === 401) {
      console.log('Authentication required');
      ctx.errorHandled = true; // Mark the error as handled
    }
  }

  // Optionally pass to the next error handler
  await next();
});

// Send a GET request
async function fetchData() {
  try {
    // Specify the response data type using generics
    const response = await echo.GET<{ id: number; name: string }>('/users/1');
    console.log('User data:', response);
  } catch (error) {
    console.error('Unhandled error:', error);
  }
}

// Send a POST request and get the underlying task object
async function createUser() {
  const requestHandle = echo.POST('/users', { name: 'John Doe', email: 'john.doe@example.com' });

  // Get the underlying task object for operations like cancellation
  const task = await requestHandle.getTask();

  // Assuming the task object has an abort method
  // setTimeout(() => task.abort(), 1000); // Cancel the request after 1 second

  try {
    const response = await requestHandle; // Wait for the request to complete
    console.log('User created successfully:', response);
  } catch (error) {
    console.error('Failed to create user:', error);
  }
}

fetchData();
createUser();
```

## 📚 API Reference

### Echo Class

#### Constructor

Create an instance using `new Echo()`.

| Parameter       | Type                            | Description                                                                                                                                                                                                                 | Required |
| --------------- | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `options`       | `EchoRequestOptions`            | Default request options for the instance. These options will be merged with options passed during each request.                                                                                                             | No       |
| `requestCustom` | `EchoRequestCustom<TReq, TRes>` | A custom underlying HTTP request function. Defaults to [an implementation based on `wx.request`](src/default.ts). You can provide your own function to adapt to different JavaScript environments (e.g., Browser, Node.js). | No       |

#### Methods

| Method                             | Parameters                                                                                                                                                                   | Return Value           | Description                                                |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- | ---------------------------------------------------------- |
| `request<R>(url, data?, options?)` | <ul><li>`url`: string - Request URL</li><li>`data?`: TReq - Request data</li><li>`options?`: EchoRequestOptions - Request options</li></ul>                                  | `EchoRequestHandle<R>` | Sends an HTTP request                                      |
| `use(fn)`                          | `fn`: EchoMiddleware - Middleware function                                                                                                                                   | `Echo` instance        | Adds a middleware function for request/response processing |
| `catch(fn)`                        | `fn`: EchoErrorHandler - Error handler function                                                                                                                              | `Echo` instance        | Adds an error handling middleware function                 |
| `useBaseUrl(baseUrl)`              | `baseUrl`: string - Base URL                                                                                                                                                 | `Echo` instance        | Sets the API base URL                                      |
| `GET<R>(url, data?, options?)`     | <ul><li>`url`: string - Request URL</li><li>`data?`: TReq - Request data (typically for query parameters)</li><li>`options?`: EchoRequestOptions - Request options</li></ul> | `EchoRequestHandle<R>` | Sends a GET request                                        |
| `POST<R>(url, data?, options?)`    | <ul><li>`url`: string - Request URL</li><li>`data?`: TReq - Request data</li><li>`options?`: EchoRequestOptions - Request options</li></ul>                                  | `EchoRequestHandle<R>` | Sends a POST request                                       |
| `PUT<R>(url, data?, options?)`     | <ul><li>`url`: string - Request URL</li><li>`data?`: unknown - Request data</li><li>`options?`: EchoRequestOptions - Request options</li></ul>                               | `EchoRequestHandle<R>` | Sends a PUT request                                        |
| `DELETE<R>(url, data?, options?)`  | <ul><li>`url`: string - Request URL</li><li>`data?`: unknown - Request data</li><li>`options?`: EchoRequestOptions - Request options</li></ul>                               | `EchoRequestHandle<R>` | Sends a DELETE request                                     |
| `PATCH<R>(url, data?, options?)`   | <ul><li>`url`: string - Request URL</li><li>`data?`: unknown - Request data</li><li>`options?`: EchoRequestOptions - Request options</li></ul>                               | `EchoRequestHandle<R>` | Sends a PATCH request                                      |
| `HEAD<R>(url, data?, options?)`    | <ul><li>`url`: string - Request URL</li><li>`data?`: unknown - Request data</li><li>`options?`: EchoRequestOptions - Request options</li></ul>                               | `EchoRequestHandle<R>` | Sends a HEAD request                                       |
| `OPTIONS<R>(url, data?, options?)` | <ul><li>`url`: string - Request URL</li><li>`data?`: unknown - Request data</li><li>`options?`: EchoRequestOptions - Request options</li></ul>                               | `EchoRequestHandle<R>` | Sends an OPTIONS request                                   |

### Request Options (EchoRequestOptions)

`EchoRequestOptions` are used to configure the behavior of a single request, such as the request method, headers, timeout, etc. These options are ultimately passed to the underlying request adapter (`requestCustom`). **Note:** Request body data (`data`) should be passed as the second argument to `request` or HTTP shortcut methods (like `GET`, `POST`), not within the `options` object.

| Option         | Type   | Description                                                                                                                                                          | Default |
| -------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| `method`       | string | HTTP request method (GET, POST, etc.)                                                                                                                                | `'GET'` |
| `headers`      | object | Request headers object. **Note:** The library uses `headers` internally, but the default WeChat Mini Program adapter maps it to the `header` option of `wx.request`. | `{}`    |
| `timeout`      | number | Request timeout in milliseconds.                                                                                                                                     | -       |
| `responseType` | string | Response data format (e.g., 'text', 'arraybuffer').                                                                                                                  | -       |
| `...`          | any    | Other options specific to the underlying request implementation (e.g., `dataType` in `wx.request`).                                                                  | -       |

**Note:** Except for options explicitly used by the library's core logic (like middleware processing, URL joining), all request options are ultimately passed to the underlying request function (adapter). The default adapter is based on `wx.request`, thus supporting all its options. Be aware that `wx.request` itself may have its own default values for certain options (like `responseType`, `dataType`, etc.). Please refer to the [official WeChat documentation](https://developers.weixin.qq.com/miniprogram/dev/api/network/request/wx.request.html) for details.

### Middleware and Error Handling

**About the term "Middleware"**: While "middleware" is often associated with server-side frameworks, in WX Echo, it refers to functions used to insert custom logic into the request/response flow, adopting an onion model similar to Koa. This is analogous to the "Interceptor" concept in other libraries, allowing you to flexibly extend and customize request handling.

#### Middleware Function (EchoMiddleware)

Middleware functions receive two arguments:

- `ctx`: The context object, containing request and response information.
- `next`: A function to call the next middleware.

```typescript
type EchoMiddleware<TReq, TRes> = (ctx: EchoContext<TReq, TRes>, next: EchoNext) => Promise<void> | void;
```

Middleware functions must call `await next()` or `next()` to continue the request chain.

#### Error Handler Function (EchoErrorHandler)

Error handler functions receive two arguments:

- `err`: The caught error information.
- `ctx`: The context object, containing request, response, and error information.

```typescript
type EchoErrorHandler<TReq, TRes> = (err: unknown, ctx: EchoContext<TReq, TRes>) => Promise<void> | void;
```

Within an error handling middleware, you can inspect `err` and `ctx.error` to handle the error, and set `ctx.errorHandled = true` to mark the error as handled.

### Request Context (EchoContext)

| Property       | Type                 | Description                                             |
| -------------- | -------------------- | ------------------------------------------------------- |
| `request`      | EchoRequestConfig    | Request configuration, including URL, data, and options |
| `response`     | TRes \| undefined    | Response data (after successful request)                |
| `error`        | any \| undefined     | Error information (after failed request)                |
| `errorHandled` | boolean \| undefined | Flag indicating if the error has been handled           |

### Request Handle (EchoRequestHandle)

The `EchoRequestHandle` object returned by request methods is a Promise with an additional `getTask()` method:

```typescript
interface EchoRequestHandle<T> extends Promise<T> {
  /**
   * Asynchronously gets the underlying request task object.
   * @returns {Promise<EchoRequestTask>} A Promise that resolves with the task object when available.
   * Note: The specific type of the task object (e.g., RequestTask, AbortController) depends on the request adapter used, hence typed as unknown here.
   */
  getTask(): Promise<EchoRequestTask>; // Returns Promise<unknown>
}
```

You can use the `await` keyword to wait for the request to complete directly, or call `getTask()` to obtain the underlying request task object for controlling the request (e.g., cancellation).

## 🧩 Advanced Usage

### Using in WeChat Mini Programs

WX Echo is optimized for the WeChat Mini Program environment by default and can be used directly:

```typescript
import { Echo } from 'wx-echo';

// Create a request instance
const echo = new Echo();

// Use middleware for WeChat Mini Program login state management
echo.use(async (ctx, next) => {
  // Check if re-login is needed
  const token = wx.getStorageSync('token');
  if (!token) {
    // Perform login logic...
  }

  if (ctx.request.options.headers) {
    ctx.request.options.headers['Authorization'] = `Bearer ${token}`;
  }

  await next();
});

// Send a request
echo.GET('/api/user/profile').then(profile => {
  console.log('User profile:', profile);
});
```

### Custom Request Function

You can provide a custom request implementation to adapt to different environments.

**Important Note:** When writing a custom request function (`requestCustom`) for the WeChat Mini Program environment, be aware that WX Echo's `options` object uses the `headers` key for request headers, while the WeChat Mini Program's `wx.request` API uses the `header` key. You need to perform the mapping in your custom function, as shown in the default adapter: `header: options.headers as WechatMiniprogram.IAnyObject | undefined`. For detailed `wx.request` options, refer to the [official WeChat documentation](https://developers.weixin.qq.com/miniprogram/dev/api/network/request/wx.request.html).

```typescript
import { Echo, EchoRequestConfig, EchoRequestCustom, EchoRequestOptions } from 'wx-echo'; // Import EchoRequestOptions

// Create a custom request function for the browser environment (example)
const browserRequest: EchoRequestCustom<any, any> = async (config: EchoRequestConfig<any>) => {
  // Destructure url, data, options, setTask from config
  const { url, data, options = {}, setTask } = config;

  // Use the fetch API
  const controller = new AbortController();
  if (setTask) {
    setTask(controller); // Save AbortController to allow request cancellation
  }

  const response = await fetch(url, {
    method: options.method, // Get method from options
    headers: options.headers, // Get headers from options
    body: data ? JSON.stringify(data) : undefined, // data comes from config.data
    signal: controller.signal
    // Other fetch-supported options can be obtained from options, e.g.:
    // mode: options.mode,
    // cache: options.cache,
    // credentials: options.credentials,
    // redirect: options.redirect,
    // referrerPolicy: options.referrerPolicy,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  // Handle response based on options.responseType (example)
  if (options.responseType === 'text') {
    return response.text();
  }
  if (options.responseType === 'arraybuffer') {
    return response.arrayBuffer();
  }
  // Default to JSON
  return response.json();
};

// Create an Echo instance using the custom request function
const browserEcho = new Echo({}, browserRequest);

// WeChat Mini Program custom request function example (emphasizing header mapping)
const customWxRequest: EchoRequestCustom<any, any> = async (config: EchoRequestConfig<any>) => {
  return new Promise((resolve, reject) => {
    // Destructure from config
    const { url, data, options = {}, setTask } = config;

    const requestTask = wx.request({
      url,
      data, // data comes from config.data
      method: options.method as WechatMiniprogram.RequestOption['method'], // Get from options
      // **Note the mapping here**
      header: options.headers as WechatMiniprogram.IAnyObject | undefined, // Get from options
      timeout: options.timeout, // Get from options
      // dataType: options.dataType, // Get from options (if needed)
      responseType: options.responseType, // Get from options
      // ... other wx.request supported options can be obtained from options' extension properties
      success: res => resolve(res.data), // Usually resolve res.data
      fail: reject
    });
    if (setTask) {
      setTask(requestTask);
    }
  });
};

const customWxEcho = new Echo({}, customWxRequest);
```

### Middleware Examples

#### Request Retry Middleware

```typescript
function retryMiddleware(maxRetries = 3, delay = 1000): EchoMiddleware<unknown, unknown> {
  return async (ctx, next) => {
    let attempts = 0;
    const executeWithRetry = async () => {
      try {
        attempts++;
        await next();
      } catch (err) {
        if (attempts >= maxRetries) {
          throw err; // Throw error after reaching max retries
        }

        console.log(`Request failed, retrying after ${delay}ms (${attempts}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return executeWithRetry();
      }
    };

    await executeWithRetry();
  };
}

// Use the retry middleware
echo.use(retryMiddleware(3, 2000));
```

#### Cache Middleware

```typescript
function cacheMiddleware(ttl = 60000): EchoMiddleware<unknown, unknown> {
  const cache = new Map<string, { data: any; timestamp: number }>();

  return async (ctx, next) => {
    const cacheKey = `${ctx.request.options.method}:${ctx.request.url}`;

    // Check cache
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < ttl) {
      ctx.response = cached.data;
      return; // Do not call next(), use cache directly
    }

    // Continue request
    await next();

    // Cache the response
    if (ctx.response) {
      cache.set(cacheKey, {
        data: ctx.response,
        timestamp: Date.now()
      });
    }
  };
}

// Use the cache middleware (5-minute TTL)
echo.use(cacheMiddleware(5 * 60 * 1000));
```

## 📝 Type Definitions

```typescript
// Request options type
interface EchoRequestOptions {
  method?: HttpMethod;
  headers?: Record<string, string>; // Note: Default adapter maps to header
  timeout?: number;
  responseType?: string; // e.g., 'text', 'arraybuffer'
  [key: string]: unknown; // Other options passed to the adapter (like wx.request's dataType)
}

// Request configuration type (passed to adapter)
interface EchoRequestConfig<TReq = unknown> {
  url: string;
  data?: TReq; // Request data
  options?: EchoRequestOptions; // Request options
  setTask?: (task: EchoRequestTask) => void; // Callback to set the task object
}

// Request context type (for middleware)
interface EchoContext<TReq = unknown, TRes = unknown> {
  request: EchoRequestConfig<TReq>;
  response?: TRes;
  error?: unknown;
  errorHandled?: boolean;
  [key: string]: unknown; // Allow middleware to add custom properties
}

// Middleware next function type
type EchoNext = () => Promise<void>;

// Regular middleware function type
type EchoMiddleware<TReq = unknown, TRes = unknown> = (ctx: EchoContext<TReq, TRes>, next: EchoNext) => Promise<void> | void;

// Error handling middleware function type
type EchoErrorHandler<TReq = unknown, TRes = unknown> = (err: unknown, ctx: EchoContext<TReq, TRes>) => Promise<void> | void;

// Generic type for the underlying request task object (specific type depends on adapter)
type EchoRequestTask = unknown;

// Request handle type (Promise + getTask)
interface EchoRequestHandle<TRes = unknown> extends Promise<TRes> {
  getTask(): Promise<EchoRequestTask>; // Returns Promise<unknown>
}

// Custom request adapter function type
type EchoRequestCustom<TReq = unknown, TRes = unknown> = (config: EchoRequestConfig<TReq>) => Promise<TRes>;

// HTTP method type
type HttpMethod = 'GET' | 'HEAD' | 'POST' | 'PUT' | 'DELETE' | 'CONNECT' | 'OPTIONS' | 'TRACE' | 'PATCH';
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
