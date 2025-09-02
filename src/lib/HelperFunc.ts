import Phaser from 'phaser';
import GameConfig from '../config/GameConfig';

export function updatePlayerMovement(
    player: Phaser.Physics.Arcade.Sprite, 
    keyUp: Phaser.Input.Keyboard.Key, 
    keyDown: Phaser.Input.Keyboard.Key, 
    keyLeft: Phaser.Input.Keyboard.Key, 
    keyRight: Phaser.Input.Keyboard.Key, 
    isSprinting: boolean = false
): void {
    let velocity = isSprinting ? GameConfig.MOVEMENT.PLAYER_SPRINT_VELOCITY : GameConfig.MOVEMENT.PLAYER_BASE_VELOCITY;
    
    // Reset velocity
    player.setVelocity(0, 0);
    
    // Handle movement
    if (keyUp.isDown) {
        player.setVelocityY(-velocity);
        if (player.anims.exists('player-walk-up')) {
            player.anims.play('player-walk-up', true);
        }
    } else if (keyDown.isDown) {
        player.setVelocityY(velocity);
        if (player.anims.exists('player-walk-down')) {
            player.anims.play('player-walk-down', true);
        }
    }
    
    if (keyLeft.isDown) {
        player.setVelocityX(-velocity);
        if (player.anims.exists('player-walk-left')) {
            player.anims.play('player-walk-left', true);
        }
    } else if (keyRight.isDown) {
        player.setVelocityX(velocity);
        if (player.anims.exists('player-walk-right')) {
            player.anims.play('player-walk-right', true);
        }
    }
}

export function updateHealthBar(entity: Phaser.Physics.Arcade.Sprite, healthBar: Phaser.GameObjects.Graphics, healthBarText: Phaser.GameObjects.BitmapText): void {
    const healthPercentage = entity.getData('hitPoints') / entity.getData('maxHitPoints');
    
    // Update health bar
    healthBar.clear();
    healthBar.fillStyle(0xff0000, 1);
    healthBar.fillRect(
        entity.x - GameConfig.UI.HEALTH_BAR_WIDTH / 2,
        entity.y - GameConfig.UI.HEALTH_BAR_HEIGHT_OFFSET_Y,
        GameConfig.UI.HEALTH_BAR_WIDTH * healthPercentage,
        GameConfig.UI.HEALTH_BAR_HEIGHT
    );
    
    // Update health text
    if (healthBarText) {
        healthBarText.setText(`${entity.getData('hitPoints')}/${entity.getData('maxHitPoints')}`);
        healthBarText.setPosition(
            entity.x - GameConfig.UI.HEALTH_BAR_WIDTH / 2,
            entity.y - GameConfig.UI.HEALTH_BAR_HEIGHT_OFFSET_Y - 15
        );
    }
}

export function listen(scene: any, entity: any): boolean {
    // Simple detection logic - check if player is within range
    const player = scene.getPlayer ? scene.getPlayer() : null;
    if (!player) return false;
    
    const distance = Phaser.Math.Distance.Between(entity.x, entity.y, player.x, player.y);
    return distance < GameConfig.DETECTION.DEFAULT_DISTANCE;
}

export function createLootInterfaceWindow(item: any, scene: any, player: any, miniMapCamera: any): void {
    // Simple loot interface - just make the item visible and collectible
    if (item) {
        item.setAlpha(1);
        item.setScale(1);
    }
}
