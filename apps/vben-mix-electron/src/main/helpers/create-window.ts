import {
  BrowserWindow,
  BrowserWindowConstructorOptions,
  Rectangle,
  screen,
} from 'electron';
import Store from 'electron-store';

interface WindowState {
  'window-state'?: Rectangle;
}

export const createWindow = (
  windowName: string,
  options: BrowserWindowConstructorOptions,
): BrowserWindow => {
  const key = 'window-state';
  const name = `window-state-${windowName}`;
  const store = new Store<WindowState>({ name });
  const defaultSize = {
    width: options.width || 800,
    height: options.height || 600,
  };
  let state: Partial<Rectangle> = {};

  const restore = (): Partial<Rectangle> =>
    (store as any).get(key) || defaultSize;

  const getCurrentPosition = (): Rectangle => {
    const position = win.getPosition();
    const size = win.getSize();
    return {
      x: position[0],
      y: position[1],
      width: size[0],
      height: size[1],
    };
  };

  const windowWithinBounds = (
    windowState: Rectangle,
    bounds: Rectangle,
  ): boolean => {
    return (
      windowState.x >= bounds.x &&
      windowState.y >= bounds.y &&
      windowState.x + windowState.width <= bounds.x + bounds.width &&
      windowState.y + windowState.height <= bounds.y + bounds.height
    );
  };

  const resetToDefaults = (): Rectangle => {
    // Only access screen after app is ready
    try {
      const bounds = screen.getPrimaryDisplay().bounds;
      return {
        ...defaultSize,
        x: (bounds.width - defaultSize.width) / 2,
        y: (bounds.height - defaultSize.height) / 2,
      };
    } catch {
      // Fallback if screen is not available
      return {
        ...defaultSize,
        x: 100,
        y: 100,
      };
    }
  };

  const ensureVisibleOnSomeDisplay = (
    windowState: Partial<Rectangle>,
  ): Rectangle => {
    const fullState = windowState as Rectangle;
    try {
      const visible = screen.getAllDisplays().some((display) => {
        return windowWithinBounds(fullState, display.bounds);
      });
      if (!visible) {
        return resetToDefaults();
      }
      return fullState;
    } catch {
      // Fallback if screen is not available
      return resetToDefaults();
    }
  };

  const saveState = (): void => {
    if (!win.isMinimized() && !win.isMaximized()) {
      Object.assign(state, getCurrentPosition());
    }
    (store as any).set(key, state);
  };

  state = ensureVisibleOnSomeDisplay(restore());

  const win = new BrowserWindow({
    ...state,
    ...options,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      ...options.webPreferences,
    },
  });

  win.on('close', saveState);

  return win;
};
