import {PipeType} from "./PipeType";
import {Entity, STATES, Vertex} from "./types";

export class QueryRunner {
    private prog: Array<PipeType>;
    private prev: Array<number>;
    private index: number;
    private vertex: Vertex | null;
    private results: Entity[];
    private currentPipe: PipeType;

    constructor(_prog: Array<PipeType>, _prev: Array<number>) {
        this.prog = _prog;
        this.results = [];
        this.prev = _prev;
        this.index = 0;
        this.vertex = null;
        this.currentPipe = _prog.at(0)!;
    }

    static create(_prog: Array<PipeType>, _prev: Array<number>) {
        return new QueryRunner(_prog, _prev);
    }

    private assignPipe() {
        this.currentPipe = this.prog.at(this.index)!;
    }

    private updatePrev(currentIndex: number) {
        const state = this.currentPipe.getState();
        if (state === STATES.RUNNING) {
            this.prev[currentIndex] = currentIndex;
        } else if (state === STATES.PULL) {
            this.prev[currentIndex] = this.prev[currentIndex - 1];
        }
    }

    private isEnd(): boolean {
        return this.index + 1 === this.prog.length;
    }

    private provideVertex() {
        if (this.vertex == null) return;
        this.currentPipe.provides(this.vertex!);
        this.vertex = null;
    }

    private processRunningState() {
        this.vertex = this.currentPipe.get();
        if (this.isEnd()) {
            this.results.push(this.vertex.entity);
            this.vertex = null;
            return;
        }
        this.index = this.index + 1;
    }

    private processPullState() {
        this.index = this.prev[this.index];
    }

    private process() {
        const state = this.currentPipe.getState();
        switch (state) {

            case STATES.RUNNING:
                this.processRunningState();
                break;

            case STATES.PULL:
                this.processPullState();
                break;

            case STATES.DONE:
                return true;

            default:
                throw Error("Undefined STATE");
        };

        return false;
    }


    public run(): Array<Entity> {
        if (this.prog.length === 0) return this.results;

        while (true) {
            this.assignPipe();
            const currentIndex = this.index;
            this.provideVertex();

            const done: boolean = this.process();
            if (done) break;

            this.updatePrev(currentIndex);

        }

        return [...new Set(this.results)];
    }
}
