export interface ChatbotConfig {
  chatbotName: string;
  welcomeMessage: string;
  businessProfile: string;
  assistantProfile?: string;
  primaryColor: string;
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  siteName: string;
  siteUrl: string;
  avatarUrl?: string; // Optional avatar for the assistant
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface ChatRequest {
  message: string;
}

export interface ChatResponse {
  success: boolean;
  message: Message;
  sessionToken?: string; // Only present on first message (session creation)
}

export interface ConfigResponse {
  success: boolean;
  config: ChatbotConfig;
}

export interface CachedConfig {
  data: ChatbotConfig;
  timestamp: number;
}

export interface AskMySiteProps {
  apiKey: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  primaryColor?: string;
  apiBaseUrl?: string;
}
