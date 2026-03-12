import { sys } from 'cc';

export class Authtoken {
  public static token(url: string): string {
    const userStr = sys.localStorage.getItem('bqxxl_user');
    let user: any = null;
    try {
      user = userStr ? JSON.parse(userStr) : null;
    } catch (e) {}
    
    if (user && user.token) {
      return user.token;
    }
    return '';
  }
}
