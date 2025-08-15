import { instagramConfig } from '../config/instagram';
import { getBusinessAccessToken } from '../routes/instagramAuth';
import {
  InstagramSendMessageRequest,
  InstagramSendMessageResponse,
  InstagramUserProfileResponse,
  InstagramUserProfile
} from '../types/instagram';

export class InstagramService {
  private static instance: InstagramService;

  public static getInstance(): InstagramService {
    if (!InstagramService.instance) {
      InstagramService.instance = new InstagramService();
    }
    return InstagramService.instance;
  }

  async sendMessage(request: InstagramSendMessageRequest, businessId?: string): Promise<InstagramSendMessageResponse> {
    try {
      // Get access token - either from business OAuth or fallback
      let accessToken: string | undefined;
      if (businessId) {
        const businessToken = getBusinessAccessToken(businessId);
        if (businessToken) {
          accessToken = businessToken;
        }
      }

      if (!accessToken) {
        return {
          success: true,
          messageId: `ig_mock_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
        };
      }

      const payload = this.buildMessagePayload(request);
      const apiUrl = `${instagramConfig.apiUrl}/me/messages`;
      const headers = instagramConfig.getHeaders(accessToken);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: { message: errorText } };
        }

        const errorMessage = errorData?.error?.message || errorData?.message || `HTTP ${response.status}`;
        const errorCode = errorData?.error?.code;
        const errorSubcode = errorData?.error?.error_subcode;


        // Provide user-friendly error messages for common Instagram API errors
        let userFriendlyMessage = errorMessage;
        const statusCode = response.status;

        // Check for the specific "outside of allowed window" error first
        if (errorMessage?.toLowerCase().includes('outside of allowed window') ||
            errorMessage?.toLowerCase().includes('sent outside of allowed window')) {
          userFriendlyMessage = "Message sent outside of available window";
        } else if (statusCode === 403) {
          if (errorCode === 10 && errorSubcode === 2534022) {
            userFriendlyMessage = "Message sent outside of available window";
          } else {
            userFriendlyMessage = "You don't have permission to message this user. They may need to follow your account or message you first.";
          }
        } else if (statusCode === 400) {
          if (errorMessage?.includes('Invalid user ID')) {
            userFriendlyMessage = "Invalid user ID. The user may have deactivated their account.";
          } else if (errorMessage?.includes('Message content')) {
            userFriendlyMessage = "Message content is invalid or contains restricted content.";
          }
        } else if (statusCode === 429) {
          userFriendlyMessage = "Rate limit exceeded. Please wait a moment before sending another message.";
        } else if (statusCode >= 500) {
          userFriendlyMessage = "Instagram service is temporarily unavailable. Please try again later.";
        }

        return {
          success: false,
          error: userFriendlyMessage
        };
      }

      const responseData = await response.json() as any;

      return {
        success: true,
        messageId: responseData.message_id || responseData.id
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  private buildMessagePayload(request: InstagramSendMessageRequest): any {
    const payload: any = {
      recipient: {
        id: request.to
      }
    };

    if (request.type === 'text') {
      payload.message = {
        text: request.content
      };
    } else if (request.type === 'image' && request.imageUrl) {
      payload.message = {
        attachment: {
          type: 'image',
          payload: {
            url: request.imageUrl
          }
        }
      };
    }

    return payload;
  }

  async getUserProfile(igsid: string, businessId?: string): Promise<InstagramUserProfileResponse> {
    try {
      let accessToken: string | undefined;
      if (businessId) {
        const businessToken = getBusinessAccessToken(businessId);
        if (businessToken) {
          accessToken = businessToken;
        }
      }

      if (!accessToken) {
        return {
          success: true,
          profile: {
            name: `User ${igsid.slice(-4)}`,
            username: `user_${igsid.slice(-4)}`,
            profile_pic: '',
            follower_count: 0,
            is_user_follow_business: false,
            is_business_follow_user: false
          }
        };
      }

      const apiUrl = `${instagramConfig.apiUrl}/${igsid}`;
      const params = {
        fields: 'name,username,profile_pic,follower_count,is_user_follow_business,is_business_follow_user',
        access_token: accessToken
      };

      const url = new URL(apiUrl);
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });

      const response = await fetch(url.toString());

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: { message: errorText } };
        }

        const errorMessage = errorData?.error?.message || errorData?.message || `HTTP ${response.status}`;
        const statusCode = response.status;


        // Provide user-friendly error messages
        let userFriendlyMessage = errorMessage;

        // Check for the specific "outside of allowed window" error first
        if (errorMessage?.toLowerCase().includes('outside of allowed window') ||
            errorMessage?.toLowerCase().includes('sent outside of allowed window')) {
          userFriendlyMessage = "Message sent outside of available window";
        } else if (statusCode === 403) {
          userFriendlyMessage = "Access denied to user profile";
        } else if (statusCode === 400) {
          userFriendlyMessage = "Invalid user ID";
        } else if (statusCode === 429) {
          userFriendlyMessage = "Rate limit exceeded";
        } else if (statusCode >= 500) {
          userFriendlyMessage = "Instagram service temporarily unavailable";
        }

        return {
          success: false,
          error: userFriendlyMessage
        };
      }

      const profileData = await response.json() as any;

      // Handle empty or invalid profile_pic
      if (!profileData.profile_pic || profileData.profile_pic.trim() === '') {
        profileData.profile_pic = '';
      }

      return {
        success: true,
        profile: profileData as InstagramUserProfile
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async validateWebhook(mode: string, token: string, challenge: string): Promise<{ valid: boolean; challenge?: string }> {
    if (mode === 'subscribe' && token === instagramConfig.verifyToken) {
      return { valid: true, challenge };
    }
    return { valid: false };
  }
}

export const instagramService = InstagramService.getInstance();
