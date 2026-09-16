import { LocalPortApi } from '../../electron/preload';

declare global {
  interface Window {
    api: LocalPortApi;
  }
}
