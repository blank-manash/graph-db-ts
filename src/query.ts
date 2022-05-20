/**
 * @file  : query.ts
 * @author: Manash Baul <mximpaid@gmail.com>
 * Date   : 15.05.2022
 */

import {Graph} from './graph';
import {PipeType} from "./PipeType";
import {ChildPipeType} from './pipetypes/childPipe';
import {ParentPipeType} from './pipetypes/parentPipe';
import {VertexPipeType} from './pipetypes/vertexPipe';
import {STATES, Vertex} from './types';


export class Query {
    prog: Array<PipeType>;
    prev: Array<number>;
    graph: Graph;

    private constructor(_graph: Graph) {
        this.prog = [];
        this.prev = [];
        this.graph = _graph;
    }

    private addPipeType(pipeType: PipeType) {
        const i = this.prog.length;
        this.prog.push(pipeType);
        this.prev[i] = this.prev[i - 1];
    }

    public v(predicate: number | string | object): Query {
        if (typeof predicate == "number" || typeof predicate == "string") {
            predicate = {id: predicate};
        }
        const vertices = this.graph.findVertices(predicate);
        const pipeType: PipeType = VertexPipeType.create(vertices);
        this.addPipeType(pipeType);
        const i = this.prog.length;
        this.prev[i] = i;
        return this;
    }

    public parent() {
        const pipeType: PipeType = ParentPipeType.create();
        this.addPipeType(pipeType);
    }
    
    public child() {
        const pipeType: PipeType = ChildPipeType.create();
        this.addPipeType(pipeType);
    }

    public run(): Array<Vertex> {

        const results: Array<Vertex> = [];
        if (this.prog.length === 0) return results;

        let index = 0;
        let vertex: Vertex | null = null;

        while (true) {
            const pipeType: PipeType = this.prog.at(index)!;
            const currentIndex = index;
            if (vertex) {
                pipeType.provides(vertex);
                vertex = null;
            }

            // Update Index
            const state = pipeType.getState();
            if (state === STATES.RUNNING) {
                vertex = pipeType.get();
                if (index === this.prog.length - 1) {
                    results.push(vertex);
                } else {
                    index = index + 1;
                }
            } else if (state === STATES.PULL) {
                index = this.prev[index];
            } else {
                break;
            }

            // Update Prev
            if (state === STATES.RUNNING) {
                this.prev[currentIndex] = currentIndex;
            } else if (state === STATES.PULL) {
                this.prev[currentIndex] = this.prev[currentIndex - 1];
            }
        }

        return results;
    }

    public static create(_graph: Graph) {
        const queryEngine: Query = new Query(_graph);
        return queryEngine;
    }
}
