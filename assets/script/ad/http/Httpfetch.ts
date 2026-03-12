import { HttpConfig } from './HttpConfig';
import { Authtoken } from './Authtoken';

export class Httpfetch {
  private static mixinHeader(url: string = '', headers: any = {}, authen: boolean = true) {
    let realHeaders: any = {
      'Content-Type': 'application/json',
      ...headers,
    };

    if (authen) {
      realHeaders['Authorization'] = Authtoken.token(url);
    }
    return realHeaders;
  }

  private static async fetchRequest(url: string = '', options: any = {}) {
    const fullUrl = `${HttpConfig.BASE_URL}${url}`;
    const response = await fetch(fullUrl, {
      ...options,
      headers: this.mixinHeader(url, options.headers, options.authen !== false)
    });
    return response.json();
  }

  public static async get(url: string = '', options: any = {}) {
    const { data = {} } = options;
    let realUrl = url;
    const keys = Object.keys(data);
    if (keys.length) {
      const dataStr = keys.map(key => `${key}=${data[key]}`).join('&');
      realUrl = `${realUrl}?${dataStr}`;
    }

    return this.fetchRequest(realUrl, {
      ...options,
      method: 'GET',
    });
  }

  public static async post(url: string = '', options: any = {}) {
    const { data = {} } = options;
    return this.fetchRequest(url, {
      ...options,
      body: JSON.stringify(data),
      method: 'POST',
    });
  }
}
