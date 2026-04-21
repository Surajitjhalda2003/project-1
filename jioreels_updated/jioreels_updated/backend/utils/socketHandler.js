const onlineUsers = new Map();

const socketHandler = (io) => {
  io.on('connection', (socket) => {
    const userId = socket.handshake.query.userId;

    if (userId && userId !== 'undefined') {
      onlineUsers.set(userId, socket.id);
      socket.join(userId);
      io.emit('online_users', Array.from(onlineUsers.keys()));
      console.log(`🟢 User ${userId} connected`);
    }

    socket.on('join_conversation', (conversationId) => {
      socket.join(`conv_${conversationId}`);
    });

    socket.on('leave_conversation', (conversationId) => {
      socket.leave(`conv_${conversationId}`);
    });

    socket.on('typing', ({ conversationId, userId }) => {
      socket.to(`conv_${conversationId}`).emit('user_typing', { userId });
    });

    socket.on('stop_typing', ({ conversationId, userId }) => {
      socket.to(`conv_${conversationId}`).emit('user_stop_typing', { userId });
    });

    socket.on('disconnect', () => {
      if (userId) {
        onlineUsers.delete(userId);
        io.emit('online_users', Array.from(onlineUsers.keys()));
        console.log(`🔴 User ${userId} disconnected`);
      }
    });
  });
};

module.exports = { socketHandler, onlineUsers };
