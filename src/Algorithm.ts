import { Graph } from './Graph';

interface Instruction {
    code: string;
    run: (graph: Graph, residual: Graph) => [Graph /* flow */, Graph /* residual */, number /* branch target */];
}

class Algorithm {
    inst: Instruction[];

    constructor(inst: Instruction[]) {
        this.inst = inst;
    }
}

export { Algorithm };
