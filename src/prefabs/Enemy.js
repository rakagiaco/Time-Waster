class Enemy extends NPC{
    constructor(scene, x, y, texture, frames, _name='NPC-enemy', _hitPoints, _origin=[]){
        super(scene, x, y, texture, frames, _name, _hitPoints)



        this.movementDecider = 0 // 0 north, 1 south, 2 east, 3 west
        this.spawnOrigin = _origin

        this.VELOCITY = 50

        console.log(this.scene)

        this.scene.time.delayedCall
    }

    update(){
        if(this.reset){
            this.INTERVAL_ID = setInterval(updateMovement, 1250, this, this.parentScene) 
            this.reset = false
        }
    }
}


//automated movement

function updateMovement(enemy, scene){
    if(enemy.y < 775){ //maybe use config here for better properties
        resetPosition(enemy, scene)
    }
    var decider =  Math.round(Math.random() * 4)
    switch(decider){
        case 1:
            enemy.setVelocityX(enemy.VELOCITY)
            scene.time.delayedCall(750, () => {
                enemy.setVelocity(0)
                scene.time.delayedCall(500, () => {enemy.setVelocityX(-enemy.VELOCITY)})})
            break
        case 2:
            enemy.setVelocityX(-enemy.VELOCITY)
            scene.time.delayedCall(750, () => {
                enemy.setVelocity(0)
                scene.time.delayedCall(500, () => {enemy.setVelocityX(enemy.VELOCITY)})})
            break
        case 3:
            enemy.setVelocityY(enemy.VELOCITY)
            scene.time.delayedCall(750, () => {
                enemy.setVelocity(0)
                scene.time.delayedCall(500, () => {enemy.setVelocityY(-enemy.VELOCITY)})})
            break
        case 4:
            enemy.setVelocityY(-enemy.VELOCITY)
            scene.time.delayedCall(750, () => {
                enemy.setVelocity(0)
                scene.time.delayedCall(500, () => {enemy.setVelocityY(enemy.VELOCITY)})})
            break
    }   
}

//seems like this kind of works
function resetPosition(enemy, scene){
    clearInterval(enemy.INTERVAL_ID)
    enemy.setVelocity(0)
    enemy.setVelocityY(enemy.VELOCITY)
    scene.time.delayedCall(2000, ()=> {
        enemy.setVelocity(0)
        enemy.reset = true
    })
}