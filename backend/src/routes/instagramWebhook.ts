import express from 'express';
import { instagramConfig } from '../config/instagram';
import { inboxService } from '../services/inboxService';
import { instagramService } from '../services/instagramService';
import { InboxMessage } from '../types/message';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Instagram webhook verification (GET request)
router.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === instagramConfig.verifyToken) {
    res.status(200).send(challenge);
  } else {
    res.status(403).send('Forbidden');
  }
});

// Instagram webhook message handling (POST request)
router.post('/', (req, res) => {
  try {
    const payload = req.body;

    if (payload.object === 'instagram') {
      payload.entry.forEach((entry: any) => {
        if (entry.messaging && Array.isArray(entry.messaging)) {
          entry.messaging.forEach((messagingEvent: any) => {
            processInstagramMessage(messagingEvent);
          });
        }
      });
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Error processing Instagram webhook:', error);
    res.status(500).send('Internal Server Error');
  }
});

async function processInstagramMessage(messagingEvent: any) {
  const { sender, recipient, message, timestamp } = messagingEvent;

  if (!message || !sender || !recipient) {
    console.log('Invalid messaging event structure');
    return;
  }

  // Skip echo messages (messages sent by our app)
  if (message.is_echo || message.is_self) {
    console.log('Skipping echo/self message');
    return;
  }

  // Skip deleted or unsupported messages
  if (message.is_deleted || message.is_unsupported) {
    console.log('Skipping deleted/unsupported message');
    return;
  }

  let content = '';
  let imageUrl: string | undefined;
  let messageType: 'text' | 'image' | 'template' = 'text';

  // Process message content
  if (message.text) {
    content = message.text;
    messageType = 'text';
  } else if (message.attachments && Array.isArray(message.attachments)) {
    const attachment = message.attachments[0];
    if (attachment.type === 'image') {
      content = 'Image';
      imageUrl = attachment.payload?.url;
      messageType = 'image';
    } else {
      content = `Attachment: ${attachment.type}`;
      messageType = 'text';
    }
  } else {
    content = 'Unsupported message type';
    messageType = 'text';
  }

  // For Instagram, we need to determine direction differently since we don't store our own IG_ID
  // If the message has sender and recipient, it's typically inbound (customer to business)
  const isInbound = true; // Most webhook messages are inbound from customers
  const fromId = sender.id;

  // Fetch Instagram user profile
  let instagramProfile;
  let contactName = fromId; // Default fallback

  try {
    // Try to get the first available business token for profile lookup
    const { getAuthenticatedBusinesses } = require('./instagramAuth');
    const businesses = getAuthenticatedBusinesses();
    const businessId = businesses.length > 0 ? businesses[0].businessId : undefined;

    const profileResult = await instagramService.getUserProfile(fromId, businessId);
    if (profileResult.success && profileResult.profile) {
      instagramProfile = profileResult.profile;
      contactName = profileResult.profile.name || profileResult.profile.username || fromId;
    }
  } catch (error) {
    console.error('Error fetching Instagram user profile:', error);
    // Continue with default values
  }

  const inboxMessage: InboxMessage = {
    id: message.mid || uuidv4(),
    from: isInbound ? fromId : 'business',
    to: isInbound ? 'business' : fromId,
    content,
    type: messageType,
    timestamp: new Date(timestamp * 1000), // Instagram timestamp is in seconds
    direction: isInbound ? 'inbound' : 'outbound',
    status: 'delivered',
    platform: 'instagram',
    imageUrl,
    contactName,
    instagramProfile
  };

  inboxService.addMessage(inboxMessage);
  console.log('Added Instagram message to inbox:', inboxMessage);
}


export default router;
