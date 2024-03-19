class Menu extends Phaser.Scene{
    constructor(){
        super('menuScene')
    }

    create(data){
        //title
        this.add.bitmapText(game.config.width/2, game.config.height/2 - 25,'8-bit', 'Time Waster', 96).setOrigin(0.5)

        this.cameras.main.setBackgroundColor('0xffffff')

        this.continueButton = this.add.image(game.config.width/2, (game.config.height/2) + 100,'continue-game-button').setOrigin(0.5).setInteractive({ useHandCursor: true }).on('pointerdown', ()=>{
            //load existing gamestates...
            if(window.localStorage.getItem('existing_quest') != null) {
                data.qobj = JSON.parse(window.localStorage.getItem('existing_quest'))
            }

            if(window.localStorage.getItem('existing_inv') != null) {
                const parse = JSON.parse(window.localStorage.getItem('existing_inv'))
                data.inv = new Map(parse)
            }
            this.sound.play('click', {volume: 0.5})
            this.scene.start('worldScene', data)
        }) 

        this.newGameBtn = this.add.image(game.config.width/2, (game.config.height/2) + 50, 'new-game-button').setOrigin(0.5).setInteractive({ useHandCursor: true }).on('pointerdown', () => {
            window.localStorage.removeItem('existing_inv')
            window.localStorage.removeItem('existing_quest')
            data.inv = undefined
            data.qobj = undefined
            this.sound.play('click', {volume: 0.5})
            this.scene.start('worldScene', data)
        })

        this.creditsBtn = this.add.image(game.config.width/2, (game.config.height/2) + 150, 'credits-button').setOrigin(0.5).setInteractive({ useHandCursor: true }).on('pointerdown', () => {
            this.sound.play('click', {volume: 0.5})
            this.scene.start('Credits')
        })
    }
}