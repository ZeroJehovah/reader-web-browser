'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('windowConfig', {
  getCurrent: () => ipcRenderer.invoke('window-config:get'),
  update: (bounds) => ipcRenderer.invoke('window-config:update', bounds),
  close: () => ipcRenderer.send('window-config:close'),
  onBoundsChanged: (callback) => {
    const listener = (_event, bounds) => callback(bounds);
    ipcRenderer.on('window-config:changed', listener);
    return () => ipcRenderer.removeListener('window-config:changed', listener);
  }
});
