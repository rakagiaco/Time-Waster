class NPC extends Entity{
    constructor(scene, x, y, texture, frames, _name='NPC', _hitPoints){
        super(scene, x, y, texture, frames, _name, _hitPoints)

        this.on('pointerdown', ()=>{
            console.log('clicked on: ' + this.entity_type)
            console.log(this.HIT_POINTS)
        })  
    }

    update(){super.update()}
}