'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('windowSizeDialog', {
  getCurrent: () => ipcRenderer.invoke('window-size:get'),
  apply: (width, height) => ipcRenderer.invoke('window-size:apply', { width, height }),
  cancel: () => ipcRenderer.send('window-size:cancel')
});
