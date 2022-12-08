import React, { createRef, memo, useEffect } from 'react';
import cytoscape from 'cytoscape';
import { Graph } from './Graph';

interface CytoscapeGraphProps {
  title: string;
  width: number;
  height: number;
  graph: Graph;
}

function CytoscapeGraph(props: CytoscapeGraphProps) {
  const container = createRef<HTMLDivElement>();

  useEffect(() => {
    if (!container.current) return;

    const nodes = props.graph.V;
    const edges = props.graph.E;

    const cy = cytoscape({
      autolock: true,
      userZoomingEnabled: false,
      container: container.current,
      elements: {
        nodes: [],
        edges: [],
      },
      style: [
        // the stylesheet for the graph
        {
          selector: 'node',
          style: {
            'background-color': (elt) => {
              return elt.data('bg') ?? '#666';
            },
            label: 'data(name)',
          },
        },
        {
          selector: 'edge',
          style: {
            width: 3,
            'line-color': (elt) => {
              return elt.data('bg') ?? '#ccc';
            },
            'target-arrow-color': (elt) => {
              return elt.data('bg') ?? '#ccc';
            },
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
          },
        },
        {
          selector: 'edge[label]',
          css: {
            label: 'data(label)',
            'text-rotation': 'autorotate',
          },
        },
      ],
      layout: {
        name: 'preset',
      },
    });
    for (const node of nodes) {
      cy.add({
        group: 'nodes',
        data: {
          id: node.id,
          name: node.name ?? node.id,
          bg: node.color
        },
        position: {
          x: node.x,
          y: node.y,
        },
      });
    }
    for (const edge of edges) {
      const split = edge.id.split('-');
      const [a, b] = split;
      cy.add({
        group: 'edges',
        data: {
          id: edge.id,
          source: a,
          target: b,
          label: edge.f === undefined ? `${edge.c}` : `${edge.f}/${edge.c}`,
          bg: edge.color
        }
      });
    }
    // console.log(cy.filter('[id="ab"]'));
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: 12 }}>
      <div style={{ marginBottom: 8 }}>{props.title}</div>
      <div
        ref={container}
        style={{
          backgroundColor: 'rgb(242, 242, 242)',
          border: '1px solid black',
          borderRadius: 3,
          width: props.width,
          height: props.height
        }}
      />
    </div>
  );
}

export default memo(CytoscapeGraph);
