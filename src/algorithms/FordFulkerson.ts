import { Algorithm } from '../Algorithm';
import { Graph } from '../Graph';
import Traversal from './Traversal';

function FordFulkerson(mode: 'BFS' | 'DFS', dumb: boolean) {
    return new Algorithm([
        {
            code: 'Repeat:',
            run: (graph: Graph, residual: Graph) => { return [graph, residual, 1]; }
        },
        {
            code: `\tFind path P from s to t in G_f${mode === 'BFS' ? ' using BFS' : ''}`,
            run: (graph: Graph, residual: Graph) => {
                graph = graph.clone();
                residual = residual.clone();

                // clear graph colors
                graph.E.forEach(e => e.color = undefined);

                let firstPath: any;

                if (dumb) {
                    // run dumb mode
                    function validPath(path: string[]) {
                        for (let i = 0; i < path.length - 1; ++i) {
                            const e = residual.E.filter(e => e.id === `${path[i]}-${path[i + 1]}`);
                            if (e.length === 0 || e[0].c === 0) {
                                return false;
                            }
                        }
                        return true;
                    }
                    const preferredPaths = [['s', '1', '2', 't'], ['s', '2', '1', 't']];
                    preferredPaths.forEach(e => validPath(e) ? firstPath = e : undefined);
                }

                if (firstPath === undefined) {
                    // fallback: run DFS or BFS
                    firstPath = Traversal<string[] /* path */>({
                        mode,
                        initAuxData: ['s'],
                        nextAuxData: (u: string, v: string, path: string[]) => {
                            return [...path, v];
                        },
                        getEdges: (id: string) => residual.E
                            .filter(e => e.c !== 0)
                            .map(e => e.id.split('-')) as [string, string][]
                    });
                }


                if (firstPath === undefined) {
                    return [graph, residual, 3];
                }

                const pathEdges = new Set();
                for (let i = 0; i < firstPath!.length - 1; ++i) {
                    pathEdges.add(`${firstPath[i]}-${firstPath[i + 1]}`);
                }
                pathEdges.add(`${firstPath[firstPath.length - 1]}-t`);

                for (const e of residual.E) {
                    if (pathEdges.has(e.id)) {
                        e.color = '#07f';
                    }
                }

                return [graph, residual, 1];
            }
        },
        {
            code: '\tf\' := maximum flow along P',
            run: (graph: Graph, residual: Graph) => {
                residual = residual.clone();
                const pathEdges = residual.E.filter(e => e.color !== undefined);
                let maxCapacity = Math.min(...pathEdges.map(e => e.c));
                pathEdges.forEach(e => e.f = maxCapacity);
                return [graph, residual, 1];
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
            code: 'Until there is no path from s to t in G_f',
            run: (graph: Graph, residual: Graph) => { return [graph, residual, 1]; }
        },
        {
            code: 'Return f',
            run: (graph: Graph, residual: Graph) => { return [graph, residual, 0]; }
        },
    ]);
}

export default FordFulkerson;
