const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    send: (channel, data) => {
        // whitelist channels
        let validChannels = ['toMain'];
        if (validChannels.includes(channel)) {
            ipcRenderer.send(channel, data);
        }
    },
    receive: (channel, func) => {
        let validChannels = ['fromMain'];
        if (validChannels.includes(channel)) {
            // Deliberately strip event as it includes `sender` 
            ipcRenderer.on(channel, (event, ...args) => func(...args));
        }
    }
});

window.addEventListener('DOMContentLoaded', () => {
    const setIgnoreMouseEvents = (ignore, options) => {
        ipcRenderer.send('set-ignore-mouse-events', ignore, options);
    };

    window.addEventListener('mousemove', event => {
        // If hovering over html or body (transparent areas), let clicks pass through
        // Since .overlay has pointer-events: none, it won't be the target
        if (event.target === document.documentElement || event.target === document.body) {
            setIgnoreMouseEvents(true, { forward: true });
        } else {
            setIgnoreMouseEvents(false);
        }
    });

    // Also handle mouseleave to ensuring we don't get stuck
    document.body.addEventListener('mouseleave', () => {
        setIgnoreMouseEvents(true, { forward: true });
    });
});
