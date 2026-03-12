import { _decorator, Component, Node, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Block')
export class Block extends Component {
    private mid: Node = null!;
    private up: Node = null!;
    private down: Node = null!;
    private left: Node = null!;
    private right: Node = null!;

    start() {
        this.mid = this.node.getChildByName('mid')!;
        this.up = this.node.getChildByName('up')!;
        this.down = this.node.getChildByName('down')!;
        this.left = this.node.getChildByName('left')!;
        this.right = this.node.getChildByName('mid')!; // Original logic used mid for right
    }

    is_jump_on_block(w_dst_pos: Vec3, direction: number): boolean {
        const mid_pos = this.mid.worldPosition;
        let dir = new Vec3();
        Vec3.subtract(dir, w_dst_pos, mid_pos);
        
        let min_len = dir.length();
        let min_pos = mid_pos.clone();

        if (direction === 1) { // Right
            const up_pos = this.up.worldPosition;
            Vec3.subtract(dir, w_dst_pos, up_pos);
            let len = dir.length();
            if (min_len > len) {
                min_len = len;
                min_pos = up_pos.clone();
            }

            const down_pos = this.down.worldPosition;
            Vec3.subtract(dir, w_dst_pos, down_pos);
            len = dir.length();
            if (min_len > len) {
                min_len = len;
                min_pos = down_pos.clone();
            }
        } else { // Left
            const left_pos = this.left.worldPosition;
            Vec3.subtract(dir, w_dst_pos, left_pos);
            let len = dir.length();
            if (min_len > len) {
                min_len = len;
                min_pos = left_pos.clone();
            }

            const right_pos = this.right.worldPosition;
            Vec3.subtract(dir, w_dst_pos, right_pos);
            len = dir.length();
            if (min_len > len) {
                min_len = len;
                min_pos = right_pos.clone();
            }
        }

        Vec3.subtract(dir, w_dst_pos, min_pos);
        if (dir.length() < 100) {
            w_dst_pos.set(min_pos);
            return true;
        }
        return false;
    }
}
