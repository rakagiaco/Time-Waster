import { Scene } from 'phaser';

/*
- `possibleStates` is an object whose keys refer to the state name and whose values are instances of the `State` class (or subclasses). The class assigns the `stateMachine` property on each instance so they can call `this.stateMachine.transition` whenever they want to trigger a transition.
- `stateArgs` is a list of arguments passed to the `enter` and `execute` functions. This allows us to pass commonly-used values (such as a sprite object or current Phaser Scene) to the state methods.
*/

export class StateMachine {
    private initialState: string;
    private possibleStates: Record<string, State>;
    private stateArgs: any[];
    public state: string | null;

    constructor(initialState: string, possibleStates: Record<string, State>, stateArgs: any[] = []) {
        this.initialState = initialState;
        this.possibleStates = possibleStates;
        this.stateArgs = stateArgs;
        this.state = null;

        // state instances get access to the state machine via `this.stateMachine`
        // Note: "Object.values() returns an array of a given object's own enumerable property values" (MDN)
        for(const state of Object.values(this.possibleStates)) {
            (state as any).stateMachine = this;
        }
    }

    step(): void {
        // this method should be called in the Scene's update() loop
        // on the first step, the state is null and needs to be initialized
        if(this.state === null) {
            this.state = this.initialState;
            this.possibleStates[this.state].enter.apply(null, this.stateArgs as any);
            // note: "Spread syntax allows an iterable such as an array expression to be expanded in places where zero or more arguments or elements are expected." (MDN)
            // translation: the `.enter.apply(null, this.stateArgs)` statement allows us to pass an arbitrary number of arguments into the .enter method 
        }

        // run the current state's execute method
        this.possibleStates[this.state].execute.apply(null, this.stateArgs as any);
    }

    transition(newState: string, ...enterArgs: any[]): void {
        this.state = newState;
        this.possibleStates[this.state].enter.apply(null, [...this.stateArgs, ...enterArgs] as any);
    }

    stop(): void {
        // Cleanup method - in modern JS/TS, we don't use delete(this)
        this.state = null;
        this.possibleStates = {};
        this.stateArgs = [];
    }
}

// parent class structure for all `State` subclasses
export abstract class State {
    abstract enter(scene: Scene, entity: any): void;
    abstract execute(scene: Scene, entity: any): void;
    
    exit(_scene: Scene, _entity: any): void {
        // this code happens when leaving the state
        // Override in subclasses to implement cleanup logic
    }
}