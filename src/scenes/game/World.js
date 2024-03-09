class World extends Phaser.Scene{
    constructor(){
        super('worldScene')
    }


    init(){
    }

    preload(){}

    create(){
    
        //load map
        const map = this.add.tilemap('tilemapJSON')
        const tileset = map.addTilesetImage('base_tileset', 'base-tileset')
        const bgLayer = map.createLayer('Background', tileset)
        const playerSpawn = map.findObject('Player/NPC', obj => obj.name === 'p_spawn')
        const npc1Spawn = map.findObject('Player/NPC', obj => obj.name === 'npc_spawn')
        const objlayer = map.getObjectLayer('Player/NPC')

        // const enemySpawn = map.findObject('Player/NPC', obj => obj.name === 'enemy_spawn')
        
        //camera stuff
        // this.cameras.main.startFollow(this.player, true, 0.25,0.25)
        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels)
        this.physics.world.setBounds(0,0, map.widthInPixels, map.heightInPixels)

        //cursor
        this.input.setDefaultCursor('url(assets/img/cursor.png), pointer')

        // //fullscreen button credit Nathan Altice
        // // add fullscreen button
        // this.fullscreenBtn = this.add.sprite(game.config.width - 15, game.config.height - 15, 'fullscreen').setScale(2).setScrollFactor(0)
        // this.fullscreenBtn.setOrigin(1)
        // this.fullscreenBtn.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
        //     this.scale.toggleFullscreen()
        // })

        //encapsulate quests 
        this.quests = []
        for(let i = 0; i < ammountOfQuests; i++){
            this.quests.push(this.cache.json.get(`quest-${i + 1}`)) 
        }


        //spawn sprites
        this.watersprite = this.physics.add.sprite(1000,200, 'water-pond', 0).setScale(5).setImmovable(true)
        this.watersprite.anims.play('water-moving', true)


        //spawn entities
        this.enemies = [] 
        this.items = []
        objlayer.objects.forEach(element => {
            if(element.name === 'enemy_spawn'){
                this.enemies.push(new Enemy(this, element.x, element.y, 'enemy-1', 0, 'Nepian Scout', 50, [element.x, element.y], 10))
            } else if(element.name === 'enemy_spawn_2'){
                this.enemies.push(new Enemy(this, element.x, element.y, 'enemy-2', 0, 'Greater Nepian Scout', 10, [element.x, element.y], 20))
            } else if (element.name === 'bush_1'){
               this.items.push(new Item(this, element.x, element.y, 'bush-1', 0, 'mysterious herb', true, false, {sound: 'collect-herb', volume: 0.1}).setSize(25).anims.play('bush-1-anim'))
            } 
        })

        //lopad order is important
        this.p1 = new Player(this, playerSpawn.x, playerSpawn.y, 'player', 0, 'p1', 100)

        objlayer.objects.forEach(element => {
            if (element.name === 'tree_1'){
                this.physics.add.sprite(element.x,element.y, 'tree-2', 0).setScale(2.5).setImmovable(true).anims.play('tree-1-anim'+ Phaser.Math.Between(0,5))
            } else if (element.name === 'tree_2'){
                this.physics.add.sprite(element.x,element.y, 'tree-2', 0).setScale(2.5).setImmovable(true).anims.play('tree-2-anim' + Phaser.Math.Between(0,7))
            } else if (element.name === 'tree_3'){
                let x = this.physics.add.sprite(element.x,element.y, 'tree-3', 0).setScale(2.5).setImmovable(true).setInteractive()

                x.on('pointerdown', ()=>{
                    if(listen(this, x)){
                        x.anims.play('tree-3-anim')
                        this.time.delayedCall(2000,()=>{
                            let y = new Item(this, x.x, x.y, 'fruit', 0, 'fruit', true, true).setAlpha(0)
                            this.p1.windowOpen ? undefined : createLootInterfaceWindow(y, this)
                        })
                        x.input.enabled = false
                    }
                })
            }
        })

        //this.p1 = new Player(this, playerSpawn.x, playerSpawn.y, 'player', 0, 'p1', 100)
        this.n1 = new Ally(this, npc1Spawn.x, npc1Spawn.y, 'npc-1', 0, undefined, 50)
        
        this.physics.add.overlap(this.p1, this.watersprite, ()=>{
            if(this.p1.animsFSM.state != 'swim'){
                this.sound.stopAll()
                this.p1.animsFSM.transition('swim')
            }
        })



           //fullscreen button credit Nathan Altice
        // add fullscreen button
        this.fullscreenBtn = this.add.sprite(game.config.width - 15, game.config.height - 15, 'fullscreen').setScale(2).setScrollFactor(0)
        this.fullscreenBtn.setOrigin(1)
        this.fullscreenBtn.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
            this.scale.toggleFullscreen()
        })

        //debug co
        /*************************************** */
        //this.p1.VELOCITY = 1000
        let debugToggle = this.input.keyboard.addKey('F')
        this.physics.world.drawDebug = false
        debugToggle.on('down', ()=> {
            if(this.physics.world.drawDebug) {
                this.physics.world.drawDebug = false;
                this.physics.world.debugGraphic.clear();
            }else{
                this.physics.world.drawDebug = true;
            }
        })
        /******************************************* */

    }

    update(){
    }
    
}


function CreateQuestObject(jsonData){
    let returnObj = {
        "questnumber" : jsonData.questdata.questnumber,
        "verb" : jsonData.questdata.verb,
        "type" : jsonData.questdata.type,
        "ammount" : jsonData.questdata.ammount,
        "actual" : 0,

    }

    return returnObj
}