import { _decorator, Component, Node, Prefab, Vec3, instantiate, UITransform, tween, director } from 'cc';
import { Player } from './Player';
import { Block } from './Block';
import { yr } from './ad/yr';
import { GameLogic } from './ad/gameLogicAd';

const { ccclass, property } = _decorator;

@ccclass('GameScene')
export class GameScene extends Component {
    @property({ type: Node })
    public player: Node = null!;

    @property({ type: [Prefab] })
    public block_prefab: Prefab[] = [];

    @property({ type: Node })
    public block_root: Node = null!;

    @property({ type: Node })
    public map_root: Node = null!;

    @property
    public y_radio: number = 0.5560472;

    @property({ type: Node })
    public checkout: Node = null!;

    private left_org: Vec3 = new Vec3(0, 0, 0);
    private cur_block: Node = null!;
    private next_block: Node = null!;
    private player_com: Player = null!;
    private block_zorder: number = -1;

    onLoad() {
        yr.inst.init();
        GameLogic.instance.getGS(() => {
            console.log('广告初始化完成');
        });
    }

    start() {
        this.block_zorder = -1;
        this.cur_block = instantiate(this.block_prefab[Math.floor(Math.random() * this.block_prefab.length)]);
        this.block_root.addChild(this.cur_block);
        
        const block_root_ui = this.block_root.getComponent(UITransform)!;
        this.cur_block.position = block_root_ui.convertToNodeSpaceAR(this.left_org);
        
        const mid_node = this.cur_block.getChildByName("mid")!;
        const mid_ui = mid_node.getComponent(UITransform)!;
        const w_pos = mid_ui.convertToWorldSpaceAR(new Vec3(0, 0, 0));
        
        const map_root_ui = this.map_root.getComponent(UITransform)!;
        this.player.position = map_root_ui.convertToNodeSpaceAR(w_pos);
        
        this.next_block = this.cur_block;
        this.player_com = this.player.getComponent('Player') as Player;
        this.add_block();
    }

    add_block() {
        this.cur_block = this.next_block;
        this.next_block = instantiate(this.block_prefab[Math.floor(Math.random() * this.block_prefab.length)]);
        this.block_root.addChild(this.next_block);
        
        this.next_block.setSiblingIndex(0); 
        
        const x_distance = 200 + Math.random() * 200;
        const y_distance = x_distance * this.y_radio;
        
        const next_pos = this.cur_block.position.clone();
        next_pos.x += (x_distance * (this.player_com ? this.player_com.direction : 1));
        next_pos.y += y_distance;
        this.next_block.position = next_pos;
        
        if (this.player_com) {
            this.player_com.set_next_block(this.next_block.getComponent('Block') as Block);
        }
    }

    move_map(offset_x: number, offset_y: number) {
        tween(this.map_root)
            .by(0.5, { position: new Vec3(offset_x, offset_y, 0) })
            .call(() => {
                this.add_block();
            })
            .start();
    }

    on_checkout_game() {
        this.checkout.active = true;
    }

    on_game_again() {
        director.loadScene('gameScene');
    }

    on_watch_ad_revive() {
        GameLogic.instance.showRewardAd((err) => {
            if (!err) {
                this.revive_player();
            }
        });
    }

    revive_player() {
        this.checkout.active = false;
        const mid_node = this.cur_block.getChildByName("mid")!;
        const mid_ui = mid_node.getComponent(UITransform)!;
        const w_pos = mid_ui.convertToWorldSpaceAR(new Vec3(0, 0, 0));
        
        const map_root_ui = this.map_root.getComponent(UITransform)!;
        this.player.position = map_root_ui.convertToNodeSpaceAR(w_pos);
        
        if (this.player_com) {
            (this.player_com as any).is_power_mode = false;
            (this.player_com as any).speed = 0;
            (this.player_com as any).x_distance = 0;
        }
        
        console.log("Player revived!");
    }
}
