import { Algorithm } from '../Algorithm';
import { Node, Edge, Graph } from '../Graph';

interface NodeData {
    id: string;
    e: number; // excess flow
    h: number; // height
}

function nodeDataToString(data: NodeData): string {
    return `${data.id} [${data.e} / ${data.h}]`;
}

function stringToNodeData(name: string): NodeData {
    const sp = name.split(' ');
    return {
        id: sp[0],
        e: parseInt(sp[1].substring(1)),
        h: parseInt(sp[3].substring(0, sp[3].length - 1))
    };
}

// global state for running preflow-push
let queue: string[] = []; // active vertex queue
let activeV: string | undefined;

// u, v are vertices in the residual graph
// edge is an edge in the normal graph
function pushFlow(u: Node, v: Node, edge: Edge) {
    const uData = stringToNodeData(u.name!);
    const vData = stringToNodeData(v.name!);
    let cap = edge.c;
    if (u.id !== 's') {
        cap = Math.min(cap, uData.e);
    }
    uData.e -= cap;
    vData.e += cap;
    if (uData.e > 0 && queue.find(e => e === u.id) === undefined) queue.push(u.id);
    if (vData.e > 0 && queue.find(e => e === v.id) === undefined) queue.push(v.id);
    u.name = nodeDataToString(uData);
    v.name = nodeDataToString(vData);
    edge.f! += cap;
    if (cap > 0) edge.color = '#07f';
}

function setHeightColors(residual: Graph) {
    const maxHeight = Math.max(...residual.V.map(e => stringToNodeData(e.name!).h));
    // default color: (96, 96, 96)
    residual.V.forEach(e => {
        e.color = `rgb(${lerp(96, 255, stringToNodeData(e.name!).h / maxHeight)}, 96, 96)`;
    })
}

function lerp(a: number, b: number, d: number) {
    return a + (b - a) * d;
}

// Here, we will use residual graphs for excess flow and height
// Excess flow should be in the node name, height should be color-coded
function PreflowPush() {
    return new Algorithm([
        {
            code: 'Initialize h := 0, h(s) = |V|, e := 0',
            run: (graph: Graph, residual: Graph) => {
                residual = residual.clone();
                residual.E = []; // kill edges
                queue = []; // reset fifo
                residual.V.forEach(e => {
                    if (e.id === 's') {
                        e.name = nodeDataToString({ id: e.id, e: 0, h: residual.V.length });
                    } else {
                        e.name = nodeDataToString({ id: e.id, e: 0, h: 0 });
                    }
                });
                return [graph, residual, 1];
            }
        },
        {
            code: 'Saturate all outgoing edges from s',
            run: (graph: Graph, residual: Graph) => {
                graph = graph.clone();
                residual = residual.clone();

                const vertexMap = new Map(residual.V.map(e => [e.id, e]));
                const edgeMap = new Map(graph.E.map(e => [e.id, e]));

                graph.E.forEach(e => {
                    const [u, v] = e.id.split('-');
                    if (u === 's') {
                        // push flow from u to v
                        pushFlow(vertexMap.get(u)!, vertexMap.get(v)!, edgeMap.get(`${u}-${v}`)!);
                    }
                });

                setHeightColors(residual);

                return [graph, residual, 1];
            }
        },
        {
            code: 'While there is a possible Push or Relabel operation:',
            run: (graph: Graph, residual: Graph) => {
                graph = graph.clone();
                // clear edge colors
                graph.E.forEach(e => e.color = undefined);

                // compute next active vertex
                activeV = undefined;
                if (queue.length > 0) {
                    activeV = queue.shift()!;
                } else {
                    for (const v of residual.V) {
                        const vData = stringToNodeData(v.name!);
                        if (vData.e > 0) {
                            activeV = v.id;
                            break;
                        }
                    }
                }

                if (activeV === undefined) {
                    return [graph, residual, 4];
                } else {
                    console.log(`Active vertex: ${activeV}`);
                    return [graph, residual, 1];
                }
            }
        },
        {
            code: '\tSelect v := next active vertex',
            run: (graph: Graph, residual: Graph) => {
                residual = residual.clone();
                // just visually show active vertex
                residual.V.find(e => e.id === activeV)!.color = '#07f';
                return [graph, residual, 1];
            }
        },
        {
            code: '\tPerform a Push operation from v if possible',
            run: (graph: Graph, residual: Graph) => {
                const vertexMap = new Map(residual.V.map(e => [e.id, e]));
                const v = vertexMap.get(activeV!)!;
                const admissibleEdges = graph.E.filter(e => {
                    const [a, b] = e.id.split('-');
                    if (a !== v.id) return false;
                    const aData = stringToNodeData(vertexMap.get(a)!.name!);
                    const bData = stringToNodeData(vertexMap.get(b)!.name!);
                    if (aData.h !== bData.h + 1) return false;
                    return true;
                });
                if (admissibleEdges.length < 1) {
                    return [graph, residual, 1];
                } else {
                    // push as much flow as we can
                    graph = graph.clone();
                    residual = residual.clone();
                    admissibleEdges.forEach(e => {
                        const [a, b] = e.id.split('-');
                        pushFlow(vertexMap.get(a)!, vertexMap.get(b)!, e);
                    });
                    return [graph, residual, 1];
                }
            }
        },
        {
            code: '\tPerform a Relabel operation if c(v) > 0',
            run: (graph: Graph, residual: Graph) => {
                const vertexMap = new Map(residual.V.map(e => [e.id, e]));
                const v = vertexMap.get(activeV!)!;
                const vData = stringToNodeData(v.name!);
                if (vData.e < 1) return [graph, residual, 1];

                residual = residual.clone();

                // change height of v to min(adj height) + 1
                let minAdjHeight: number;
                graph.E.forEach(e => {
                    const [a, b] = e.id.split('-');
                    if (a !== v.id) return;
                    const bData = stringToNodeData(vertexMap.get(b)!.name!);
                    if (minAdjHeight === undefined || bData.h < minAdjHeight) minAdjHeight = bData.h;
                });
                vData.h = minAdjHeight! + 1;
                v.name = nodeDataToString(vData);
                return [graph, residual, -3];
            }
        },
        {
            code: 'Return f',
            run: (graph: Graph, residual: Graph) => [graph, residual, 0]
        },
    ]);
}

export default PreflowPush;
