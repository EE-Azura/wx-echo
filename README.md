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

| 构造函数                             | 参数                                                                                                | 描述                                                   |
| ------------------------------------ | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `new Echo(options?, requestCustom?)` | `options`: EchoRequestOptions - 默认请求选项<br>`requestCustom`: EchoRequestCustom - 自定义请求函数 | 创建一个新的 Echo 实例，可配置默认选项和自定义请求函数 |

#### 方法

| 方法                               | 参数                                                                                                  | 返回值                 | 描述                                  |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------- | ---------------------- | ------------------------------------- |
| `request<R>(url, data, options)`   | `url`: string - 请求URL<br>`data`: TReq - 请求数据<br>`options`: EchoRequestOptions - 请求选项        | `EchoRequestHandle<R>` | 发送一个 HTTP 请求                    |
| `use(fn)`                          | `fn`: EchoMiddleware - 中间件函数                                                                     | `Echo` 实例            | 添加一个中间件函数，用于处理请求/响应 |
| `catch(fn)`                        | `fn`: EchoErrorHandler - 错误处理函数                                                                 | `Echo` 实例            | 添加一个错误处理中间件函数            |
| `useBaseUrl(baseUrl)`              | `baseUrl`: string - 基础URL                                                                           | `Echo` 实例            | 设置 API 基础 URL                     |
| `GET<R>(url, params?, options?)`   | `url`: string - 请求URL<br>`params?`: unknown - 请求参数<br>`options?`: EchoRequestOptions - 请求选项 | `EchoRequestHandle<R>` | 发送 GET 请求                         |
| `POST<R>(url, data?, options?)`    | `url`: string - 请求URL<br>`data?`: unknown - 请求数据<br>`options?`: EchoRequestOptions - 请求选项   | `EchoRequestHandle<R>` | 发送 POST 请求                        |
| `PUT<R>(url, data?, options?)`     | `url`: string - 请求URL<br>`data?`: unknown - 请求数据<br>`options?`: EchoRequestOptions - 请求选项   | `EchoRequestHandle<R>` | 发送 PUT 请求                         |
| `DELETE<R>(url, data?, options?)`  | `url`: string - 请求URL<br>`data?`: unknown - 请求数据<br>`options?`: EchoRequestOptions - 请求选项   | `EchoRequestHandle<R>` | 发送 DELETE 请求                      |
| `PATCH<R>(url, data?, options?)`   | `url`: string - 请求URL<br>`data?`: unknown - 请求数据<br>`options?`: EchoRequestOptions - 请求选项   | `EchoRequestHandle<R>` | 发送 PATCH 请求                       |
| `HEAD<R>(url, data?, options?)`    | `url`: string - 请求URL<br>`data?`: unknown - 请求数据<br>`options?`: EchoRequestOptions - 请求选项   | `EchoRequestHandle<R>` | 发送 HEAD 请求                        |
| `OPTIONS<R>(url, data?, options?)` | `url`: string - 请求URL<br>`data?`: unknown - 请求数据<br>`options?`: EchoRequestOptions - 请求选项   | `EchoRequestHandle<R>` | 发送 OPTIONS 请求                     |

### 请求选项 (EchoRequestOptions)

| 选项           | 类型   | 描述                                                                                                              | 默认值  |
| -------------- | ------ | ----------------------------------------------------------------------------------------------------------------- | ------- |
| `method`       | string | HTTP 请求方法 (GET, POST 等)                                                                                      | `'GET'` |
| `headers`      | object | 请求头对象。**注意：** 库内部使用 `headers`，但在默认的微信小程序适配器中会映射到 `wx.request` 的 `header` 选项。 | `{}`    |
| `timeout`      | number | 请求超时时间 (毫秒)                                                                                               | -       |
| `dataType`     | string | 期望的响应数据类型 (如 'json')                                                                                    | -       |
| `responseType` | string | 响应的数据格式                                                                                                    | -       |
| `params`       | object | URL 查询参数                                                                                                      | -       |
| `...`          | any    | 其他特定于底层请求实现的选项                                                                                      | -       |

### 中间件与错误处理

#### 中间件函数 (EchoMiddleware)

中间件函数接收两个参数：

- `ctx`: 上下文对象，包含请求和响应信息
- `next`: 调用下一个中间件的函数

```typescript
type EchoMiddleware<TReq, TRes> = (ctx: EchoContext<TReq, TRes>, next: EchoNext) => Promise<void> | void;
```

中间件函数必须调用 `await next()` 或 `next()` 来继续请求链。

#### 错误处理函数 (EchoErrorHandler)

错误处理函数接收与中间件相同的参数：

- `ctx`: 上下文对象，包含错误信息
- `next`: 调用下一个错误处理器的函数

```typescript
type EchoErrorHandler<TReq, TRes> = (ctx: EchoContext<TReq, TRes>, next: EchoNext) => Promise<void> | void;
```

