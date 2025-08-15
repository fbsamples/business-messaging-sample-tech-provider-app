import dotenv from 'dotenv';

dotenv.config();

export class InstagramConfig {
  public readonly apiVersion: string;
  public readonly apiUrl: string;
  public readonly verifyToken: string;
  public readonly webhookUrl: string;

  constructor() {
    this.apiVersion = process.env.INSTAGRAM_API_VERSION || 'v23.0';
    this.apiUrl = `https://graph.instagram.com/${this.apiVersion}`;
    this.verifyToken = process.env.INSTAGRAM_VERIFY_TOKEN || 'instagram_verify_token_123';
    this.webhookUrl = process.env.INSTAGRAM_WEBHOOK_URL || 'http://localhost:3001/webhook/instagram';
  }

  validateConfig(): boolean {
    return this.verifyToken.length > 0;
  }

  getHeaders(accessToken: string): Record<string, string> {
    return {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };
  }
}

export const instagramConfig = new InstagramConfig();
