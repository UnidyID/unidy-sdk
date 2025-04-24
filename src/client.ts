import { EventEmitter } from 'events';
import { NewsletterService } from './newsletters';

export interface ApiResponse<T = any> {
  data: T;
  status: number;
  headers: Headers;
}

export class UnidyClient extends EventEmitter {
  public newsletters: NewsletterService;

  constructor(public baseUrl: string, public api_key: string) {
    super();
    this.newsletters = new NewsletterService(this);
    this.api_key = api_key;
  }

  async post<T = any>(endpoint: string, body: any): Promise<ApiResponse<T>> {
    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${this.api_key}`,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    const response: ApiResponse<T> = {
      data,
      status: res.status,
      headers: res.headers
    };

    if (res.ok) {
      this.emit('success', response);
    }
    if (!res.ok || res.status === 207) {
      this.emit('error', response);
    }

    return response;
  }
}