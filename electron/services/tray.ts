import { Tray, Menu, BrowserWindow, nativeImage, app, globalShortcut } from 'electron';
import path from 'path';
import fs from 'fs';

export class TrayService {
  private tray: Tray | null = null;
  private mainWindow: BrowserWindow | null = null;
  private onScanRequest?: () => void;
  private onSettingsRequest?: () => void;
  private onToggleModeRequest?: () => void;

  init(
    mainWindow: BrowserWindow,
    callbacks: {
      onScan: () => void;
      onSettings: () => void;
      onToggleMode: () => void;
    }
  ) {
    this.mainWindow = mainWindow;
    this.onScanRequest = callbacks.onScan;
    this.onSettingsRequest = callbacks.onSettings;
    this.onToggleModeRequest = callbacks.onToggleMode;

    const icon = this.createTrayIcon();
    this.tray = new Tray(icon);
    this.tray.setToolTip('LocalPort Manager — Control Center');

    this.updateContextMenu(0);

    this.tray.on('click', () => {
      this.toggleWindow();
    });
  }

  updateContextMenu(activeCount: number) {
    if (!this.tray) return;

    const contextMenu = Menu.buildFromTemplate([
      {
        label: `LocalPort Manager (${activeCount} activos)`,
        enabled: false,
      },
      { type: 'separator' },
      {
        label: 'Mostrar / Ocultar Ventana',
        click: () => this.toggleWindow(),
      },
      {
        label: 'Escanear Puertos Ahora',
        click: () => this.onScanRequest && this.onScanRequest(),
      },
      {
        label: 'Alternar Modo Widget / Completo',
        click: () => this.onToggleModeRequest && this.onToggleModeRequest(),
      },
      { type: 'separator' },
      {
        label: 'Configuración...',
        click: () => {
          if (this.mainWindow) {
            this.mainWindow.show();
            this.onSettingsRequest && this.onSettingsRequest();
          }
        },
      },
      { type: 'separator' },
      {
        label: 'Salir',
        click: () => {
          (app as any).isQuitting = true;
          app.quit();
        },
      },
    ]);

    this.tray.setContextMenu(contextMenu);
  }

  toggleWindow() {
    if (!this.mainWindow) return;
    if (this.mainWindow.isVisible()) {
      if (this.mainWindow.isFocused()) {
        this.mainWindow.hide();
      } else {
        this.mainWindow.focus();
      }
    } else {
      this.mainWindow.show();
      this.mainWindow.focus();
    }
  }

  registerShortcut(shortcut: string, onTrigger: () => void): boolean {
    try {
      globalShortcut.unregisterAll();
      return globalShortcut.register(shortcut, () => {
        onTrigger();
      });
    } catch (e) {
      console.warn('[TrayService] Could not register global shortcut:', shortcut, e);
      return false;
    }
  }

  private createTrayIcon(): Electron.NativeImage {
    const appDir = app.getAppPath();
    const candidatePaths = [
      path.join(appDir, 'assets', 'tray-icon.png'),
      path.join(appDir, 'assets', 'icon.ico'),
      path.resolve(__dirname, '../../assets/tray-icon.png'),
      path.resolve(__dirname, '../../assets/icon.ico'),
      path.resolve(__dirname, '../assets/tray-icon.png'),
    ];

    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        try {
          const img = nativeImage.createFromPath(p);
          if (!img.isEmpty()) {
            return img;
          }
        } catch {}
      }
    }

    // High-contrast Apple-style 32x32 squircle icon (Apple Blue gradient with glowing emerald port LED)
    const base64Icon =
      'iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAACdUlEQVR4nM2X3UrrQBSF1wv4KL07b5HblBpRgz/4E3+qCbZ5oT5An+LcplQUURRFFEXRFEVpCVsmzDSTSSaTKh7Ohu9mZu211kXatMB/PWHCaCBMLISJizDxECZthImPMAkUfH7nca3Fd78R3J046E766E5idCf0Q2Lu5ZiDO+M5dMY9dMb0S/TSDO0cffZw9ElVENGoCtN+mlE6wYeD4IN0mIILRSq80qzC+O99+O+kMmtwoUiJZ5qVm8M3RozDN5LRmiq6b+jjNHM6B6MGDkYkU2qkaHTU3G1kBfZfLey/kkzBQLk3UWPfygrsvbjYeyFBYVm6mwWDj5sV2H32sPtMgtySdC7489cppUxb4eVlBXae2th5IkahNT8X6MKnJRR9hV87K7D96GP7kRg5MT8TmMKnJZQ9jaefFdh6CLD1QIycmJ8J5BB1cgWUPY1nkBXYvA+weU+MnJifCWoXUPY0nlKBjbsAG3fEyIn5maB2AWVP4ykVWL8NsH5LjJyYnwlqF1D2NJ5SgbUbH2s3xMiJ+Zmg9kOo7Gk8pYdw9bqN1WtiFD42/FxgDFf0FX7Sx3DlysPKFQlyC9K5QBteoq3wkr6I3EsX7iUJCq2lu1kw+EhfxcsXFpYvSKawrNybqLEvvYyWzhtYOieZ0leqotFRc1d6HS+eMWIsnpGM9geGovuGPk4zc7Nw2sfCKanoTOtS5plmFcY5ceCckI6Zgyu80qzSmT/uYf6YqjAGG/bTDO20hnNoDXtoDemX6KUZxmkOHDQHfTQHMZoD+iEx96rx10wdO2I0YEcW7MiFHXmwozbsyIcdBQo+v/O41uK7s+f+y/kCVTu5h3afRhQAAAAASUVORK5CYII=';
    return nativeImage.createFromBuffer(Buffer.from(base64Icon, 'base64'));
  }

  destroy() {
    globalShortcut.unregisterAll();
    if (this.tray) {
      this.tray.destroy();
      this.tray = null;
    }
  }
}
