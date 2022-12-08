interface TraversalSettings<AuxDataT> {
    mode: 'BFS' | 'DFS';
    initAuxData: AuxDataT;
    nextAuxData: (u: string, v: string, auxData: AuxDataT) => AuxDataT;
    onVisit?: (id: string, auxData: AuxDataT) => void;
    getEdges: (id: string) => [string, string][];
}

function Traversal<AuxDataT>(settings: TraversalSettings<AuxDataT>): AuxDataT | undefined {
    const visited = new Set<string>();
    const toVisit: [string, AuxDataT][] = [];
    toVisit.push(['s', settings.initAuxData]);
    while (toVisit.length > 0) {
        const [id, aux] = settings.mode === 'DFS' ? toVisit.pop()! : toVisit.shift()!;
        if (settings.onVisit) settings.onVisit(id, aux);
        if (id === 't') {
            return aux;
        }
        visited.add(id);
        const candidateEdges = settings.getEdges(id);
        for (const [u, v] of candidateEdges) {
            if (u === id && !visited.has(v)) {
                toVisit.push([v, settings.nextAuxData(u, v, aux)]);
            }
        }
    }
    // nothing found
    return undefined;
}

export default Traversal;
