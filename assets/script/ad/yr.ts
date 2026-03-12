import { native, sys } from 'cc';

interface Callback {
  success?: Function | null;
  showAd?: Function | null;
  onProgress?: Function | null;
  rewarded?: Function | null;
  fail?: Function | null;
}

export class yr {
  private constructor() {}

  private static _inst: yr | null = null;
  public static get inst(): yr {
    if (this._inst == null) this._inst = new yr();
    return this._inst;
  }

  public ads: any = {
    provider: 'csj',
    appid: '',
    splash: '',
    banner: '',
    interstitial: '',
    rewarded: '',
  };

  private callback: Map<string, Callback | null> = new Map();
  private setCallback(event: string, callback: Callback) {
    this.callback.set(event, callback);
  }
  private getCallback(event: string) {
    return this.callback.has(event) ? this.callback.get(event) : null;
  }

  private isAndroid() {
    return sys.isNative && sys.os == sys.OS.ANDROID;
  }

  private isIos() {
    return sys.isNative && sys.os == sys.OS.IOS;
  }

  public init() {
    console.log('sys.isNative', sys.isNative);
    if (this.isAndroid() || this.isIos()) {
      window['onNative'] = (res: any, arg?: string) => {
        this.onNative(JSON.stringify(res), arg);
      };
    }
  }

  private onNative(res: string, _arg?: string) {
    console.log('yr onNative', res);
    let resp = JSON.parse(res);
    let { event, data } = resp;

    if (event == 'rewarded') {
      event = 'multipleAd';
      if (data && this.getCallback(event)?.rewarded)
        this.getCallback(event)!.rewarded!(data);
    } else if (event == 'showAd') {
      let adv_event = 'multipleAd';
      if (data && this.getCallback(adv_event)?.showAd)
        this.getCallback(adv_event)!.showAd!(data);
    } else {
      if (data && this.getCallback(event)?.success)
        this.getCallback(event)!.success!(data);
      else if (this.getCallback(event)?.fail)
        this.getCallback(event)!.fail!(data);
    }
  }

  private sendToNative(event: string, data?: any) {
    this.setCallback(event, { 
      success: data?.success, 
      showAd: data?.showAd, 
      onProgress: data?.onProgress, 
      rewarded: data?.rewarded, 
      fail: data?.fail 
    });

    let obj = { event: event, data: data };
    let req = JSON.stringify(obj);
    console.log('yr sendToNative', req);

    if (this.isAndroid()) {
      let typeVoid = 'V';
      let typeString = 'Ljava/lang/String;';
      let className = 'com/cocos/game/AppActivity';
      let methodName = 'sendToNative';
      let methodSignature = `(${typeString}${typeString})${typeVoid}`;
      native.reflection.callStaticMethod(className, methodName, methodSignature, req, '');
    } else if (this.isIos()) {
      let className = 'AppController';
      let methodName = 'sendToNative:andArg:';
      native.reflection.callStaticMethod(className, methodName, req, '');
    }
  }

  public initAd(data?: any) {
    if (this.isAndroid() || this.isIos()) {
      this.sendToNative('initAd', data);
    } else if (data?.success) {
      data.success();
    }
  }

  public createMultipleAd(data?: any) {
    if (this.isAndroid() || this.isIos()) {
      this.sendToNative('multipleAd', data);
    } else if (data?.success) {
      data.success();
    }
  }

  public removeAdView(data?: any) {
    if (this.isAndroid() || this.isIos()) {
      this.sendToNative('removeAdView', data);
    } else if (data?.success) {
      data.success();
    }
  }

  public showToast(data?: any) {
    if (this.isAndroid() || this.isIos()) {
      this.sendToNative('showToast', data);
    } else {
      console.log('Toast:', data?.text);
    }
  }
}
