import { _decorator, Component, Node, Vec3, Input, EventTouch, tween, Tween, UITransform } from 'cc';
import { GameScene } from './GameScene';
import { Block } from './Block';
const { ccclass, property } = _decorator;

@ccclass('Player')
export class Player extends Component {
    @property
    public init_speed: number = 500;

    @property
    public a_power: number = 600;

    @property
    public y_radio: number = 0.5560472;

    @property({ type: GameScene })
    public game_manager: GameScene = null!;

    private next_block: Block | null = null;
    public direction: number = 1;

    private rot_node: Node = null!;
    private anim_node: Node = null!;
    private is_power_mode: boolean = false;
    private speed: number = 0;
    private x_distance: number = 0;

    onLoad() {
        this.next_block = null;
        this.direction = 1;
    }

    start() {
        this.rot_node = this.node.getChildByName('rotate')!;
        this.anim_node = this.rot_node.getChildByName('anim')!;

        this.anim_node.on(Input.EventType.TOUCH_START, this.on_touch_start, this);
        this.anim_node.on(Input.EventType.TOUCH_END, this.on_touch_end, this);
        this.anim_node.on(Input.EventType.TOUCH_CANCEL, this.on_touch_cancel, this);
    }

    on_touch_start(event: EventTouch) {
        this.is_power_mode = true;
        this.x_distance = 0;
        this.speed = this.init_speed;
        Tween.stopAllByTarget(this.anim_node);
        tween(this.anim_node)
            .to(2, { scale: new Vec3(1, 0.5, 1) })
            .start();
    }

    on_touch_end(event: EventTouch) {
        this.is_power_mode = false;
        Tween.stopAllByTarget(this.anim_node);
        tween(this.anim_node)
            .to(0.5, { scale: new Vec3(1, 1, 1) })
            .start();
        this.player_jump();
    }

    on_touch_cancel(event: EventTouch) {
        this.is_power_mode = false;
        Tween.stopAllByTarget(this.anim_node);
        tween(this.anim_node)
            .to(0.5, { scale: new Vec3(1, 1, 1) })
            .start();
        this.player_jump();
    }

    update(dt: number) {
        if (this.is_power_mode) {
            this.speed += (this.a_power * dt);
            this.x_distance += this.speed * dt;
        }
    }

    player_jump() {
        const x_dist = this.x_distance * this.direction;
        const y_dist = this.x_distance * this.y_radio;

        // Rotation animation
        tween(this.rot_node)
            .by(0.5, { angle: -360 * this.direction })
            .start();

        const current_world_pos = this.node.worldPosition.clone();
        const jump_world_pos = new Vec3(current_world_pos.x + x_dist, current_world_pos.y + y_dist, current_world_pos.z);

        let is_game_over = false;
        if (this.next_block && this.next_block.is_jump_on_block(jump_world_pos, this.direction)) {
            // Success
        } else {
            is_game_over = true;
        }

        const parent_ui = this.node.parent!.getComponent(UITransform)!;
        const final_local_pos = parent_ui.convertToNodeSpaceAR(jump_world_pos);

        // Parabolic jump simulation
        const start_pos = this.node.position.clone();
        const peak_y = Math.max(start_pos.y, final_local_pos.y) + 200;

        tween(this.node)
            .to(0.5, { position: final_local_pos })
            .call(() => {
                if (is_game_over) {
                    this.game_manager.on_checkout_game();
                } else {
                    this.direction = (Math.random() < 0.5) ? -1 : 1;
                    if (this.direction === -1) {
                        this.game_manager.move_map(580 - jump_world_pos.x, -y_dist);
                    } else {
                        this.game_manager.move_map(180 - jump_world_pos.x, -y_dist);
                    }
                }
            })
            .start();

        // Sub-tween for Y height arc
        tween(this.node)
            .to(0.25, { position: new Vec3(start_pos.x + (final_local_pos.x - start_pos.x) * 0.5, peak_y, start_pos.z) }, { easing: 'sineOut' })
            .to(0.25, { position: final_local_pos }, { easing: 'sineIn' })
            .start();
    }

    set_next_block(block: Block) {
        this.next_block = block;
    }
}
