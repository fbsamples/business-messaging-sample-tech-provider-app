import express from 'express';
import { inboxService } from '../services/inboxService';
import { instagramService } from '../services/instagramService';
import { InboxMessage } from '../types/message';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Get all conversations in the inbox
router.get('/conversations', (_req, res) => {
  try {
    const conversations = inboxService.getAllConversations();
    res.json(conversations);
  } catch (error) {
    console.error('Error getting conversations:', error);
    res.status(500).json({ error: 'Failed to get conversations' });
  }
});

// Send a message
router.post('/send', async (req, res) => {
  try {
    const { to, type, platform, content, imageUrl, templateName, businessId } = req.body;

    if (!to || !type || !platform || !content) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    let result;
    let messageId;

    switch (platform) {
      case 'instagram':
        result = await instagramService.sendMessage({
          to,
          type,
          content,
          imageUrl,
          templateName
        }, businessId);
        messageId = result.messageId;
        break;

      case 'messenger':
        // Mock implementation for Messenger
        result = {
          success: true,
          messageId: `messenger_mock_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
        };
        messageId = result.messageId;
        break;

      default:
        return res.status(400).json({ error: 'Unsupported platform' });
    }

    if (result.success) {
      // For Instagram, try to get user profile to enhance the message
      let instagramProfile;
      if (platform === 'instagram' && businessId) {
        try {
          const profileResult = await instagramService.getUserProfile(to, businessId);
          if (profileResult.success && profileResult.profile) {
            instagramProfile = profileResult.profile;
          }
        } catch (error) {
          console.error('Error fetching Instagram profile for outbound message:', error);
        }
      }

      // Create the message object for the inbox
      const message: InboxMessage = {
        id: messageId || uuidv4(),
        from: 'business', // Messages sent by us are from business
        to,
        content,
        type,
        timestamp: new Date(),
        direction: 'outbound',
        status: 'sent',
        platform,
        imageUrl,
        templateName,
        contactName: instagramProfile ? (instagramProfile.name || instagramProfile.username) : to,
        instagramProfile
      };

      // Add to inbox
      inboxService.addMessage(message);

      res.json({
        success: true,
        messageId,
        message
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to send message'
      });
    }
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});


// Mark conversation as read (used when user clicks on a conversation)
router.post('/conversations/:contactId/read', (req, res) => {
  try {
    const { contactId } = req.params;
    inboxService.markConversationAsRead(contactId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking conversation as read:', error);
    res.status(500).json({ error: 'Failed to mark conversation as read' });
  }
});

// Search conversations (used in search field)
router.get('/search', (req, res) => {
  try {
    const { q } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const results = inboxService.searchMessages(q);
    res.json(results);
  } catch (error) {
    console.error('Error searching messages:', error);
    res.status(500).json({ error: 'Failed to search messages' });
  }
});

// Delete conversation (not used currently)
router.delete('/conversations/:contactId', (req, res) => {
  try {
    const { contactId } = req.params;
    const deleted = inboxService.deleteConversation(contactId);

    if (deleted) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Conversation not found' });
    }
  } catch (error) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
});

// Get Instagram user profile
router.get('/instagram/profile/:igsid', async (req, res) => {
  try {
    const { igsid } = req.params;
    const { businessId } = req.query;

    if (!igsid) {
      return res.status(400).json({ error: 'IGSID is required' });
    }

    const result = await instagramService.getUserProfile(igsid, businessId as string);

    if (result.success) {
      res.json({
        success: true,
        profile: result.profile
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to fetch Instagram user profile'
      });
    }
  } catch (error) {
    console.error('Error fetching Instagram user profile:', error);
    res.status(500).json({ error: 'Failed to fetch Instagram user profile' });
  }
});

// Get unread messages count
router.get('/unread-count', (_req, res) => {
  try {
    const count = inboxService.getUnreadCount();
    res.json({ count });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
});

export default router;
