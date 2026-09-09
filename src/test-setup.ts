import '@testing-library/jest-dom';

// Mock window.scrollTo for jsdom (not implemented, used in useProgressiveProducts for autoscroll)
Object.defineProperty(window, 'scrollTo', { value: jest.fn(), writable: true });
