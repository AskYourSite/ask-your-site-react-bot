import { ChatbotConfig, ChatRequest, ChatResponse, ConfigResponse, CachedConfig, Message } from './types';

const DEFAULT_API_BASE_URL = 'https://api.askmysite.com';
const CONFIG_CACHE_KEY = 'askmysite_config';
const SESSION_TOKEN_KEY = 'askmysite_session';
const MESSAGES_KEY = 'askmysite_messages';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export class AskMySiteService {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl?: string) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl || DEFAULT_API_BASE_URL;
  }

  // ============================================================================
  // CONFIG CACHING (24h localStorage)
  // ============================================================================

  private getCachedConfig(): ChatbotConfig | null {
    try {
      const cached = localStorage.getItem(CONFIG_CACHE_KEY);
      if (!cached) return null;

      const { data, timestamp }: CachedConfig = JSON.parse(cached);
      const isExpired = Date.now() - timestamp > CACHE_DURATION;

      return isExpired ? null : data;
    } catch (error) {
      console.error('Error reading cached config:', error);
      return null;
    }
  }

  private setCachedConfig(config: ChatbotConfig): void {
    try {
      const cached: CachedConfig = {
        data: config,
        timestamp: Date.now(),
      };
      localStorage.setItem(CONFIG_CACHE_KEY, JSON.stringify(cached));
    } catch (error) {
      console.error('Error caching config:', error);
    }
  }

  async fetchConfig(): Promise<ChatbotConfig> {
    // Check cache first
    const cachedConfig = this.getCachedConfig();
    if (cachedConfig) {
      return cachedConfig;
    }

    // Fetch from API if cache expired or missing
    try {
      const response = await fetch(`${this.baseUrl}/api/chatbot/config`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch config: ${response.statusText}`);
      }

      const result: ConfigResponse = await response.json();

      if (!result.success || !result.config) {
        throw new Error('Failed to fetch chatbot configuration');
      }

      // Cache for 24 hours
      this.setCachedConfig(result.config);

      return result.config;
    } catch (error) {
      console.error('Error fetching chatbot config:', error);
      throw error;
    }
  }

  // ============================================================================
  // SESSION TOKEN MANAGEMENT
  // ============================================================================

  getSessionToken(): string | null {
    try {
      return localStorage.getItem(SESSION_TOKEN_KEY);
    } catch (error) {
      console.error('Error reading session token:', error);
      return null;
    }
  }

  private setSessionToken(token: string): void {
    try {
      localStorage.setItem(SESSION_TOKEN_KEY, token);
    } catch (error) {
      console.error('Error saving session token:', error);
    }
  }

  // ============================================================================
  // MESSAGE PERSISTENCE
  // ============================================================================

  getStoredMessages(): Message[] {
    try {
      const stored = localStorage.getItem(MESSAGES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error reading stored messages:', error);
      return [];
    }
  }

  saveMessages(messages: Message[]): void {
    try {
      localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
    } catch (error) {
      console.error('Error saving messages:', error);
    }
  }

  clearMessages(): void {
    try {
      localStorage.removeItem(MESSAGES_KEY);
    } catch (error) {
      console.error('Error clearing messages:', error);
    }
  }

  // ============================================================================
  // CHAT API (Auto-creates session)
  // ============================================================================

  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    try {
      const sessionToken = this.getSessionToken();
      
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      };

      // Add session token if exists (backend auto-creates if missing)
      if (sessionToken) {
        headers['X-Session-Token'] = sessionToken;
      }

      const response = await fetch(`${this.baseUrl}/api/chatbot/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.statusText}`);
      }

      const result: ChatResponse = await response.json();

      if (!result.success || !result.message) {
        throw new Error('Failed to get chat response');
      }

      // Store new session token if this was first message
      if (result.sessionToken) {
        this.setSessionToken(result.sessionToken);
      }

      return result;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  clearSession(): void {
    try {
      localStorage.removeItem(SESSION_TOKEN_KEY);
      localStorage.removeItem(MESSAGES_KEY);
    } catch (error) {
      console.error('Error clearing session:', error);
    }
  }
}

