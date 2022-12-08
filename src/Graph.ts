interface Node {
  id: string;
  // position
  x: number;
  y: number;
}

interface Edge {
  id: string; // <source>-<target>
  f?: number; // flow
  c: number; // capacity
}

class Graph {
  V: Node[];
  E: Edge[];
  residualNetwork?: Graph;

  constructor(V: Node[], E: Edge[]) {
    this.V = V;
    this.E = E;
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
    if (!this.residualNetwork) {
      this.residualNetwork = new Graph([], []);
    }
    this.residualNetwork.V = JSON.parse(JSON.stringify(this.V));
    this.residualNetwork.E = [];
    for (const e of this.E) {
      console.assert(e.f !== undefined);
      const [u, v] = e.id.split('-');
      this.residualNetwork.E.push({ id: `${u}-${v}`, c: e.c - e.f! });
      this.residualNetwork.E.push({ id: `${v}-${u}`, c: e.f! });
    }
    return this.residualNetwork;
  }
}

export { Node, Edge, Graph };
