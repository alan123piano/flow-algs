import { Algorithm } from '../Algorithm';
import { Graph } from '../Graph';

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

// recomputes residual graph in-place
function recomputeResidual(graph: Graph, residual: Graph) {
    residual.E = [];
    for (const e of graph.E) {
        const [u, v] = e.id.split('-');
        if (e.c - e.f! > 0) residual.E.push({ id: `${u}-${v}`, c: e.c - e.f! });
        if (e.f! > 0) residual.E.push({ id: `${v}-${u}`, c: e.f! });
    }
}

// u, v are vertices in the residual graph
// edge is an edge in the normal graph
function pushFlow(graph: Graph, residual: Graph, u: string, v: string) {
    const vertexMap = new Map(residual.V.map(e => [e.id, e]));
    const nodeDataMap = new Map(residual.V.map(e => [e.id, stringToNodeData(e.name!)]));
    function setNodeData(v: string, data: NodeData) {
        vertexMap.get(v)!.name = nodeDataToString(data);
    }
    const uData = nodeDataMap.get(u)!;
    const vData = nodeDataMap.get(v)!;
    const rEdge = residual.E.find(e => e.id === `${u}-${v}`);
    if (rEdge === undefined || rEdge.c < 1) return;
    let cap = rEdge.c;
    if (u !== 's') {
        cap = Math.min(cap, uData.e);
    }
    uData.e -= cap;
    vData.e += cap;
    if (vData.e > 0 && queue.find(e => e === v) === undefined) queue.push(v);
    setNodeData(u, uData);
    setNodeData(v, vData);
    const gEdge = graph.E.find(e => e.id === `${u}-${v}`);
    if (gEdge === undefined) {
        // we need to push flow back from an edge
        const invEdge = graph.E.find(e => e.id === `${v}-${u}`)!;
        invEdge.f! -= cap;
        if (cap > 0) invEdge.color = '#07f';
    } else {
        gEdge.f! += cap;
        if (cap > 0) gEdge.color = '#07f';
    }
    recomputeResidual(graph, residual);
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
                queue = []; // reset fifo
                residual.V.forEach(e => {
                    if (e.id === 's') {
                        e.name = nodeDataToString({ id: e.id, e: 0, h: residual.V.length });
                    } else {
                        e.name = nodeDataToString({ id: e.id, e: 0, h: 0 });
                    }
                });
                setHeightColors(residual);
                return [graph, residual, 1];
            }
        },
        {
            code: 'Saturate all outgoing edges from s',
            run: (graph: Graph, residual: Graph) => {
                graph = graph.clone();
                residual = residual.clone();

                residual.E.forEach(e => {
                    const [u, v] = e.id.split('-');
                    if (u === 's') {
                        // push flow from u to v
                        pushFlow(graph, residual, u, v);
                    }
                });

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
                while (queue.length > 0) {
                    const next = queue.shift()!;
                    if (next === 's' || next === 't') {
                        continue;
                    } else {
                        activeV = next;
                        break;
                    }
                }

                if (activeV === undefined) {
                    console.log('Queue empty, searching for active node...');
                    for (const v of residual.V) {
                        const vData = stringToNodeData(v.name!);
                        if (vData.e > 0 && v.id !== 's' && v.id !== 't') {
                            activeV = v.id;
                            break;
                        }
                    }
                }

                if (activeV === undefined) {
                    graph.V.forEach(e => e.color = undefined);
                    graph.E.forEach(e => e.color = undefined);
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
                graph = graph.clone();
                // just visually show active vertex
                graph.V.forEach(e => e.color = undefined);
                graph.V.find(e => e.id === activeV)!.color = '#07f';
                return [graph, residual, 1];
            }
        },
        {
            code: '\tPerform a Push operation from v if possible',
            run: (graph: Graph, residual: Graph) => {
                graph = graph.clone();
                residual = residual.clone();

                const vertexMap = new Map(residual.V.map(e => [e.id, e]));
                const v = vertexMap.get(activeV!)!;
                const admissibleEdges = residual.E.filter(e => {
                    const [a, b] = e.id.split('-');
                    if (a !== v.id) return false;
                    const aData = stringToNodeData(vertexMap.get(a)!.name!);
                    const bData = stringToNodeData(vertexMap.get(b)!.name!);
                    if (aData.h !== bData.h + 1) return false;
                    return true;
                });

                if (admissibleEdges.length < 1) {
                    return [graph, residual, 1];
                }

                console.log("Performing push operation");

                // push as much flow as we can
                admissibleEdges.forEach(e => {
                    const [a, b] = e.id.split('-');
                    pushFlow(graph, residual, a, b);
                });

                return [graph, residual, 1];
            }
        },
        {
            code: '\tPerform a Relabel operation if c(v) > 0',
            run: (graph: Graph, residual: Graph) => {
                residual = residual.clone();

                const vertexMap = new Map(residual.V.map(e => [e.id, e]));
                const v = vertexMap.get(activeV!)!;
                const vData = stringToNodeData(v.name!);
                if (vData.e < 1) return [graph, residual, -3];

                console.log("Performing relabel operation");

                // change height of v to min(adj height) + 1
                let minAdjHeight: number;
                residual.E.forEach(e => {
                    const [a, b] = e.id.split('-');
                    if (a !== v.id) return;
                    const bData = stringToNodeData(vertexMap.get(b)!.name!);
                    if (minAdjHeight === undefined || bData.h < minAdjHeight) minAdjHeight = bData.h;
                });
                vData.h = minAdjHeight! + 1;
                v.name = nodeDataToString(vData);
                setHeightColors(residual);
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
