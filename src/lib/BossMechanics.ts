import { Scene } from 'phaser';
import GameConfig from '../config/GameConfig';
import { listen, determineKnockbackDirection } from './HelperFunc';

/**
 * create by cjmoshy on 3/10/24 for 'Time Waster'
 * 
 * set of functions applied to the boss in the game
 * boss is of type 'Enemy' and I dont want any more code in there...
 * 
 */

//dodge mechanic
export function mechanic1(_boss: any, player: any, scene: Scene): void {
    let aoe = scene.physics.add.sprite(player.x + 16, player.y + 16, 'tree-1', 0).setDepth(0).setScale(2).setCircle(32).anims.play('boss-aoe-anim') as any;
    aoe.detectionDistance = GameConfig.DETECTION.BOSS_AOE_RANGE
    scene.time.delayedCall(1000, () => {
        if (listen(scene as any, aoe)) {

            let damage = Phaser.Math.Between(GameConfig.COMBAT.BOSS_AOE_DAMAGE_MIN, GameConfig.COMBAT.BOSS_AOE_DAMAGE_MAX)
            player.HIT_POINTS -= damage

            // Hit by AOE attack

            let attackText = scene.add.bitmapText(player.x + Phaser.Math.Between(-50, 50), player.y + Phaser.Math.Between(-10, -60), 'pixel-red', '-' + damage, 24)
            scene.time.delayedCall(GameConfig.TIMING.DAMAGE_TEXT_DURATION, () => { attackText.destroy() })
        }
    })
    scene.time.delayedCall(2000, () => aoe.destroy())
    return
}

//heal mechanic
export function mechanic2(boss: any, _player: any, scene: Scene): void {
    clearInterval(boss.INTERVAL_ID)
    boss.INTERVAL_ID = setInterval(() => {
        boss.HIT_POINTS += GameConfig.COMBAT.BOSS_HEAL_AMOUNT
        let attackText = scene.add.bitmapText(boss.x + Phaser.Math.Between(-50, 50), boss.y + Phaser.Math.Between(-10, -60), 'pixel-green', '+' + GameConfig.COMBAT.BOSS_HEAL_AMOUNT, 24)
        scene.time.delayedCall(GameConfig.TIMING.DAMAGE_TEXT_DURATION, () => { attackText.destroy() })
    }, GameConfig.COMBAT.BOSS_HEAL_INTERVAL, boss, scene)
    scene.time.delayedCall(GameConfig.TIMING.SPRINT_DURATION, () => { clearInterval(boss.INTERVAL_ID) })
}

//knockback mechanic
export function mechanic3(boss: any, player: any, scene: Scene): void {
    clearInterval(player.INTERVAL_ID)
    player.animsFSM.transition('interacting')
    let vec = determineKnockbackDirection(player, boss)
    player.setVelocity(GameConfig.MOVEMENT.BOSS_KNOCKBACK * vec.x, GameConfig.MOVEMENT.BOSS_KNOCKBACK * vec.y)

    scene.time.delayedCall(GameConfig.TIMING.DAMAGE_TEXT_DURATION, () => player.animsFSM.transition('idle'))
}

//put all of these functions in a container so they can be called in game later
export const mechanics = [mechanic1, mechanic2, mechanic3];