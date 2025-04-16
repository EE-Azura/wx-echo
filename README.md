# WX Echo

[![npm 版本](https://img.shields.io/npm/v/wx-echo.svg?style=flat)](https://www.npmjs.com/package/wx-echo)
[![许可证](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.0-blue.svg)](https://www.typescriptlang.org/)

一个基于中间件的轻量级 HTTP 请求库，专为灵活性和可扩展性设计，特别适用于微信小程序环境。

## 📖 简介

WX Echo 提供了一个简洁而强大的 HTTP 客户端，核心特色是基于中间件的架构。这使得它特别适合需要精细控制请求流程的场景，例如添加请求/响应处理、自定义错误处理、认证流程等。本库原生支持微信小程序环境，同时也可在其他 JavaScript 环境中使用。

## ✨ 特性

- **中间件架构**：使用类似 Koa 的中间件系统，轻松扩展和定制请求流程
- **链式 API**：支持链式调用，配置更简洁
- **类型安全**：使用 TypeScript 编写，提供完整的类型定义
- **灵活配置**：支持全局和请求级别的配置选项
- **自定义适配器**：可自定义底层请求实现，兼容各种环境（浏览器、微信小程序等）
- **请求控制**：可访问底层请求任务，支持取消请求等高级功能
- **微信小程序兼容**：默认支持微信小程序环境，无需额外配置

## 🚀 安装

```bash
# 使用 npm
npm install wx-echo
```

**TypeScript 用户请注意：**

为了获得完整的类型支持（特别是在使用默认的微信小程序适配器时），您还需要安装微信小程序的类型定义：

```bash
# 使用 npm
npm install --save-dev @types/wechat-miniprogram
```

## 🔰 快速开始

```typescript
import { Echo } from 'wx-echo';

// 创建请求实例
const echo = new Echo();

// 配置基础 URL
echo.useBaseUrl('https://api.example.com');

// 添加请求中间件
echo.use(async (ctx, next) => {
  console.log('请求开始:', ctx.request.url);
  const startTime = Date.now();
  await next(); // 执行下一个中间件或发送请求
  const endTime = Date.now();
  console.log('请求完成:', ctx.request.url, `耗时: ${endTime - startTime}ms`);
});

// 添加认证中间件
echo.use(async (ctx, next) => {
  // 在请求头中添加认证信息
  if (ctx.request.options.headers) {
    ctx.request.options.headers['Authorization'] = 'Bearer your-token';
  }
  await next();
});

// 添加错误处理中间件
echo.catch(async (ctx, next) => {
  console.error('请求出错:', ctx.error);

  // 可以选择处理特定类型的错误
  if (ctx.error && typeof ctx.error === 'object' && 'statusCode' in ctx.error) {
    if (ctx.error.statusCode === 401) {
      console.log('需要重新认证');
      ctx.errorHandled = true; // 标记错误已处理
    }
  }

  // 如果需要可以传递给下一个错误处理程序
  await next();
});

// 发送 GET 请求
async function fetchData() {
  try {
    // 泛型参数指定返回数据类型
    const response = await echo.GET<{ id: number; name: string }>('/users/1');
    console.log('用户数据:', response);
  } catch (error) {
    console.error('未处理的错误:', error);
  }
}

// 发送 POST 请求并获取底层任务对象
async function createUser() {
  const requestHandle = echo.POST('/users', { name: '张三', email: 'zhangsan@example.com' });

  // 获取底层任务对象，可用于取消请求等操作
  const task = await requestHandle.getTask();

  // 假设任务对象有 abort 方法
  // setTimeout(() => task.abort(), 1000); // 1秒后取消请求

  try {
    const response = await requestHandle; // 等待请求完成
    console.log('创建用户成功:', response);
  } catch (error) {
    console.error('创建用户失败:', error);
  }
}

fetchData();
createUser();
```

## 📚 API 参考

### Echo 类

#### 构造函数

使用 `new Echo()` 创建实例。

| 参数            | 类型                            | 描述                                                                                                                                                      | 是否必需 |
| --------------- | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `options`       | `EchoRequestOptions`            | 实例的默认请求选项。这些选项将与每次请求时传入的选项合并。                                                                                                | 否       |
| `requestCustom` | `EchoRequestCustom<TReq, TRes>` | 自定义的底层 HTTP 请求函数。默认为[一个基于 `wx.request` 的实现](src/default.ts)。您可以提供自己的函数来适配不同的 JavaScript 环境（如浏览器、Node.js）。 | 否       |

#### 方法

| 方法                               | 参数                                                                                                                                            | 返回值                 | 描述                                  |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- | ------------------------------------- |
| `request<R>(url, data?, options?)` | <ul><li>`url`: string - 请求URL</li><li>`data?`: TReq - 请求数据</li><li>`options?`: EchoRequestOptions - 请求选项</li></ul>                    | `EchoRequestHandle<R>` | 发送一个 HTTP 请求                    |
| `use(fn)`                          | `fn`: EchoMiddleware - 中间件函数                                                                                                               | `Echo` 实例            | 添加一个中间件函数，用于处理请求/响应 |
| `catch(fn)`                        | `fn`: EchoErrorHandler - 错误处理函数                                                                                                           | `Echo` 实例            | 添加一个错误处理中间件函数            |
| `useBaseUrl(baseUrl)`              | `baseUrl`: string - 基础URL                                                                                                                     | `Echo` 实例            | 设置 API 基础 URL                     |
| `GET<R>(url, data?, options?)`     | <ul><li>`url`: string - 请求URL</li><li>`data?`: TReq - 请求数据 (通常用于查询参数)</li><li>`options?`: EchoRequestOptions - 请求选项</li></ul> | `EchoRequestHandle<R>` | 发送 GET 请求                         |
| `POST<R>(url, data?, options?)`    | <ul><li>`url`: string - 请求URL</li><li>`data?`: TReq - 请求数据</li><li>`options?`: EchoRequestOptions - 请求选项</li></ul>                    | `EchoRequestHandle<R>` | 发送 POST 请求                        |
| `PUT<R>(url, data?, options?)`     | <ul><li>`url`: string - 请求URL</li><li>`data?`: unknown - 请求数据</li><li>`options?`: EchoRequestOptions - 请求选项</li></ul>                 | `EchoRequestHandle<R>` | 发送 PUT 请求                         |
| `DELETE<R>(url, data?, options?)`  | <ul><li>`url`: string - 请求URL</li><li>`data?`: unknown - 请求数据</li><li>`options?`: EchoRequestOptions - 请求选项</li></ul>                 | `EchoRequestHandle<R>` | 发送 DELETE 请求                      |
| `PATCH<R>(url, data?, options?)`   | <ul><li>`url`: string - 请求URL</li><li>`data?`: unknown - 请求数据</li><li>`options?`: EchoRequestOptions - 请求选项</li></ul>                 | `EchoRequestHandle<R>` | 发送 PATCH 请求                       |
| `HEAD<R>(url, data?, options?)`    | <ul><li>`url`: string - 请求URL</li><li>`data?`: unknown - 请求数据</li><li>`options?`: EchoRequestOptions - 请求选项</li></ul>                 | `EchoRequestHandle<R>` | 发送 HEAD 请求                        |
| `OPTIONS<R>(url, data?, options?)` | <ul><li>`url`: string - 请求URL</li><li>`data?`: unknown - 请求数据</li><li>`options?`: EchoRequestOptions - 请求选项</li></ul>                 | `EchoRequestHandle<R>` | 发送 OPTIONS 请求                     |

### 请求选项 (EchoRequestOptions)

`EchoRequestOptions` 用于配置单次请求的行为，例如请求方法、头部、超时等。这些选项最终会传递给底层的请求适配器 (`requestCustom`)。**注意：** 请求体数据 (`data`) 应作为 `request` 或 HTTP 快捷方法 (如 `GET`, `POST`) 的第二个参数传递，而不是放在 `options` 对象中。

| 选项           | 类型   | 描述                                                                                                              | 默认值  |
| -------------- | ------ | ----------------------------------------------------------------------------------------------------------------- | ------- |
| `method`       | string | HTTP 请求方法 (GET, POST 等)                                                                                      | `'GET'` |
| `headers`      | object | 请求头对象。**注意：** 库内部使用 `headers`，但在默认的微信小程序适配器中会映射到 `wx.request` 的 `header` 选项。 | `{}`    |
| `timeout`      | number | 请求超时时间 (毫秒)                                                                                               | -       |
| `responseType` | string | 响应的数据格式 (例如 'text', 'arraybuffer')。                                                                     | -       |
| `...`          | any    | 其他特定于底层请求实现的选项 (例如 `dataType` 在 `wx.request` 中)                                                 | -       |

**注意：** 除了库核心逻辑（如中间件处理、URL 拼接）明确使用的选项外，所有请求选项最终都会传递给底层的请求函数（适配器）。默认适配器基于 `wx.request`，因此支持其所有选项。请注意，`wx.request` 本身可能对某些选项（如 `responseType`, `dataType` 等）有自己的默认值，具体请参阅[微信官方文档](https://developers.weixin.qq.com/miniprogram/dev/api/network/request/wx.request.html)。

### 中间件与错误处理

**关于术语“中间件”**: 虽然“中间件”通常与服务端框架关联，但在 WX Echo 中，它指的是用于在请求/响应流程中插入自定义逻辑的函数，采用了类似 Koa 的洋葱模型。这与其他库中的“拦截器”（Interceptor）概念相似，允许您灵活地扩展和定制请求处理。

#### 中间件函数 (EchoMiddleware)

中间件函数接收两个参数：

- `ctx`: 上下文对象，包含请求和响应信息
- `next`: 调用下一个中间件的函数

```typescript
type EchoMiddleware<TReq, TRes> = (ctx: EchoContext<TReq, TRes>, next: EchoNext) => Promise<void> | void;
```

中间件函数必须调用 `await next()` 或 `next()` 来继续请求链。

#### 错误处理函数 (EchoErrorHandler)

错误处理函数接收两个参数：

- `err`: 捕获到的错误信息
- `ctx`: 上下文对象，包含请求、响应和错误信息

```typescript
type EchoErrorHandler<TReq, TRes> = (err: unknown, ctx: EchoContext<TReq, TRes>) => Promise<void> | void;
```

在错误处理中间件内，可以检查 `err` 和 `ctx.error` 来处理错误，并可以设置 `ctx.errorHandled = true` 来标记错误已处理。

### 请求上下文 (EchoContext)

| 属性           | 类型                 | 描述                           |
| -------------- | -------------------- | ------------------------------ |
| `request`      | EchoRequestConfig    | 请求配置，包括 URL、数据和选项 |
| `response`     | TRes \| undefined    | 响应数据 (请求成功后)          |
| `error`        | any \| undefined     | 错误信息 (请求失败后)          |
| `errorHandled` | boolean \| undefined | 标记错误是否已被处理           |

### 请求句柄 (EchoRequestHandle)

请求方法返回的 `EchoRequestHandle` 对象是一个 Promise，并附带额外的 `getTask()` 方法：

```typescript
interface EchoRequestHandle<T> extends Promise<T> {
  /**
   * 异步获取底层的请求任务对象。
   * @returns {Promise<EchoRequestTask>} 一个 Promise，将在任务可用时解析为任务对象。
   * 注意：任务对象的具体类型 (例如 RequestTask, AbortController) 取决于使用的请求适配器，此处类型为 unknown。
   */
  getTask(): Promise<EchoRequestTask>; // 返回 Promise<unknown>
}
```

可以使用 `await` 关键字直接等待请求完成，或调用 `getTask()` 获取底层请求任务对象，用于控制请求（如取消）。

## 🧩 高级用法

### 在微信小程序中使用

WX Echo 默认针对微信小程序环境进行了优化，可以直接使用：

```typescript
import { Echo } from 'wx-echo';

// 创建请求实例
const echo = new Echo();

// 使用微信小程序的登录态维护中间件
echo.use(async (ctx, next) => {
  // 检查是否需要重新登录
  const token = wx.getStorageSync('token');
  if (!token) {
    // 执行登录逻辑...
  }

  if (ctx.request.options.headers) {
    ctx.request.options.headers['Authorization'] = `Bearer ${token}`;
  }

  await next();
});

// 发送请求
echo.GET('/api/user/profile').then(profile => {
  console.log('用户资料:', profile);
});
```

### 自定义请求函数

可以提供自定义的请求实现来适配不同环境。

**重要提示：** 当您为微信小程序环境编写自定义请求函数 (`requestCustom`) 时，请注意 WX Echo 的 `options` 对象中使用的是 `headers` 键来表示请求头，而微信小程序的 `wx.request` API 使用的是 `header` 键。您需要在自定义函数中进行相应的映射，如默认适配器所示：`header: options.headers as WechatMiniprogram.IAnyObject | undefined`。有关 `wx.request` 的详细选项，请参阅[微信官方文档](https://developers.weixin.qq.com/miniprogram/dev/api/network/request/wx.request.html)。

```typescript
import { Echo, EchoRequestConfig, EchoRequestCustom, EchoRequestOptions } from 'wx-echo'; // Import EchoRequestOptions

// 为浏览器环境创建自定义请求函数 (示例)
const browserRequest: EchoRequestCustom<any, any> = async (config: EchoRequestConfig<any>) => {
  // 从 config 中解构 url, data, options, setTask
  const { url, data, options = {}, setTask } = config;

  // 使用 fetch API
  const controller = new AbortController();
  if (setTask) {
    setTask(controller); // 保存 AbortController 以便可以取消请求
  }

  const response = await fetch(url, {
    method: options.method, // 从 options 获取 method
    headers: options.headers, // 从 options 获取 headers
    body: data ? JSON.stringify(data) : undefined, // data 来自 config.data
    signal: controller.signal
    // 其他 fetch 支持的选项可以从 options 中获取，例如:
    // mode: options.mode,
    // cache: options.cache,
    // credentials: options.credentials,
    // redirect: options.redirect,
    // referrerPolicy: options.referrerPolicy,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  // 根据 options.responseType 处理响应 (示例)
  if (options.responseType === 'text') {
    return response.text();
  }
  if (options.responseType === 'arraybuffer') {
    return response.arrayBuffer();
  }
  // 默认为 JSON
  return response.json();
};

// 创建使用自定义请求函数的 Echo 实例
const browserEcho = new Echo({}, browserRequest);

// 微信小程序自定义请求函数示例 (强调 header 映射)
const customWxRequest: EchoRequestCustom<any, any> = async (config: EchoRequestConfig<any>) => {
  return new Promise((resolve, reject) => {
    // 从 config 中解构
    const { url, data, options = {}, setTask } = config;

    const requestTask = wx.request({
      url,
      data, // data 来自 config.data
      method: options.method as WechatMiniprogram.RequestOption['method'], // 从 options 获取
      // **注意这里的映射**
      header: options.headers as WechatMiniprogram.IAnyObject | undefined, // 从 options 获取
      timeout: options.timeout, // 从 options 获取
      // dataType: options.dataType, // 从 options 获取 (如果需要)
      responseType: options.responseType, // 从 options 获取
      // ... 其他 wx.request 支持的选项可以从 options 的扩展属性获取
      success: res => resolve(res.data), // 通常 resolve res.data
      fail: reject
    });
    if (setTask) {
      setTask(requestTask);
    }
  });
};

const customWxEcho = new Echo({}, customWxRequest);
```

### 中间件示例

#### 请求重试中间件

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
          throw err; // 达到最大重试次数，抛出错误
        }

        console.log(`请求失败，${delay}ms 后重试 (${attempts}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return executeWithRetry();
      }
    };

    await executeWithRetry();
  };
}

// 使用重试中间件
echo.use(retryMiddleware(3, 2000));
```

#### 缓存中间件

```typescript
function cacheMiddleware(ttl = 60000): EchoMiddleware<unknown, unknown> {
  const cache = new Map<string, { data: any; timestamp: number }>();

  return async (ctx, next) => {
    const cacheKey = `${ctx.request.options.method}:${ctx.request.url}`;

    // 检查缓存
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < ttl) {
      ctx.response = cached.data;
      return; // 不调用 next()，直接使用缓存
    }

    // 继续请求
    await next();

    // 缓存响应
    if (ctx.response) {
      cache.set(cacheKey, {
        data: ctx.response,
        timestamp: Date.now()
      });
    }
  };
}

// 使用缓存中间件 (5分钟 TTL)
echo.use(cacheMiddleware(5 * 60 * 1000));
```

## 📝 类型定义

```typescript
// 请求选项类型
interface EchoRequestOptions {
  method?: HttpMethod;
  headers?: Record<string, string>; // 注意: 默认适配器映射到 header
  timeout?: number;
  responseType?: string; // 例如 'text', 'arraybuffer'
  [key: string]: unknown; // 其他传递给适配器的选项 (如 wx.request 的 dataType)
}

// 请求配置类型 (传递给适配器)
interface EchoRequestConfig<TReq = unknown> {
  url: string;
  data?: TReq; // 请求数据
  options?: EchoRequestOptions; // 请求选项
  setTask?: (task: EchoRequestTask) => void; // 设置任务对象的回调
}

// 请求上下文类型 (用于中间件)
interface EchoContext<TReq = unknown, TRes = unknown> {
  request: EchoRequestConfig<TReq>;
  response?: TRes;
  error?: unknown;
  errorHandled?: boolean;
  [key: string]: unknown; // 允许中间件添加自定义属性
}

// 中间件 next 函数类型
type EchoNext = () => Promise<void>;

// 常规中间件函数类型
type EchoMiddleware<TReq = unknown, TRes = unknown> = (ctx: EchoContext<TReq, TRes>, next: EchoNext) => Promise<void> | void;

// 错误处理中间件函数类型
type EchoErrorHandler<TReq = unknown, TRes = unknown> = (err: unknown, ctx: EchoContext<TReq, TRes>) => Promise<void> | void;

// 底层请求任务对象的通用类型 (具体类型取决于适配器)
type EchoRequestTask = unknown;

// 请求句柄类型 (Promise + getTask)
interface EchoRequestHandle<TRes = unknown> extends Promise<TRes> {
  getTask(): Promise<EchoRequestTask>; // 返回 Promise<unknown>
}

// 自定义请求适配器函数类型
type EchoRequestCustom<TReq = unknown, TRes = unknown> = (config: EchoRequestConfig<TReq>) => Promise<TRes>;

// HTTP 方法类型
type HttpMethod = 'GET' | 'HEAD' | 'POST' | 'PUT' | 'DELETE' | 'CONNECT' | 'OPTIONS' | 'TRACE' | 'PATCH';
```

## 📄 许可证

本项目基于 MIT 许可证授权 - 详细信息请查看 [LICENSE](LICENSE) 文件。
