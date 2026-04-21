const Conversation = require('../models/Conversation');

// @GET /api/chat/conversations
exports.getConversations = async (req, res) => {
  try {
    const convs = await Conversation.find({ participants: req.user._id })
      .sort({ lastMessageAt: -1 })
      .populate('participants', 'username profilePic isVerified lastSeen');
    res.json({ success: true, conversations: convs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/chat/:userId
exports.getOrCreateConversation = async (req, res) => {
  try {
    let conv = await Conversation.findOne({
      participants: { $all: [req.user._id, req.params.userId] },
    }).populate('participants', 'username profilePic isVerified lastSeen');

    if (!conv) {
      conv = await Conversation.create({ participants: [req.user._id, req.params.userId] });
      await conv.populate('participants', 'username profilePic isVerified lastSeen');
    }

    res.json({ success: true, conversation: conv });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @POST /api/chat/:conversationId/message
exports.sendMessage = async (req, res) => {
  try {
    const { text } = req.body;
    const conv = await Conversation.findById(req.params.conversationId);
    if (!conv) return res.status(404).json({ success: false, message: 'Conversation not found' });

    const msg = { sender: req.user._id, text: text || '', mediaType: 'text' };
    if (req.file) {
      msg.mediaUrl = req.file.path;
      msg.mediaType = 'image';
    }

    conv.messages.push(msg);
    conv.lastMessage = text || '📷 Photo';
    conv.lastMessageAt = Date.now();
    await conv.save();

    const newMsg = conv.messages[conv.messages.length - 1];

    // Emit to other participant
    const otherId = conv.participants.find(p => p.toString() !== req.user._id.toString());
    req.io.to(otherId.toString()).emit('new_message', { conversationId: conv._id, message: newMsg });

    res.status(201).json({ success: true, message: newMsg });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
