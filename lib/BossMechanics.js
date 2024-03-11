/**
 * create by cjmoshy on 3/10/24 for 'Time Waster'
 * 
 * set of functions applied to the boss in the game
 * boss is of type 'Enemy' and I dont want any more code in there...
 * 
 */


//dodge mechanic
function mechanic1(boss, player, scene){
    console.log('in mech 1')
    let aoe = scene.physics.add.sprite(player.x + 16, player.y + 16, 'tree-1', 0).setDepth(0).setScale(2).setCircle().anims.play('boss-aoe-anim')
    aoe.detectionDistance = 50
    scene.time.delayedCall(1000, ()=> {
        if(listen(scene, aoe)){
            
            let damage = Phaser.Math.Between(15, 30)
            player.HIT_POINTS -= damage

            console.log('hit by aoe.. health is now -> ' + player.HIT_POINTS)

            let attackText = scene.add.text(player.x + Phaser.Math.Between(-50, 50), player.y + Phaser.Math.Between(-10,-60), '-'+damage, {fill: '#FF0000'}).setScale(2).setOrigin(0)
            scene.time.delayedCall(500, ()=>{ attackText.destroy()})
        }
    })
    scene.time.delayedCall(2000, ()=> aoe.destroy())
    return
}

//heal mechanic
function mechanic2(boss, player, scene){
    clearInterval(boss.INTERVAL_ID)
    boss.INTERVAL_ID = setInterval(()=>{
        boss.HIT_POINTS += 10
        let attackText = scene.add.text(boss.x + Phaser.Math.Between(-50, 50), boss.y + Phaser.Math.Between(-10,-60), '+10', {fill: '#00FF00'}).setScale(2).setOrigin(0)
        scene.time.delayedCall(500, ()=>{ attackText.destroy()})
    }, 500, boss, scene)
    scene.time.delayedCall(3000, ()=>{clearInterval(boss.INTERVAL_ID)})
}

//knockback mechanic
function mechanic3(boss, player, scene){
    clearInterval(player.INTERVAL_ID)
    player.animsFSM.transition('interacting')
    let vec = determineKnockbackDirection(scene, player, boss)
    player.setVelocity(400 * vec.x, 400 * vec.y)

    scene.time.delayedCall(500, ()=>player.animsFSM.transition('idle'))
}

var mechanics = [mechanic1, mechanic2, mechanic3]