在错误处理中间件内，可以检查 `ctx.error` 来处理错误，并可以设置 `ctx.errorHandled = true` 来标记错误已处理。

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
  getTask(): Promise<EchoRequestTask>;
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

**重要提示：** 当您为微信小程序环境编写自定义请求函数 (`requestCustom`) 时，请注意 WX Echo 的 `options` 对象中使用的是 `headers` 键来表示请求头，而微信小程序的 `wx.request` API 使用的是 `header` 键。您需要在自定义函数中进行相应的映射，如默认适配器所示：`header: options.headers as WechatMiniprogram.IAnyObject | undefined`。

```typescript
import { Echo, EchoRequestConfig, EchoRequestCustom } from 'wx-echo';

// 为浏览器环境创建自定义请求函数 (示例)
const browserRequest: EchoRequestCustom<any, any> = async (config: EchoRequestConfig<any>) => {
  const { url, data, options, setTask } = config;

  // 使用 fetch API
  const controller = new AbortController();
  setTask(controller); // 保存 AbortController 以便可以取消请求

  const response = await fetch(url, {
    method: options.method,
    headers: options.headers, // fetch API 也使用 headers
    body: data ? JSON.stringify(data) : undefined,
    signal: controller.signal
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};

// 创建使用自定义请求函数的 Echo 实例
const browserEcho = new Echo({}, browserRequest);

// 微信小程序自定义请求函数示例 (强调 header 映射)
const customWxRequest: EchoRequestCustom<any, any> = async (config: EchoRequestConfig<any>) => {
  return new Promise((resolve, reject) => {
    const { url, data, options, setTask } = config;

    const requestTask = wx.request({
      url,
      data,
      method: options.method as WechatMiniprogram.RequestOption['method'],
      // **注意这里的映射**
      header: options.headers as WechatMiniprogram.IAnyObject | undefined,
      timeout: options.timeout,
      dataType: options.dataType,
      responseType: options.responseType,
      // ... 其他 wx.request 支持的选项
      success: res => resolve(res.data), // 通常 resolve res.data
      fail: reject
    });
    setTask(requestTask);
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
  method?: string;
  headers?: Record<string, any>;
  timeout?: number;
  dataType?: string;
  responseType?: string;
  params?: Record<string, any>;
  [key: string]: any;
}

// 请求配置类型
interface EchoRequestConfig<TReq> {
  url: string;
  data: TReq;
  options: EchoRequestOptions;
  setTask: (task: any) => void;
}

// 请求上下文类型
interface EchoContext<TReq, TRes> {
  request: EchoRequestConfig<TReq>;
  error?: any;
  response?: TRes;
  errorHandled?: boolean;
}

// 中间件 next 函数类型
type EchoNext = () => Promise<void>;

// 中间件函数类型
type EchoMiddleware<TReq, TRes> = (ctx: EchoContext<TReq, TRes>, next: EchoNext) => Promise<void> | void;

// 错误处理函数类型
type EchoErrorHandler<TReq, TRes> = (ctx: EchoContext<TReq, TRes>, next: EchoNext) => Promise<void> | void;

// 请求任务类型 (由底层请求实现定义)
type EchoRequestTask = any;

// 请求句柄类型
interface EchoRequestHandle<T> extends Promise<T> {
  getTask(): Promise<EchoRequestTask>;
}

// 自定义请求函数类型
type EchoRequestCustom<TReq, TRes> = (config: EchoRequestConfig<TReq>) => Promise<TRes>;
```

## 🔍 常见问题

### 如何处理请求超时？

```typescript
// 设置全局超时
const echo = new Echo({ timeout: 10000 }); // 10秒

// 或为特定请求设置超时
echo.GET('/slow-api', null, { timeout: 30000 }); // 30秒
```

### 如何取消请求？

```typescript
const request = echo.GET('/api/data');

// 获取任务对象并取消请求
request.getTask().then(task => {
  // 具体的取消方法取决于底层实现
  // 例如 wx.request 的 RequestTask 使用 abort()
  if (typeof task.abort === 'function') {
    task.abort();
  }
});
```

### 如何处理上传和下载进度？

在微信小程序环境中，可以利用 RequestTask 的能力：

```typescript
// WX Echo 已默认支持微信小程序请求
// 使用方式如下：
const uploadRequest = echo.POST('/api/upload', formData, {
  // 自定义选项，将被传递给底层的 wx.request
  onProgressUpdate: res => {
    console.log('上传进度:', res.progress);
    console.log('已经上传的数据长度:', res.totalBytesSent);
    console.log('预期需要上传的数据总长度:', res.totalBytesExpectedToSend);
  }
});

// 获取任务对象以控制请求
uploadRequest.getTask().then(task => {
  // 可以调用 abort() 等方法
});
```

## 📄 许可证

本项目基于 MIT 许可证授权 - 详细信息请查看 [LICENSE](LICENSE) 文件。
