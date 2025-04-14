import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BreezeRequest } from '../src/breeze-request';
import { Interceptor } from '../src/Interceptor';
import { BreezeContext, BreezeNext } from '../src/types';

// Assign the mock function using a type assertion on globalThis to satisfy TypeScript
// We are intentionally overriding the standard wx.request with a Vitest mock
// Use type assertion '(globalThis as any)' to bypass the check on globalThis
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

describe('BreezeRequest', () => {
  let request: BreezeRequest<unknown>;

  beforeEach(() => {
    vi.clearAllMocks();
    // Ensure wx.request is correctly typed for mocking within tests
    // Use vi.mocked to work with the mocked function, now referencing wx.request directly
    vi.mocked(wx.request).mockClear(); // Reference wx.request directly
    request = new BreezeRequest();
  });

  describe('构造函数', () => {
    it('应该使用默认选项创建实例', () => {
      expect(request).toBeInstanceOf(BreezeRequest);
    });

    it('应该使用自定义选项创建实例', () => {
      const options = { headers: { 'Content-Type': 'application/json' } };
      const customRequest = new BreezeRequest(options);
      expect(customRequest).toBeInstanceOf(BreezeRequest);
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
          method: 'GET'
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
          method: 'POST'
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
          method: 'PUT'
        })
      );
    });

    it('应该支持 DELETE 请求', async () => {
      await request.DELETE('/test/1');
      expect(wx.request).toHaveBeenCalledWith(
        // Reference wx.request directly
        expect.objectContaining({
          url: '/test/1',
          method: 'DELETE'
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
          method: 'PATCH'
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
          headers: { 'X-Custom': 'Value' }
        };
        await next();
      });

      await request.GET('/test');
      expect(wx.request).toHaveBeenCalledWith(
        // Reference wx.request directly
        expect.objectContaining({
          headers: { 'X-Custom': 'Value' }
        })
      );
    });

    it('应该在中间件中修改响应', async () => {
      // 为此测试创建一个具有特定 TRes 类型的实例
      // TRes 定义为可以包含 data 和可选的 modified 属性的对象
      type TestResponseType = { data?: { original: boolean }; modified?: boolean };
      const specificRequest = new BreezeRequest<unknown, TestResponseType>();

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
      expect(result).toEqual({ data: { original: true }, modified: true });
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
          method: 'GET'
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
          method: 'GET'
        })
      );
    });
  });

  describe('请求任务处理', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('应该存储请求任务句柄', async () => {
      const mockTask = createMockRequestTask(); // 使用辅助函数创建
      vi.mocked(wx.request).mockImplementation(({ success }) => {
        // Reference wx.request directly
        // 使用更具体的类型或结构
        success?.({ data: 'test data', statusCode: 200, header: {} } as WechatMiniprogram.RequestSuccessCallbackResult<string>);
        // 返回具体的模拟任务对象
        return mockTask; // 无需断言，类型已匹配
      });

      await request.GET('/test');
      expect(request.taskHandle).toBe(mockTask);
    });
  });
});

describe('拦截器', () => {
  let interceptor: Interceptor<unknown, unknown>;

  beforeEach(() => {
    interceptor = new Interceptor();
  });

  it('应该按正确顺序执行中间件', async () => {
    const order: string[] = [];

    interceptor.use(async (ctx, next) => {
      order.push('before-1');
      await next();
      order.push('after-1');
    });

    interceptor.use(async (ctx, next) => {
      order.push('before-2');
      await next();
      order.push('after-2');
    });

    // 提供一个核心中间件作为第二个参数
    await interceptor.execute({} as BreezeContext<unknown, unknown>, async (ctx, next) => {
      order.push('core');
      await next();
    });

    expect(order).toEqual(['before-1', 'before-2', 'core', 'after-2', 'after-1']);
  });

  it('应该处理中间件错误', async () => {
    const errorHandler = vi.fn((err, ctx) => {
      ctx.errorHandled = true;
    });

    interceptor.use(async () => {
      throw new Error('Test error');
    });

    interceptor.catch(errorHandler);

    // 提供一个核心中间件作为第二个参数
    const context = await interceptor.execute({} as BreezeContext<unknown, unknown>, async (ctx, next) => {
      await next();
    });

    expect(errorHandler).toHaveBeenCalledTimes(1);
    expect(context.errorHandled).toBe(true);
    expect(context.error).toBeInstanceOf(Error);
  });

  it('应该组合多个拦截器', async () => {
    const interceptor1 = new Interceptor<unknown, unknown>();
    const middleware1 = async (ctx: BreezeContext<unknown, unknown>, next: BreezeNext) => {
      await next();
    };
    interceptor1.use(middleware1);

    const interceptor2 = new Interceptor<unknown, unknown>();
    const middleware2 = async (ctx: BreezeContext<unknown, unknown>, next: BreezeNext) => {
      await next();
    };
    interceptor2.use(middleware2);

    const composed = Interceptor.compose(interceptor1, interceptor2);
    expect(composed).toBeInstanceOf(Interceptor);

    // 不直接访问私有成员，而是通过调用execute方法间接验证
    // 创建一个追踪执行次数的变量
    let executionCount = 0;

    // 提供一个核心中间件作为第二个参数，每次经过中间件都增加计数
    await composed.execute({} as BreezeContext<unknown, unknown>, async (ctx, next) => {
      executionCount++;
      await next();
    });

    // 验证中间件数量（应该执行了2个用户中间件和1个核心中间件）
    expect(executionCount).toBe(1);
  });
});
