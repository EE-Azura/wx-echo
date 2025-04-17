import { describe, it, expect, vi } from 'vitest';
import { createRequire } from 'module';

// 模拟一个简单的请求函数，避免实际网络调用
const mockRequest = vi.fn().mockResolvedValue({ data: 'mock response', statusCode: 200, header: {} });

describe('兼容性测试：ESM', () => {
  it('应该能通过 ESM 方式导入 Echo 并正常实例化和使用基本方法', async () => {
    // 从 dist 目录导入 ESM 版本
    const { Echo } = await import('../dist/wx-echo.js');

    // 实例化时传入模拟请求函数
    const echo = new Echo({}, mockRequest);
    expect(echo).toBeInstanceOf(Echo);

    // 测试 use 方法
    const middleware = vi.fn(async (ctx, next) => {
      await next();
    });
    echo.use(middleware);
    expect(echo.use).toBeDefined(); // 确认方法存在

    // 测试 request 方法 (不验证具体结果，只确保能调用)
    const req = echo.request('test/url');
    expect(req).toBeInstanceOf(Promise);
    expect(req.getTask).toBeInstanceOf(Function);

    // 简单调用以触发中间件和模拟请求 (可选，取决于是否需要验证调用链)
    await req;
    expect(middleware).toHaveBeenCalled();
    expect(mockRequest).toHaveBeenCalledWith(expect.objectContaining({ url: 'test/url' }));

    // 测试快捷方法
    expect(echo.GET).toBeInstanceOf(Function);
    expect(echo.POST).toBeInstanceOf(Function);
  });
});

describe('兼容性测试：CommonJS', async () => {
  it('应该能通过 CommonJS 方式导入 Echo 并正常实例化和使用基本方法', async () => {
    const require = createRequire(import.meta.url);
    // 从 dist 目录导入 CJS 版本
    const { Echo } = require('../dist/wx-echo.cjs');

    // 实例化时传入模拟请求函数
    const echo = new Echo({}, mockRequest);
    expect(echo).toBeInstanceOf(Echo);

    // 测试 use 方法
    const middleware = vi.fn(async (ctx, next) => {
      await next();
    });
    echo.use(middleware);
    expect(echo.use).toBeDefined();

    // 测试 request 方法
    const req = echo.request('test/url/cjs');
    expect(req).toBeInstanceOf(Promise);
    expect(req.getTask).toBeInstanceOf(Function);

    // 简单调用
    await req;
    expect(middleware).toHaveBeenCalled();
    expect(mockRequest).toHaveBeenCalledWith(expect.objectContaining({ url: 'test/url/cjs' }));

    // 测试快捷方法
    expect(echo.GET).toBeInstanceOf(Function);
    expect(echo.POST).toBeInstanceOf(Function);
  });
});
