class Ally extends NPC{
    constructor(scene, x, y, texture, frames, _name='NPC-friendly', _hitPoints){
        super(scene, x, y, texture, frames, _name, _hitPoints)

    }


    //basically this class is a wrapper for a container of quests
    // takes in dict of quests objects {quest number : "", quest dialogue: ""}
    //has a state machine that processes the quests




}