let ioInstance = null;

export const initSocket = (io) => {
  ioInstance = io;

  io.on('connection', (socket) => {
    // console.log(`[Socket] Dashboard client connected: ${socket.id}`);
    
    socket.emit('system_status', {
      connected: true,
      timestamp: Date.now()
    });

    socket.on('disconnect', () => {
      // console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });
};

export const broadcastRequestEvent = (logEntry) => {
  if (ioInstance) {
    ioInstance.emit('request_logged', logEntry);
  }
};

export const broadcastAbuseAlert = (alert) => {
  if (ioInstance) {
    ioInstance.emit('abuse_alert', alert);
  }
};

export const broadcastMetricsUpdate = (metrics) => {
  if (ioInstance) {
    ioInstance.emit('metrics_update', metrics);
  }
};
