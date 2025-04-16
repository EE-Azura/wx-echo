/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Echo } from '../src/wx-echo'; // Renamed from BreezeRequest
import { EchoRequestCustom } from '../src/types'; // Renamed from BreezeRequestCustom

// Assign the mock function using a type assertion on globalThis to satisfy TypeScript
// We are intentionally overriding the standard wx.request with a Vitest mock
// Use type assertion '(globalThis as any)' to bypass the check on globalThis

(globalThis as any).wx = {
  request: vi.fn()
};

// 创建一个符合 RequestTask 接口基本结构的模拟对象
const createMockRequestTask = (): WechatMiniprogram.RequestTask => ({
  abort: vi.fn(),
  offHeadersReceived: vi.fn(),
  onHeadersReceived: vi.fn()
  // 如果接口需要更多属性，可以在这里添加
});

describe('Echo', () => {
  // Renamed from BreezeRequest
  let request: Echo<unknown>;

  beforeEach(() => {
    vi.clearAllMocks();
    // Ensure wx.request is correctly typed for mocking within tests
    // Use vi.mocked to work with the mocked function, now referencing wx.request directly
    vi.mocked(wx.request).mockClear();
    request = new Echo();
  });

  describe('构造函数', () => {
    it('应该使用默认选项创建实例', () => {
      expect(request).toBeInstanceOf(Echo);
    });

    it('应该使用自定义选项创建实例', () => {
      const options = { headers: { 'Content-Type': 'application/json' } };
      const customRequest = new Echo(options);
      expect(customRequest).toBeInstanceOf(Echo);
    });
  });

  describe('HTTP 方法', () => {
    beforeEach(() => {
      // Use vi.mocked to interact with the mocked wx.request
      vi.mocked(wx.request).mockImplementation(({ success }) => {
        // Reference wx.request directly
        // 提供符合 WechatMiniprogram.RequestSuccessCallbackResult 结构的对象
        success?.({ data: 'test data', statusCode: 200, header: {} } as WechatMiniprogram.RequestSuccessCallbackResult<string>);
        // 返回更完整的模拟 RequestTask
        return createMockRequestTask();
      });
    });

    it('应该支持 GET 请求', async () => {
      const result = await request.GET('/test');
      expect(wx.request).toHaveBeenCalledWith(
        // Reference wx.request directly
        expect.objectContaining({
          url: '/test',
          method: 'GET',
          header: {}
        })
      );
      // 调整期望值以匹配模拟的完整响应结构
      expect(result).toEqual({ data: 'test data', statusCode: 200, header: {} });
    });

    it('应该支持 POST 请求', async () => {
      const data = { name: 'test' };
      await request.POST('/test', data);
      expect(wx.request).toHaveBeenCalledWith(
        // Reference wx.request directly
        expect.objectContaining({
          url: '/test',
          data,
          method: 'POST',
          header: {}
        })
      );
    });

    it('应该支持 PUT 请求', async () => {
      const data = { name: 'updated' };
      await request.PUT('/test/1', data);
      expect(wx.request).toHaveBeenCalledWith(
        // Reference wx.request directly
        expect.objectContaining({
          url: '/test/1',
          data,
          method: 'PUT',
          header: {}
        })
      );
    });

    it('应该支持 DELETE 请求', async () => {
      await request.DELETE('/test/1');
      expect(wx.request).toHaveBeenCalledWith(
        // Reference wx.request directly
        expect.objectContaining({
          url: '/test/1',
          method: 'DELETE',
          header: {}
        })
      );
    });

    it('应该支持 PATCH 请求', async () => {
      const data = { name: 'patch' };
      await request.PATCH('/test/1', data);
      expect(wx.request).toHaveBeenCalledWith(
        // Reference wx.request directly
        expect.objectContaining({
          url: '/test/1',
          data,
          method: 'PATCH',
          header: {}
        })
      );
    });

    it('应该正确合并和传递请求选项', async () => {
      const instanceOptions = { headers: { 'X-Instance': 'InstValue' } };
      const methodOptions = { headers: { 'X-Method': 'MethValue' }, dataType: 'json' as const }; // 添加 as const
      const requestWithOptions = new Echo(instanceOptions); // Renamed from BreezeRequest

      await requestWithOptions.GET('/test', undefined, methodOptions); // 传递 methodOptions

      expect(wx.request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: '/test',
          method: 'GET',
          header: {
            'X-Instance': 'InstValue',
            'X-Method': 'MethValue'
          },
          dataType: 'json'
        })
      );
    });

    // 新增 HEAD 测试
    it('应该支持 HEAD 请求', async () => {
      await request.HEAD('/test');
      expect(wx.request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: '/test',
          method: 'HEAD',
          header: {}
        })
      );
    });

    // 新增 OPTIONS 测试
    it('应该支持 OPTIONS 请求', async () => {
      await request.OPTIONS('/test');
      expect(wx.request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: '/test',
          method: 'OPTIONS',
          header: {}
        })
      );
    });
  });

  describe('中间件', () => {
    it('应该按正确顺序执行中间件', async () => {
      const order: number[] = [];

      request.use(async (ctx, next) => {
        order.push(1);
        await next();
        order.push(4);
      });

      request.use(async (ctx, next) => {
        order.push(2);
        await next();
        order.push(3);
      });

      vi.mocked(wx.request).mockImplementation(({ success }) => {
        // Reference wx.request directly
        // 使用更具体的类型或结构
        success?.({ data: 'test', statusCode: 200, header: {} } as WechatMiniprogram.RequestSuccessCallbackResult<string>);
        // 返回更完整的模拟 RequestTask
        return createMockRequestTask();
      });

      await request.GET('/test');
      expect(order).toEqual([1, 2, 3, 4]);
    });

    it('应该在中间件中修改请求', async () => {
      request.use(async (ctx, next) => {
        ctx.request.options = {
          ...(ctx.request.options || {}),
          headers: { 'X-Custom': 'Value' } // Middleware modifies 'headers'
        };
        await next();
      });

      await request.GET('/test');
      expect(wx.request).toHaveBeenCalledWith(
        // Reference wx.request directly
        expect.objectContaining({
          header: { 'X-Custom': 'Value' }
        })
      );
    });

    it('应该在中间件中修改响应', async () => {
      // 为此测试创建一个具有特定 TRes 类型的实例
      // TRes 定义为可以包含 data 和可选的 modified 属性的对象
      type TestResponseType = { data?: { original: boolean }; modified?: boolean };
      const specificRequest = new Echo<unknown, TestResponseType>(); // Renamed from BreezeRequest

      vi.mocked(wx.request).mockImplementation(({ success }) => {
        // Reference wx.request directly
        // 模拟返回的数据结构，类型已在上次编辑中修正
        success?.({ data: { original: true }, statusCode: 200, header: {} } as WechatMiniprogram.RequestSuccessCallbackResult<{ original: boolean }>);
        // 返回更完整的模拟 RequestTask
        return createMockRequestTask();
      });

      specificRequest.use(async (ctx, next) => {
        await next();
        // ctx.response 的类型现在是 TestResponseType | undefined
        if (ctx.response) {
          // 可以安全地分配给 TRes 中定义的属性
          ctx.response.modified = true;
        }
      });

      // 使用新的实例发起请求
      const result = await specificRequest.GET('/test');
      // 预期结果包含原始数据和添加的属性
      expect(result).toEqual({ data: { original: true }, statusCode: 200, header: {}, modified: true });
    });

    // 新增：中间件短路测试
    it('应该允许中间件短路请求', async () => {
      request.use(async ctx => {
        // 不调用 next()
        ctx.response = { data: 'short-circuited', statusCode: 418, header: {} }; // 设置响应
      });

      request.use(async () => {
        // 这个中间件不应该被执行
        throw new Error('This middleware should not be called');
      });

      // wx.request 也不应该被调用
      vi.mocked(wx.request).mockImplementation(() => {
        throw new Error('wx.request should not be called');
      });

      const result = await request.GET('/test');
      expect(result).toEqual({ data: 'short-circuited', statusCode: 418, header: {} });
      expect(wx.request).not.toHaveBeenCalled();
    });

    // 新增：next() 后抛出错误测试
    it('应该捕获在 next() 后抛出的中间件错误', async () => {
      const error = new Error('Error after next');
      request.use(async (ctx, next) => {
        await next();
        // 在 next() 返回后抛出错误
        throw error;
      });

      request.catch((err, ctx) => {
        expect(err).toBe(error);
        ctx.errorHandled = true;
        ctx.response = { error: true, message: 'Caught error after next' };
      });

      // 模拟底层请求成功
      vi.mocked(wx.request).mockImplementation(({ success }) => {
        success?.({ data: 'original data', statusCode: 200, header: {} } as WechatMiniprogram.RequestSuccessCallbackResult<string>);
        return createMockRequestTask();
      });

      const result = await request.GET('/test');
      expect(result).toEqual({ error: true, message: 'Caught error after next' });
    });
  });

  describe('错误处理', () => {
    it('应该捕获并处理错误', async () => {
      const error = new Error('Request failed');

      vi.mocked(wx.request).mockImplementation(({ fail }) => {
        // Reference wx.request directly
        fail?.({ errMsg: error.message } as WechatMiniprogram.GeneralCallbackResult);
        return createMockRequestTask();
      });

      // 将 err 类型改为 unknown
      request.catch((err: unknown, ctx) => {
        // 添加类型检查以安全访问 errMsg
        let message = 'Unknown error';
        if (typeof err === 'object' && err !== null && 'errMsg' in err && typeof err.errMsg === 'string') {
          message = err.errMsg;
        } else if (err instanceof Error) {
          message = err.message; // 也可处理 Error 实例
        }
        expect(message).toBe('Request failed');
        ctx.errorHandled = true;
        // 响应类型应与 TRes (unknown) 兼容
        ctx.response = { error: true, message: message };
      });

      const result = await request.GET('/test');
      expect(result).toEqual({ error: true, message: 'Request failed' });
    });

    it('应该传播未处理的错误', async () => {
      const error = new Error('Unhandled error');

      vi.mocked(wx.request).mockImplementation(({ fail }) => {
        // Reference wx.request directly
        fail?.({ errMsg: error.message } as WechatMiniprogram.GeneralCallbackResult);
        // 返回更完整的模拟 RequestTask
        return createMockRequestTask();
      });

      // 预期捕获到的错误对象现在是 GeneralCallbackResult
      await expect(request.GET('/test')).rejects.toEqual({ errMsg: 'Unhandled error' });
    });

    it('应该处理请求超时错误', async () => {
      const error = { errMsg: 'request:fail timeout' }; // 模拟超时错误信息

      vi.mocked(wx.request).mockImplementation(({ fail }) => {
        fail?.(error as WechatMiniprogram.GeneralCallbackResult); // 强制类型转换
        return createMockRequestTask();
      });

      request.catch((err: unknown, ctx) => {
        expect(err).toEqual(error);
        ctx.errorHandled = true;
        ctx.response = { error: true, message: 'Request timed out' };
      });

      const result = await request.GET('/test');
      expect(result).toEqual({ error: true, message: 'Request timed out' });
    });

    // 新增：wx.request 不存在测试
    it('当 wx.request 不存在时应拒绝', async () => {
      const originalWx = (globalThis as any).wx; // 保存原始 wx 对象
      (globalThis as any).wx = undefined; // 模拟 wx 不存在

      const specificRequest = new Echo(); // Renamed from BreezeRequest // 创建新实例以使用当前的 wx 状态

      await expect(specificRequest.GET('/test')).rejects.toThrow('wx.request is not defined. Please check if you are in a WeChat Mini Program environment.');

      (globalThis as any).wx = originalWx; // 恢复 wx 对象
    });
  });

  // 新增：自定义请求函数测试
  describe('自定义请求函数', () => {
    it('应该使用提供的自定义请求函数', async () => {
      const customRequestFn = vi.fn().mockResolvedValue({ data: 'custom response', statusCode: 201, header: { 'X-Custom': 'true' } });
      const customRequestInstance = new Echo({}, customRequestFn as EchoRequestCustom<unknown, unknown>); // Renamed from BreezeRequest, BreezeRequestCustom

      const result = await customRequestInstance.GET('/custom-test');

      expect(customRequestFn).toHaveBeenCalledTimes(1);
      // 调整断言以匹配 EchoRequestConfig 结构
      expect(customRequestFn).toHaveBeenCalledWith(
        expect.objectContaining({
          url: '/custom-test',
          // method 在 options 内部
          options: expect.objectContaining({
            method: 'GET'
          })
        })
      );
      expect(result).toEqual({ data: 'custom response', statusCode: 201, header: { 'X-Custom': 'true' } });
      // 确保原始 wx.request 未被调用
      expect(wx.request).not.toHaveBeenCalled();
    });
  });

  describe('使用基础URL', () => {
    beforeEach(() => {
      vi.mocked(wx.request).mockImplementation(({ success }) => {
        // Reference wx.request directly
        // 使用更具体的类型或结构
        success?.({ data: 'test data', statusCode: 200, header: {} } as WechatMiniprogram.RequestSuccessCallbackResult<string>);
        // 返回更完整的模拟 RequestTask
        return createMockRequestTask();
      });
    });

    it('应该在请求前添加基础URL', async () => {
      request.useBaseUrl('https://api.example.com');
      await request.GET('/users');
      expect(wx.request).toHaveBeenCalledWith(
        // Reference wx.request directly
        expect.objectContaining({
          url: 'https://api.example.com/users',
          method: 'GET',
          header: {}
        })
      );
    });

    it('不应修改绝对URL', async () => {
      request.useBaseUrl('https://api.example.com');

      await request.GET('https://other-api.com/users');
      expect(wx.request).toHaveBeenCalledWith(
        // Reference wx.request directly
        expect.objectContaining({
          url: 'https://other-api.com/users',
          method: 'GET',
          header: {}
        })
      );
    });
  });

  describe('请求任务处理', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    // 修改测试用例以反映异步获取 task
    it('应该能通过 getTask() 异步获取任务句柄', async () => {
      const mockTask = createMockRequestTask();
      // 模拟 wx.request 在被调用时，通过 setTask 回调传递 task
      // 注意：这里的 mock 模拟的是 defaultRequest 的行为，它会调用 setTask
      // wx.request 本身不接收 setTask
      vi.mocked(wx.request).mockImplementation(options => {
        // 模拟 defaultRequest 调用 setTask 的行为
        // 实际调用发生在 defaultRequest 内部，这里我们在测试中模拟这个效果
        // 需要找到传递给 Echo 的 setTask 回调，但这比较困难直接模拟
        // 因此，我们假设 Echo 正确传递了 setTask 给 defaultRequest
        // defaultRequest 会调用它。Echo 内部的 taskResolver 会被触发。

        // 模拟请求成功
        options.success?.({ data: 'test data', statusCode: 200, header: {} } as WechatMiniprogram.RequestSuccessCallbackResult<string>);
        return mockTask; // wx.request 返回 task
      });

      const requestHandle = request.GET('/test');
      // 异步获取 task
      const task = await requestHandle.getTask();
      // 断言获取到的 task 是我们模拟的 task
      expect(task).toBe(mockTask);
      // 等待请求完成
      await requestHandle;
    });

    it('应该能够中止请求', async () => {
      const mockTask = createMockRequestTask();
      let failCallback: ((res: WechatMiniprogram.GeneralCallbackResult) => void) | undefined;

      // 模拟 wx.request，捕获 fail 回调，并返回 mockTask
      vi.mocked(wx.request).mockImplementation(options => {
        failCallback = options.fail; // 捕获 fail 回调
        // 注意：这里不调用 success 或 fail，模拟一个进行中的请求
        // 同样假设 setTask 被 defaultRequest 正确调用
        return mockTask;
      });

      // 模拟 abort() 调用时触发 fail 回调
      vi.mocked(mockTask.abort).mockImplementation(() => {
        failCallback?.({ errMsg: 'request:fail abort' });
      });

      // 发起请求但不等待完成
      const requestHandle = request.GET('/test');

      // 异步获取 task
      const task = await requestHandle.getTask();

      // 确保获取到的是正确的 task
      expect(task).toBe(mockTask);

      // 调用中止方法 - 使用非空断言操作符
      task!.abort();

      // 验证模拟任务的 abort 方法是否被调用
      expect(mockTask.abort).toHaveBeenCalledTimes(1);

      // 断言主 Promise 因中止而被拒绝
      await expect(requestHandle).rejects.toEqual({ errMsg: 'request:fail abort' });
    });
  });
});
