import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BreezeRequest } from '../src/breeze-request';

// 模拟 fetch API，用于替代 wx.request
global.fetch = vi.fn();

// 模拟成功响应
const mockSuccessResponse = (data: unknown) => {
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
    headers: {
      get: (name: string) => (name === 'content-type' ? 'application/json' : null)
    },
    status: 200,
    statusText: 'OK'
  });
};

// 模拟失败响应
const mockErrorResponse = (status: number, message: string) => {
  return Promise.resolve({
    ok: false,
    json: () => Promise.resolve({ error: message }),
    text: () => Promise.resolve(message),
    headers: {
      get: (name: string) => (name === 'content-type' ? 'application/json' : null)
    },
    status,
    statusText: message
  });
};

// 为HTTP错误定义接口
interface RequestError extends Error {
  response?: Response;
}

// 自定义请求处理函数，替代默认的 wx.request
const customRequest = ({ url, data, options, method = 'GET' }: { url: string; data?: unknown; options?: Record<string, unknown>; method?: string }) => {
  // 在 Node 环境中使用 fetch 替代 wx.request
  return fetch(url, {
    method,
    headers: options?.headers as HeadersInit | undefined,
    body: data ? JSON.stringify(data) : undefined,
    ...options
  }).then(async response => {
    if (!response.ok) {
      const error = new Error(`HTTP Error: ${response.status}`) as RequestError;
      error.response = response;
      throw error;
    }

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return response.json();
    }
    return response.text();
  });
};

