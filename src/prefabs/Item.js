class Item extends Phaser.Physics.Arcade.Sprite{
    constructor(scene, x, y, texture, frame, _itype =undefined, _isCollectable=false, _fromEntity=false, _soundQ = undefined){
        super(scene, x, y, texture, frame)

        scene.add.existing(this)
        scene.physics.add.existing(this)
        scene.events.on('update', this.update, this)

        this.item_type = _itype
        this._isCollectable = _isCollectable
        this.fromEntity = _fromEntity
        this.detectionDistance = 75
        this.soundEffect = _soundQ

        if(!this.fromEntity){
            this.setInteractive()
            this.on('pointerdown', ()=>{
                if(listen(scene, this)){
                    console.log(`item click, ${this.item_type}`)
                    toggleCursor(scene)
                    if(!scene.p1.windowOpen){
                        createLootInterfaceWindow(this, scene)
                    }   
                }
            })  
        }
    }
}