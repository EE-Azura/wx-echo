/* eslint-disable @typescript-eslint/no-unused-vars */
// filepath: compat-tests/types.compat.test.ts
import { describe, it, expect } from 'vitest';

// 从 dist 目录导入主入口点的值和类型
import { Echo } from '../dist/wx-echo'; // <--- 修改这里：移除 'type'

// 从 dist 目录导入具体的类型定义 (根据 package.json 的 exports)
// 这些仍然只需要类型，可以保留 'import type'
import type { EchoContext, EchoMiddleware, EchoNext, EchoRequestOptions, EchoResponse, EchoRequestTask, EchoRequestHandle, EchoErrorHandler } from '../dist/types';

describe('兼容性测试：类型定义 (.d.ts)', () => {
  it('应该能正确导入主入口点的类型 (Echo) 并用作值', () => {
    // <--- 修改测试描述
    // 尝试声明 Echo 类型的变量
    // 这个测试的目的是确保 Echo 类型能够被识别和使用
    // 不需要实际实例化或调用方法，编译通过即表示类型可用
    const options: EchoRequestOptions = { url: '/api' };
    const mockRequest = (opts: EchoRequestOptions) => Promise.resolve({} as EchoResponse);
    const echoInstance: Echo = new Echo(options, mockRequest);

    // 检查 Echo 类型上是否存在预期的方法（类型层面）
    const methodCheck: keyof Echo = 'request';

    // 断言总是为 true，因为核心是编译时检查
    expect(echoInstance).toBeInstanceOf(Echo); // <--- 添加一个运行时检查
    expect(methodCheck).toBe('request');
    expect(true).toBe(true);
  });

  // ... existing code for '应该能正确导入 /types 入口点的具体类型' ...
  it('应该能正确导入 /types 入口点的具体类型', () => {
    // 尝试声明各种具体类型的变量
    // 使用 const 替代 let，因为这些变量只赋值一次
    const options: EchoRequestOptions = { url: 'test', method: 'GET', headers: { 'X-Test': 'test' } };
    const response: EchoResponse = { data: { result: 'ok' }, statusCode: 200, header: {}, cookies: [] };
    const context: EchoContext = { request: options, response: undefined, error: undefined, errorHandled: false };
    const task: EchoRequestTask = { abort: () => {} /* ... 其他 task 方法/属性 */ };
    const handle: EchoRequestHandle = Promise.resolve(response) as EchoRequestHandle; // 模拟 PromiseLike
    handle.getTask = () => task; // 允许修改 const 变量的属性
    const next: EchoNext = async () => {};
    const middleware: EchoMiddleware = async (ctx, nxt) => {
      ctx.request.headers!['X-Middleware'] = 'added';
      await nxt();
      if (ctx.response) {
        ctx.response.data = { ...ctx.response.data, processed: true };
      }
    };
    const errorHandler: EchoErrorHandler = (err, ctx) => {
      ctx.errorHandled = true;
      console.error(err);
    };

    // 断言总是为 true
    expect(typeof options.url).toBe('string');
    expect(typeof middleware).toBe('function');
    expect(typeof errorHandler).toBe('function');
    expect(true).toBe(true);
  });
});
