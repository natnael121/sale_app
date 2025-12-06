import { db } from '../lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { BusinessCard } from '../lib/firebase';

interface SendMessageParams {
  botToken: string;
  chatId: string | number;
  text: string;
  parseMode?: 'HTML' | 'Markdown';
}

export interface TelegramSettings {
  botToken: string;
  chatId: string;
  enabled: boolean;
}

export const getTelegramSettings = async (userId: string): Promise<TelegramSettings | null> => {
  try {
    const settingsRef = doc(db, 'telegram_settings', userId);
    const settingsDoc = await getDoc(settingsRef);

    if (!settingsDoc.exists()) {
      return null;
    }

    const data = settingsDoc.data();
    return {
      botToken: data.bot_token || '',
      chatId: data.chat_id || '',
      enabled: data.enabled || false,
    };
  } catch (error) {
    console.error('Error loading Telegram settings:', error);
    return null;
  }
};

export const saveTelegramSettings = async (userId: string, settings: TelegramSettings): Promise<void> => {
  try {
    const settingsRef = doc(db, 'telegram_settings', userId);
    await setDoc(settingsRef, {
      bot_token: settings.botToken,
      chat_id: settings.chatId,
      enabled: settings.enabled,
      updated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error saving Telegram settings:', error);
    throw error;
  }
};

export const testTelegramConnection = async (botToken: string, chatId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: 'Test message from Orvion Digital Business Card System. Your Telegram integration is working correctly.',
        parse_mode: 'HTML',
      }),
    });

    const data = await response.json();

    if (!data.ok) {
      return {
        success: false,
        error: data.description || 'Failed to send test message',
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message || 'Network error',
    };
  }
};

const sendTelegramMessage = async ({ botToken, chatId, text, parseMode = 'HTML' }: SendMessageParams): Promise<boolean> => {
  try {
    if (!botToken) {
      console.error('Telegram bot token is not configured');
      return false;
    }

    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: parseMode,
      }),
    });

    const data = await response.json();

    if (!data.ok) {
      console.error('Telegram API error:', data.description || data);
    }

    return data.ok;
  } catch (error) {
    console.error('Error sending Telegram message:', error);
    return false;
  }
};

export const sendContactShareNotification = async (
  userId: string,
  card: BusinessCard,
  contactData: {
    visitor_name: string;
    visitor_email: string;
    visitor_phone?: string | null;
    visitor_company?: string | null;
    visitor_notes?: string | null;
  }
): Promise<boolean> => {
  try {
    const settings = await getTelegramSettings(userId);

    if (!settings || !settings.enabled || !settings.botToken || !settings.chatId) {
      console.log('Telegram notifications not configured or disabled');
      return false;
    }

    const message = `
<b>New Contact Shared!</b>

<b>Business Card:</b>
${card.full_name}${card.title ? ` - ${card.title}` : ''}${card.company ? `
${card.company}` : ''}

<b>Visitor Information:</b>
Name: ${contactData.visitor_name}
Email: ${contactData.visitor_email}${contactData.visitor_phone ? `
Phone: ${contactData.visitor_phone}` : ''}${contactData.visitor_company ? `
Company: ${contactData.visitor_company}` : ''}
${contactData.visitor_notes ? `
<b>Message:</b>
${contactData.visitor_notes}` : ''}

View all shared contacts in your dashboard.
    `.trim();

    return sendTelegramMessage({
      botToken: settings.botToken,
      chatId: settings.chatId,
      text: message,
    });
  } catch (error) {
    console.error('Error sending contact share notification:', error);
    return false;
  }
};