/**
 * Mock for superjson module
 * Used in Jest tests to avoid ESM import issues
 */

const superjson = {
  serialize: (value: unknown) => ({ json: value, meta: undefined }),
  deserialize: (value: { json: unknown }) => value.json,
  parse: (value: string) => JSON.parse(value),
  stringify: (value: unknown) => JSON.stringify(value),
  registerClass: jest.fn(),
  registerCustom: jest.fn(),
  registerSymbol: jest.fn(),
};

export default superjson;
export { superjson };
