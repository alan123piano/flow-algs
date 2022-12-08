/* eslint-disable no-loop-func */

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
                graph = graph.clone();
                residual = residual.clone();

                // clear graph colors
                graph.E.forEach(e => e.color = undefined);

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
                residual = residual.clone();
                // use BFS to find admissible paths
                // continually augment blocking flow
                let didNoWork = true;
                while (true) {
                    const path = Traversal<string[]>({
                        mode: 'BFS',
                        initAuxData: ['s'],
                        nextAuxData: (u: string, v: string, path: string[]) => [...path, v],
                        getEdges: (id: string) => residual.E
                            .filter(e => (e.c - (e.f ?? 0)) > 0)
                            .map(e => e.id.split('-'))
                            .filter(([u, v]) => distMap.get(v)! > distMap.get(u)!) as [string, string][]
                    });
                    if (path === undefined) break;
                    didNoWork = false;
                    const pathEdges = [];
                    for (let i = 0; i < path.length - 1; ++i) {
                        pathEdges.push(`${path[i]}-${path[i + 1]}`);
                    }
                    const capacityMap = new Map<string, number>();
                    residual.E.forEach(e => capacityMap.set(e.id, e.c))
                    const pathCapacity = Math.min(...pathEdges.map(e => capacityMap.get(e)!));
                    const edgeSet = new Set(pathEdges);
                    residual.E.forEach(e => {
                        if (edgeSet.has(e.id)) {
                            e.color = '#07f';
                            e.f = (e.f ?? 0) + pathCapacity;
                        }
                    });
                }
                if (didNoWork) {
                    graph = graph.clone();
                    // clear graph colors
                    graph.V.forEach(e => e.color = undefined);
                    return [graph, graph.getResidualNetwork(), 2];
                } else {
                    return [graph, residual, 1];
                }
            }
        },
        {
            code: '\tf := f + f\'',
            run: (graph: Graph, residual: Graph) => {
                graph = graph.clone();
                const pathEdges = residual.E.filter(e => e.color !== undefined);
                let maxCapacity = Math.min(...pathEdges.map(e => e.c));
                const edgeIdSet = new Set(pathEdges.map(e => e.id));
                const revEdgeIdSet = new Set(pathEdges.map(e => {
                    const [u, v] = e.id.split('-');
                    return `${v}-${u}`;
                }));
                graph.E.filter(e => edgeIdSet.has(e.id)).forEach(e => {
                    e.color = '#07f';
                    e.f! += maxCapacity;
                });
                graph.E.filter(e => revEdgeIdSet.has(e.id)).forEach(e => {
                    e.color = '#07f';
                    e.f! -= maxCapacity;
                });
                return [graph, graph.getResidualNetwork(), -2];
            }
        },
        {
            code: 'Return f',
            run: (graph: Graph, residual: Graph) => { return [graph, residual, 0]; }
        },
    ]);
}

export default Dinitz;
