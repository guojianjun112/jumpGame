import { sys } from 'cc';
import { yr } from './yr';
import { Httpfetch } from './http/Httpfetch';
import { HttpConfig } from './http/HttpConfig';
import { util } from './util';
import { Global } from './globalUtils';

export class GameLogic {
  private static _instance: GameLogic | null = null;
  public static get instance(): GameLogic {
    if (!this._instance) {
      this._instance = new GameLogic();
    }
    return this._instance;
  }

  private ads: any[] = [];
  private adInfos: any[] = [];
  private rewardInfos: any[] = [];
  private interInfos: any[] = [];
  private bannerInfos: any[] = [];
  private bannerInfos1: any[] = [];
  private splashInfos: any[] = [];
  private feedInfos: any[] = [];
  public adInited: boolean = false;
  private isCooling: boolean = false;
  private coolingTimer: any = null;

  constructor() {}

  public getGS(callback?: Function) {
    const finish = callback || (() => {});
    Httpfetch.get(HttpConfig.API_GGW)
      .then((resp: any) => {
        if (resp.code == 1 && resp.data && resp.data.length) {
          this.showAd(resp.data, finish);
        } else {
          this.adInited = true;
          finish();
        }
      })
      .catch((err: any) => {
        console.error('getGS error:', err);
        this.adInited = true;
        finish();
      });
  }

  private showAd(array: any[], callback?: Function) {
    this.ads = [];
    this.adInfos = [];
    this.interInfos = [];
    this.bannerInfos = [];
    this.bannerInfos1 = [];
    this.splashInfos = [];
    this.feedInfos = [];
    
    array.forEach((element) => {
      this.adInfos.push(element);
      let index = this.ads.findIndex(s => s.appid == element.appid);
      if (index == -1) {
        this.ads.push({
          as: element.as == "pangle" ? 'csj' : element.as,
          appid: element.appid,
          appkey: element.appkey || '',
        });
      }
      
      const provider = element.as == "pangle" ? 'csj' : element.as;
      const info: any = { provider, unitId: element.rewarded, event: '' };
      
      if (element.type == 1) { /* reward handled separately */ }
      else if (element.type == 2) { info.event = 'interstitialAd'; info.tag = 'interstitialAd'; this.interInfos.push(info); }
      else if (element.type == 3) { info.event = 'bannerAd'; info.tag = 'bannerAdBottom'; info.style = { top: 0, left: 0, width: 0, height: 0 }; this.bannerInfos.push(info); }
      else if (element.type == 4) { info.event = 'splashAd'; this.splashInfos.push(info); }
      else if (element.type == 5) { info.event = 'feedAd'; info.tag = 'feedAd'; info.style = { left: 0, bottom: 150 }; this.feedInfos.push(info); }
      else if (element.type == 6) { info.event = 'bannerAd'; info.tag = 'bannerAdTop'; info.style = { top: 10, left: 0, width: 0, height: 0 }; this.bannerInfos1.push(info); }
    });
    
    if (this.ads.length === 0) {
      this.adInited = true;
      callback && callback();
      return;
    }
    this.initAdParallel(callback);
  }

  private initAdParallel(callback?: Function) {
    let pending = this.ads.length;
    const onDone = () => {
      pending--;
      if (pending <= 0) {
        this.adInited = true;
        callback && callback();
        this.createSplashAd();
      }
    };

    this.ads.forEach(ad => {
      yr.inst.initAd({
        provider: ad.as,
        appId: ad.appid,
        appKey: ad.appkey,
        success: onDone,
        fail: onDone
      });
    });
  }

  public createSplashAd() {
    if (this.splashInfos.length > 0) {
      this.createMultipleAd(this.splashInfos);
    }
  }

  public createMultipleAd(ads: any[]) {
    let array = util.shuffle(ads);
    yr.inst.createMultipleAd({
      unitIds: array,
      success: (resp: any) => console.log('MultipleAd success'),
      fail: () => console.log('MultipleAd fail')
    });
  }

  public showRewardAd(callback: Function) {
    if (Global.isDan) {
      callback && callback(null);
      return;
    }
    if (this.isCooling) return;
    this.isCooling = true;

    Httpfetch.get(HttpConfig.API_ISCAN_AD)
      .then((resp: any) => {
        if (resp.code == 1) {
          this.getAllAdInfo(callback);
        } else {
          yr.inst.showToast({ text: resp.msg || "不能播放广告" });
          this.isCooling = false;
        }
      })
      .catch(() => {
        yr.inst.showToast({ text: "广告判断异常" });
        this.isCooling = false;
      });
  }

  private getAllAdInfo(callback: Function) {
    this.rewardInfos = [];
    Httpfetch.get(HttpConfig.API_GGW)
      .then((res: any) => {
        if (res.code == 1) {
          let array = res.data || [];
          array.forEach((element: any) => {
            if (element.type == 1) {
              this.rewardInfos.push({
                provider: element.as == "pangle" ? 'csj' : element.as,
                unitId: element.rewarded,
                tag: 'rewardedVideoAd',
                event: 'rewardedVideoAd'
              });
            }
          });
          this.rewardInfos.sort((a, b) => (a.provider === 'csj' ? 0 : 1) - (b.provider === 'csj' ? 0 : 1));
          if (this.rewardInfos.length == 0) {
            yr.inst.showToast({ text: "暂无广告" });
            this.isCooling = false;
            return;
          }
          this.playVideoAd(callback);
        } else {
          this.isCooling = false;
        }
      })
      .catch(() => { this.isCooling = false; });
  }

  private playVideoAd(callback: Function) {
    if (sys.os == sys.OS.ANDROID || sys.os == sys.OS.IOS) {
      if (this.coolingTimer) clearTimeout(this.coolingTimer);
      this.coolingTimer = setTimeout(() => { this.isCooling = false; }, 2000);

      yr.inst.createMultipleAd({
        unitIds: this.rewardInfos,
        rewarded: (resp: any) => {
          let adv = JSON.parse(resp || '{}');
          if (adv.adv_status) {
            callback && callback(null);
          }
        },
        fail: () => { console.log('RewardAd fail'); }
      });
    } else {
      this.isCooling = false;
      callback && callback(null);
    }
  }

  public removeAdView() {
    yr.inst.removeAdView({
      unitIds: [...this.feedInfos, ...this.bannerInfos, ...this.bannerInfos1]
    });
  }
}
