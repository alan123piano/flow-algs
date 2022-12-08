import { Algorithm } from '../Algorithm';
import { Graph } from '../Graph';

const EdmondsKarp = new Algorithm([
    {
        code: 'Repeat:',
        run: (graph: Graph, residual: Graph) => { return [graph, residual, 1]; }
    },
    {
        code: '\tFind path P from s to t in G_f',
        run: (graph: Graph, residual: Graph) => {
            residual = residual.clone();
            // run BFS
            const visited = new Set<string>();
            const toVisit: [string /* id */, string[] /* path */][] = [];
            toVisit.push(['s', []]);
            let firstPath: any;
            while (toVisit.length > 0) {
                const [id, path] = toVisit.shift()!;
                if (id === 't') {
                    firstPath = [...path, 't'];
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

            if (!firstPath) {
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
            graph.E.filter(e => edgeIdSet.has(e.id)).forEach(e => e.f! += maxCapacity);
            graph.E.filter(e => revEdgeIdSet.has(e.id)).forEach(e => e.f! -= maxCapacity);
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

export default EdmondsKarp;
