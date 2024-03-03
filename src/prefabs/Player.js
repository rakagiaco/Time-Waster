class Player extends Entity{
    constructor(scene, x, y, texture, frames, _name='player', _hitPoints){
        super(scene, x, y, texture, frames, _name, _hitPoints)

        /* this.FSM = new StateMachine('vanilla', {
            vanilla: new mainState(),
        }, [scene, this])   */

        //properties

        //camera
        scene.cameras.main.startFollow(this, true, 0.25,0.25)

        //state machines
        this.animsFSM = new StateMachine('idle', {
            idle: new idlePlayerState(),
            moving: new movingState(),
            interacting: new interactionPlayerState(),
            swim: new inWaterPlayerState()
        }, [scene, this])

        //input
        keyUp = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W)
        keyDown = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S)
        keyLeft = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A)
        keyRight = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
    }

    update(){
        this.animsFSM.step()
       // console.log(this.y)
    }

    handleCollision(){
    }

    handleMovement(){        
        // handle movement
        let moveDirection = new Phaser.Math.Vector2(0, 0)
        if(keyUp.isDown){
            moveDirection.y = -1
        }else if(keyDown.isDown){
            moveDirection.y = 1
        }
        if(keyLeft.isDown) {
            moveDirection.x = -1
        }else if(keyRight.isDown){
            moveDirection.x = 1
        }

        // normalize movement vector, update position, and play proper animation
        moveDirection.normalize()
     
        this.setVelocity(this.VELOCITY * moveDirection.x, this.VELOCITY * moveDirection.y)
    }
    
}


class idlePlayerState extends State{
    enter(scene, player){
        console.log('in player: idle')
        player.setVelocity(0)
    }

    execute(scene, player){
        if(player.canMove){
            if(keyUp.isDown || keyDown.isDown || keyLeft.isDown || keyRight.isDown){
                this.stateMachine.transition('moving')
                return
            }
        }
    }
}

class movingState extends State{
    enter(scene,player){
        console.log('in player: moving')
        scene.sound.play('walking', {rate: 2})
    }

    execute(scene, player){
        if(!(keyUp.isDown || keyDown.isDown || keyLeft.isDown || keyRight.isDown)) {
            scene.sound.stopAll()
            this.stateMachine.transition('idle')
        }else{
            player.handleMovement()
        }
    }
}

class interactionPlayerState extends State{
    enter(scene, player){
        console.log('in player: interaction')
        player.setVelocity(0)
    }
}

class inWaterPlayerState extends State{
    enter(scene, player){
        console.log('in player: water state')
        player.VELOCITY = player.VELOCITY / 2
        scene.sound.play('in-water')
    }

    execute(scene, player){
        player.handleMovement()
        if(!scene.physics.overlap(player, scene.watersprite)){
            scene.sound.stopAll()
            player.VELOCITY = player.VELOCITY*2
            this.stateMachine.transition('idle')
        }
    }

}