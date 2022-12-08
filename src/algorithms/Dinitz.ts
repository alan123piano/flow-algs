import { Algorithm } from '../Algorithm';
import { Graph } from '../Graph';
import Traversal from './Traversal';

// cache distances from level graph
let distMap = new Map<string, number>();

function Dinitz() {
    return new Algorithm([
        {
            code: 'f := 0',
            run: (graph: Graph, residual: Graph) => { return [graph, residual, 1]; }
        },
        {
            code: 'While f is not a max flow:',
            run: (graph: Graph, residual: Graph) => { return [graph, residual, 1]; }
        },
        {
            code: '\tConstruct G_L from G_f',
            run: (graph: Graph, residual: Graph) => {
                residual = residual.clone();
                // color code our residual vertices
                const layerColors = ['#c66', '#6c6', '#6ac', '#c6c', '#cc6'];
                // reset distMap cache
                distMap = new Map<string, number>();
                // run BFS
                Traversal<number /* dist */>({
                    mode: 'BFS',
                    initAuxData: 0,
                    nextAuxData: (u: string, v: string, dist: number) => {
                        return dist + 1;
                    },
                    onVisit: (id: string, dist: number) => {
                        // mark color
                        residual.V.filter(e => e.id === id)[0].color = layerColors[dist % 5];
                        distMap.set(id, dist);
                    },
                    getEdges: (id: string) => residual.E
                        .filter(e => e.c !== 0)
                        .map(e => {
                            const [u, v] = e.id.split('-');
                            return [u, v];
                        })
                        .filter(([u, v]) => u === id) as [string, string][],
                });
                return [graph, residual, 1];
            }
        },
        {
            code: '\tFind a blocking flow f\' in G_L',
            run: (graph: Graph, residual: Graph) => {
                // use BFS to find admissible paths
                // continually augment blocking flow
                while (true) {
                    Traverse<string[]>({

                    });
                    const visited = new Set<string>();
                    const toVisit: [string /* id */, string[] /* path */][] = [];
                    toVisit.push(['s', []]);
                    let foundPath: string[];
                    while (toVisit.length > 0) {
                        const [id, path] = toVisit.shift()!; // BFS
                        if (id === 't') {
                            foundPath = [...path, 't'];
                            break;
                        }
                        visited.add(id);
                        const candidateEdges = residual.E.filter(e => e.c !== 0).map(e => e.id.split('-'));
                        for (const [u, v] of candidateEdges) {
                            if (u === id && !visited.has(v)) {
                                toVisit.push([v, [...path, id]]);
                            }
                        }
                    }
                }
            }
        },
        {
            code: '\tf := f + f\'',
            run: (graph: Graph, residual: Graph) => { return [graph, residual, 1]; }
        },
        {
            code: 'Return f',
            run: (graph: Graph, residual: Graph) => { return [graph, residual, 0]; }
        },
    ]);
}

export default Dinitz;
