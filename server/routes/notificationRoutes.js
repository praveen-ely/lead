const express = require('express');
const router = express.Router();

// Store connected SSE clients
const clients = new Set();

// SSE endpoint for real-time notifications
router.get('/stream', (req, res) => {
  // Set headers for SSE
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  // Send initial connection message
  res.write('event: notification\ndata: {"type":"connected","title":"Notifications","message":"Connected to notification stream"}\n\n');

  // Add client to connected clients
  clients.add(res);

  // Send heartbeat every 30 seconds
  const heartbeat = setInterval(() => {
    try {
      res.write('event: heartbeat\ndata: {"type":"heartbeat","timestamp":"' + new Date().toISOString() + '"}\n\n');
    } catch (error) {
      clearInterval(heartbeat);
      clients.delete(res);
    }
  }, 30000);

  // Remove client on disconnect
  req.on('close', () => {
    clearInterval(heartbeat);
    clients.delete(res);
  });
});

// Send notification to all connected clients
const sendNotification = (type, data) => {
  const message = {
    id: data.id || `notif_${Date.now()}`,
    type,
    title: data.title || 'Lead Update',
    message: data.message || 'New leads are available.',
    userId: data.userId,
    url: data.url || '/leads',
    timestamp: new Date().toISOString()
  };

  const formattedMessage = `event: notification\ndata: ${JSON.stringify(message)}\n\n`;

  clients.forEach(client => {
    try {
      client.write(formattedMessage);
    } catch (error) {
      // Remove disconnected client
      clients.delete(client);
    }
  });

  console.log(`Notification sent to ${clients.size} clients:`, type, message);
};

// Manual notification endpoint (for testing)
router.post('/send', (req, res) => {
  try {
    const { type, data } = req.body;
    
    if (!type || !data) {
      return res.status(400).json({
        success: false,
        message: 'Type and data are required'
      });
    }

    sendNotification(type, data);

    res.json({
      success: true,
      message: 'Notification sent successfully',
      clientsCount: clients.size
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending notification',
      error: error.message
    });
  }
});

// Get notification system status
router.get('/status', (req, res) => {
  res.json({
    success: true,
    data: {
      connectedClients: clients.size,
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    }
  });
});

module.exports = { router, sendNotification };
