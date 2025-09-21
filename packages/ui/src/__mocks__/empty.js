// E:\Desktop\coding\my-projects-02\nobit-test\packages\ui\src\__mocks__\empty.js

import { vi } from "vitest";

// Svelte 5のコンポーネントは関数として扱えるため、vi.fn()でモックします。
// これにより、実際のアイコンがレンダリングされる代わりに、
// テスト用のダミー関数が呼び出され、エラーを回避できます。

export const IconHeart = vi.fn();
export const IconPhoto = vi.fn();
export const IconVideo = vi.fn();
export const IconSearch = vi.fn();
export const IconRefresh = vi.fn();
export const IconPencil = vi.fn();
