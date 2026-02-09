import { Component, ElementRef, ViewChild, effect, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../services/chat/chat.service';

import { Message } from '../interfaces/message';

@Component({
  selector: 'app-chat',
  imports: [
    FormsModule
  ],
  templateUrl: './chat.html',
  styleUrl: './chat.css',
})
export class Chat {
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  history = signal<Message[]>([]);
  message = signal<string>('');
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  private chatService = inject(ChatService);

  constructor() {
    // Auto-scroll to bottom when history or loading state changes
    effect(() => {
      this.history();
      this.loading();
      setTimeout(() => this.scrollToBottom(), 0);
    });
  }

  async sendMessage() {
    const userMessage = this.message().trim(); 
    if (!userMessage || this.loading()) return;
    const newMessage: Message = {
      id: Date.now(),
      sender: 'user',
      message: userMessage,
    };

    // Add user message
    this.history.update(currentHistory => [...currentHistory, newMessage]);
    this.message.set('');

    this.askLLM(newMessage)
  }

  async askLLM(message: Message) {
    try {
      this.loading.set(true);
      this.error.set(null);

      //get response from LLM
      const botMessage = await this.chatService.sendMessageToLLM(message?.message);

      const newBotMessage: Message = {
        id: Date.now() + 1,
        sender: 'bot',
        message: botMessage,
      }

      // Simulate network delay
      // await new Promise(resolve => setTimeout(resolve, 1500));

      // Simulate bot response
      this.history.update(prev => [...prev, newBotMessage]);
    } catch (e: any) {
      this.error.set(e.message);
    } finally {
      this.loading.set(false);
    }
  }

  private scrollToBottom(): void {
    if (this.scrollContainer) {
      const el = this.scrollContainer.nativeElement;
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }
  }
}
