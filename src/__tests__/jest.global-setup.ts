// src/__tests__/jest.global-setup.ts
import { ConsoleLogger } from '../core/logging/console-logger';

beforeAll(() => {
    ConsoleLogger.testMode.silent = true;
    ConsoleLogger.testMode.capture = false;
});

afterEach(() => {
    ConsoleLogger.testMode.logs = [];
});