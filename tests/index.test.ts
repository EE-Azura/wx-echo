import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BreezeRequest } from '../src/breeze-request';
import { Interceptor } from '../src/Interceptor';

// 为微信小程序环境模拟 wx 全局对象
global.wx = {
  request: vi.fn()
} as any;

describe('BreezeRequest', () => {
  let request: BreezeRequest<any>;

  beforeEach(() => {
    vi.clearAllMocks();
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
      vi.mocked(wx.request).mockImplementation(({ success }) => {
        success?.({ data: 'test data', statusCode: 200 } as any);
        return {} as any;
      });
    });

    it('应该支持 GET 请求', async () => {
      const result = await request.GET('/test');
      expect(wx.request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: '/test',
          method: 'GET'
        })
      );
      expect(result).toEqual({ data: 'test data', statusCode: 200 });
    });

    it('应该支持 POST 请求', async () => {
      const data = { name: 'test' };
      await request.POST('/test', data);
      expect(wx.request).toHaveBeenCalledWith(
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
        success?.({ data: 'test' } as any);
        return {} as any;
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
        expect.objectContaining({
          headers: { 'X-Custom': 'Value' }
        })
      );
    });

    it('应该在中间件中修改响应', async () => {
      vi.mocked(wx.request).mockImplementation(({ success }) => {
        success?.({ data: { original: true } } as any);
        return {} as any;
      });

      request.use(async (ctx, next) => {
        await next();
        if (ctx.response) {
          ctx.response.modified = true;
        }
      });

      const result = await request.GET('/test');
      expect(result).toEqual({ data: { original: true }, modified: true });
    });
  });

  describe('错误处理', () => {
    it('应该捕获并处理错误', async () => {
      const error = new Error('Request failed');

      vi.mocked(wx.request).mockImplementation(({ fail }) => {
        fail?.(error as any);
        return {} as any;
      });

      request.catch((err, ctx) => {
        expect(err.message).toBe('Request failed');
        ctx.errorHandled = true;
        ctx.response = { error: true, message: err.message };
      });

      const result = await request.GET('/test');
      expect(result).toEqual({ error: true, message: 'Request failed' });
    });

    it('应该传播未处理的错误', async () => {
      const error = new Error('Unhandled error');

      vi.mocked(wx.request).mockImplementation(({ fail }) => {
        fail?.(error as any);
        return {} as any;
      });

      await expect(request.GET('/test')).rejects.toThrow('Unhandled error');
    });
  });

  describe('使用基础URL', () => {
    it('应该在请求前添加基础URL', async () => {
      request.useBaseUrl('https://api.example.com');

      await request.GET('/users');
      expect(wx.request).toHaveBeenCalledWith(
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
        expect.objectContaining({
          url: 'https://other-api.com/users',
          method: 'GET'
        })
      );
    });
  });

  describe('请求任务处理', () => {
    it('应该存储请求任务句柄', async () => {
      const mockTask = { abort: vi.fn() };
      vi.mocked(wx.request).mockReturnValue(mockTask as any);

      await request.GET('/test');
      expect(request.taskHandle).toBe(mockTask);
    });
  });
});

describe('拦截器', () => {
  let interceptor: Interceptor;

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

    await interceptor.execute({} as any);
    expect(order).toEqual(['before-1', 'before-2', 'after-2', 'after-1']);
  });

  it('应该处理中间件错误', async () => {
    const errorHandler = vi.fn((err, ctx) => {
      ctx.errorHandled = true;
    });

    interceptor.use(async () => {
      throw new Error('Test error');
    });

    interceptor.catch(errorHandler);

    const context = await interceptor.execute({} as any);
    expect(errorHandler).toHaveBeenCalledTimes(1);
    expect(context.errorHandled).toBe(true);
    expect(context.error).toBeInstanceOf(Error);
  });

  it('应该组合多个拦截器', () => {
    const interceptor1 = new Interceptor();
    const middleware1 = async (ctx: any, next: any) => {
      await next();
    };
    interceptor1.use(middleware1);

    const interceptor2 = new Interceptor();
    const middleware2 = async (ctx: any, next: any) => {
      await next();
    };
    interceptor2.use(middleware2);

    const composed = Interceptor.compose(interceptor1, interceptor2);
    expect(composed).toBeInstanceOf(Interceptor);
    expect((composed as any).middleware.length).toBe(2);
  });
});
