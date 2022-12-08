interface Node {
  id: string;
  name?: string;
  // position
  x: number;
  y: number;
  color?: string;
}

interface Edge {
  id: string; // <source>-<target>
  f?: number; // flow
  c: number; // capacity
  color?: string;
}

class Graph {
  V: Node[];
  E: Edge[];

  constructor(V: Node[], E: Edge[]) {
    this.V = V;
    this.E = E;
  }

  clone(): Graph {
    const V = JSON.parse(JSON.stringify(this.V));
    const E = JSON.parse(JSON.stringify(this.E));
    return new Graph(V, E);
  }

  // Computes total value of flow.
  flowValue(): number {
    let val = 0;
    for (const e of this.E) {
      console.assert(e.f !== undefined);
      const [u, v] = e.id.split('-');
      if (u === 's') {
        val += e.f!;
      } else if (v === 's') {
        val -= e.f!;
      }
    }
    return val;
  }

  // Computes residual network.
  getResidualNetwork(): Graph {
    const residual = new Graph([], []);
    residual.V = JSON.parse(JSON.stringify(this.V));
    residual.E = [];
    for (const e of this.E) {
      console.assert(e.f !== undefined);
      const [u, v] = e.id.split('-');
      if (e.c - e.f! > 0) residual.E.push({ id: `${u}-${v}`, c: e.c - e.f! });
      if (e.f! > 0) residual.E.push({ id: `${v}-${u}`, c: e.f! });
    }
    return residual;
  }
}

export { Node, Edge, Graph };