describe('BreezeRequest', () => {
  let request: BreezeRequest;

  beforeEach(() => {
    // 重置 fetch 模拟
    vi.resetAllMocks();

    // 创建新的 BreezeRequest 实例，使用自定义请求函数
    request = new BreezeRequest(
      {
        baseURL: 'https://api.example.com',
        headers: {
          'Content-Type': 'application/json'
        }
      },
      customRequest
    );
  });

  describe('基本请求功能', () => {
    it('应该能够创建实例', () => {
      expect(request).toBeDefined();
      expect(typeof request.GET).toBe('function');
    });

    it('应该发送基本的 GET 请求', async () => {
      const mockData = { id: 1, name: 'Test' };
      (global.fetch as any).mockResolvedValueOnce(mockSuccessResponse(mockData));

      const result = await request.GET('/users/1');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/users/1',
        expect.objectContaining({
          method: 'GET'
        })
      );
      expect(result).toEqual(mockData);
    });

    it('应该发送带参数的 GET 请求', async () => {
      const mockData = [
        { id: 1, name: 'User 1' },
        { id: 2, name: 'User 2' }
      ];
      (global.fetch as any).mockResolvedValueOnce(mockSuccessResponse(mockData));

      const params = { page: 1, limit: 10 };
      await request.GET('/users', params);

      expect(global.fetch).toHaveBeenCalledWith('https://api.example.com/users?page=1&limit=10', expect.objectContaining({ method: 'GET' }));
    });

    it('应该发送 POST 请求并包含请求体', async () => {
      const mockData = { id: 3, name: 'New User' };
      const requestBody = { name: 'New User' };
      (global.fetch as any).mockResolvedValueOnce(mockSuccessResponse(mockData));

      await request.POST('/users', requestBody);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/users',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(requestBody)
        })
      );
    });
  });

  describe('HTTP 方法', () => {
    it('应该支持所有 HTTP 方法', async () => {
      const mockData = { success: true };
      (global.fetch as any).mockResolvedValue(mockSuccessResponse(mockData));

      const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];

      for (const method of methods) {
        await request[method]('/test');

        expect(global.fetch).toHaveBeenLastCalledWith('https://api.example.com/test', expect.objectContaining({ method }));
      }
    });
  });

  describe('中间件功能', () => {
    it('应该执行请求前中间件', async () => {
      const mockData = { id: 1 };
      (global.fetch as any).mockResolvedValueOnce(mockSuccessResponse(mockData));

      const requestSpy = vi.fn();
      request.use(async (ctx: any, next: Function) => {
        requestSpy(ctx.request);
        ctx.request.headers = { ...ctx.request.headers, 'X-Custom': 'Test' };
        await next();
      });

      await request.GET('/test');

      expect(requestSpy).toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/test',
        expect.objectContaining({
          headers: expect.objectContaining({ 'X-Custom': 'Test' })
        })
      );
    });

    it('应该执行响应后中间件', async () => {
      const mockData = { id: 1 };
      (global.fetch as any).mockResolvedValueOnce(mockSuccessResponse(mockData));

      const responseSpy = vi.fn();
      request.use(async (ctx: any, next: Function) => {
        await next();
        responseSpy(ctx.response);
        // 修改响应数据
        ctx.response.extra = 'added';
      });

      const result = await request.GET('/test');

      expect(responseSpy).toHaveBeenCalledWith(mockData);
      expect(result).toEqual({ ...mockData, extra: 'added' });
    });

    it('应该按照正确顺序执行中间件链', async () => {
      const mockData = { id: 1 };
      (global.fetch as any).mockResolvedValueOnce(mockSuccessResponse(mockData));

      const order: number[] = [];

      request.use(async (ctx: any, next: Function) => {
        order.push(1);
        await next();
        order.push(6);
      });

      request.use(async (ctx: any, next: Function) => {
        order.push(2);
        await next();
        order.push(5);
      });

      request.use(async (ctx: any, next: Function) => {
        order.push(3);
        await next();
        order.push(4);
      });

      await request.GET('/test');

      expect(order).toEqual([1, 2, 3, 4, 5, 6]);
    });
  });

  describe('错误处理', () => {
    it('应该捕获请求错误', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network Error'));

      await expect(request.GET('/test')).rejects.toThrowError('Network Error');
    });

    it('应该处理 HTTP 错误状态码', async () => {
      (global.fetch as any).mockResolvedValueOnce(mockErrorResponse(404, 'Not Found'));

      await expect(request.GET('/not-exist')).rejects.toThrowError('HTTP Error: 404');
    });

    it('应该使用错误处理中间件', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('API Error'));

      const errorSpy = vi.fn();
      request.catch((err: Error, ctx: any) => {
        errorSpy(err);
        ctx.errorHandled = true;
        ctx.response = { error: err.message, fixed: true };
      });

      const result = await request.GET('/test');

      expect(errorSpy).toHaveBeenCalled();
      expect(result).toEqual({ error: 'API Error', fixed: true });
    });

    it('应该允许多个错误处理器', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('API Error'));

      const errorSpies = [vi.fn(), vi.fn(), vi.fn()];

      request.catch((err: Error, ctx: any) => {
        errorSpies[0](err);
        // 不标记为已处理，继续传播
      });

      request.catch((err: Error, ctx: any) => {
        errorSpies[1](err);
        ctx.response = { partial: true };
        // 不标记为已处理，继续传播
      });

      request.catch((err: Error, ctx: any) => {
        errorSpies[2](err);
        ctx.errorHandled = true;
        ctx.response = { ...ctx.response, complete: true };
      });

      const result = await request.GET('/test');

      errorSpies.forEach(spy => expect(spy).toHaveBeenCalled());
      expect(result).toEqual({ partial: true, complete: true });
    });
  });

  describe('高级功能', () => {
    it('应该处理完整的 URL', async () => {
      const mockData = { success: true };
      (global.fetch as any).mockResolvedValueOnce(mockSuccessResponse(mockData));

      await request.GET('https://other-api.com/test');

      expect(global.fetch).toHaveBeenCalledWith('https://other-api.com/test', expect.anything());
    });

    it('应该合并自定义选项', async () => {
      const mockData = { success: true };
      (global.fetch as any).mockResolvedValueOnce(mockSuccessResponse(mockData));

      await request.GET('/test', null, {
        credentials: 'include',
        headers: { 'X-Custom': 'Value' }
      });

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/test',
        expect.objectContaining({
          credentials: 'include',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-Custom': 'Value'
          })
        })
      );
    });
  });
});
