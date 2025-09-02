export abstract class State {
    abstract enter(scene: any, entity: any): void;
    abstract execute(scene: any, entity: any): void;
}

export class StateMachine {
    private currentState: string;
    private states: { [key: string]: State };
    private context: any[];

    constructor(initialState: string, states: { [key: string]: State }, context: any[]) {
        this.currentState = initialState;
        this.states = states;
        this.context = context;
    }

    public get state(): string {
        return this.currentState;
    }

    public transition(newState: string): void {
        if (this.states[newState]) {
            this.currentState = newState;
        } else {
            console.warn(`State "${newState}" not found in state machine`);
        }
    }

    public step(): void {
        const currentState = this.states[this.currentState];
        if (currentState) {
            currentState.execute(this.context[0], this.context[1]);
        }
    }

    public getCurrentState(): State | null {
        return this.states[this.currentState] || null;
    }
}
