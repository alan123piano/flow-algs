import { Box, Button, Card, Chip, CssBaseline, Divider, FormControl, InputLabel, MenuItem, Select, Slider, Typography } from '@mui/material';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import CytoscapeGraph from './CytoscapeGraph';
import { Algorithm } from './Algorithm';
import { Node, Edge, Graph } from './Graph';
import FordFulkerson from './algorithms/FordFulkerson';
import Dinitz from './algorithms/Dinitz';
import PreflowPush from './algorithms/PreflowPush';
import Example from './graphs/Example';
import Textbook1 from './graphs/Textbook1';
import Textbook2 from './graphs/Textbook2';
import FFPitfall from './graphs/FFPitfall';

const algoMap = new Map<string, Algorithm>();
algoMap.set('Ford-Fulkerson', FordFulkerson('DFS', true));
algoMap.set('Dinitz', Dinitz());
algoMap.set('Edmonds-Karp', FordFulkerson('BFS', false));
algoMap.set('Preflow-push', PreflowPush());

const graphMap = new Map<string, Graph>();
graphMap.set('Example', new Graph(Example.nodes, Example.edges));
graphMap.set('Textbook1', new Graph(Textbook1.nodes, Textbook1.edges));
graphMap.set('Textbook2', new Graph(Textbook2.nodes, Textbook2.edges));
graphMap.set('FFPitfall', new Graph(FFPitfall.nodes, FFPitfall.edges));

function randomGraph(): Graph {
  function rand(a: number, b: number) {
    return a + Math.floor(Math.random() * (b - a + 1));
  }
  let nodes: Node[] = [
    { id: 's', x: 50, y: 150 },
    { id: 't', x: 350, y: 150 }
  ];
  const edges: Edge[] = [];

  let currId = 1;

  // layer 1
  let n = rand(2, 3);
  const layer1 = [];
  for (let i = 0; i < n; ++i) {
    const id = currId++;
    layer1.push({
      id: `${id}`,
      x: 150,
      y: 150 + (i - n + 2) * 50
    });
    edges.push({
      id: `s-${id}`,
      f: 0,
      c: rand(1, 20)
    });
  }
  // randomly connect with neighbors
  for (let i = 0; i < n - 1; ++i) {
    if (Math.random() > 2 / 3) continue;
    let [u, v] = [layer1[i], layer1[i + 1]];
    if (Math.random() < 0.5) {
      [u, v] = [v, u]
    }
    edges.push({
      id: `${u.id}-${v.id}`,
      f: 0,
      c: rand(1, 20)
    });
  }
  nodes = [...nodes, ...layer1];

  // layer 2
  let m = rand(2, 4);
  const layer2 = [];
  for (let i = 0; i < m; ++i) {
    const id = currId++;
    layer2.push({
      id: `${id}`,
      x: 250,
      y: 150 + (i - m + 2) * 50
    });
    edges.push({
      id: `${id}-t`,
      f: 0,
      c: rand(1, 20)
    });
  }
  // randomly connect with neighbors
  for (let i = 0; i < m - 1; ++i) {
    if (Math.random() > 2 / 3) continue;
    let [u, v] = [layer2[i], layer2[i + 1]];
    if (Math.random() < 0.5) {
      [u, v] = [v, u]
    }
    edges.push({
      id: `${u.id}-${v.id}`,
      f: 0,
      c: rand(1, 20)
    });
  }
  nodes = [...nodes, ...layer2];

  // randomly connect layer1 and layer2
  for (let i = 0; i < n; ++i) {
    let l2: string[] = JSON.parse(JSON.stringify(layer2.map(e => e.id)));
    l2.sort(() => Math.random() < 0.5 ? 1 : -1);
    for (let j = 0; j < rand(1, 2); ++j) {
      edges.push({
        id: `${layer1[i].id}-${l2[j]}`,
        f: 0,
        c: rand(1, 20)
      })
    }
  }

  return new Graph(nodes, edges);
}

function App() {
  const algorithmNames = Array.from(algoMap.keys());
  const [algorithmName, setAlgorithmName] = useState(algorithmNames[0]);

  const [algorithm, setAlgorithm] = useState(algoMap.get('Ford-Fulkerson')!);

  const graphNames = Array.from(graphMap.keys());
  const [graphName, setGraphName] = useState(graphNames[0]);

  const [graph, setGraph] = useState(new Graph([], []));
  const [residualGraph, setResidualGraph] = useState(new Graph([], []));

  const [speed, setSpeed] = useState(0);
  function realSpeed(speed: number) {
    return 1.2 ** speed;
  }

  const [pc, setPc] = useState(0);
  const [numSteps, setNumSteps] = useState(1);
  function resetPc() {
    setPc(0);
    setNumSteps(1);
  }
  const debounce = useRef(true);
  function step() {
    if (!debounce.current) return;
    debounce.current = false;
    const currInst = algorithm.inst[pc];
    const [newGraph, newResidual, deltaPc] = currInst.run(graph, residualGraph);
    setPc(pc + deltaPc);
    if (deltaPc !== 0) setNumSteps(e => e + 1);
    setGraph(newGraph);
    setResidualGraph(newResidual);
    debounce.current = true;
  }

  const [running, setRunning] = useState(false);

  const lastRan = useRef(0);
  const [, updateState] = useState({});
  const forceUpdate = useCallback(() => updateState({}), []);
  useEffect(() => {
    const delay = 500 / realSpeed(speed);
    const ts = Date.now();
    if (running && ts > lastRan.current + delay) {
      step();
      lastRan.current = ts;
    } else {
      setTimeout(forceUpdate, (lastRan.current + delay) - ts);
    }
  });

  useEffect(() => {
    resetPc();
    const algorithm = algoMap.get(algorithmName)!;
    setAlgorithm(algorithm);
    const newGraph = graphMap.get(graphName)!.clone();
    setGraph(newGraph);
    setResidualGraph(newGraph.getResidualNetwork());
  }, [algorithmName, graphName]);

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <Box
        component="main"
        sx={{
          width: '100vw',
          maxWidth: '1024px',
          minHeight: '100vh',
          p: 3,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <Typography variant="h6">Flow Algorithms</Typography>
        <Typography variant="body1">EECS 477 | Alan Yang</Typography>
        <Divider sx={{ my: 2 }} />

        {/* Cytoscape graph */}
        <Box sx={{ mb: 2, display: 'flex', flexDirection: 'row' }}>
          <CytoscapeGraph title="Flow graph" width={460} height={300} graph={graph} />
          <CytoscapeGraph title="Residual network" width={460} height={300} graph={residualGraph} />
        </Box>

        {/* Controls */}
        <Card sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
            <Button
              variant="outlined"
              sx={{ mx: 1 }}
              onClick={() => {
                const newGraph = graphMap.get(graphName)!;
                setGraph(newGraph);
                setResidualGraph(newGraph.getResidualNetwork());
                resetPc();
              }}
            >
              Reset
            </Button>
            <Button
              variant="outlined"
              sx={{ mx: 1 }}
              onClick={step}
            >
              Step
            </Button>
            <Chip label={`Step: ${numSteps}`} sx={{ mx: 1, minWidth: 120 }} />
            <Chip label={`Flow: ${graph.flowValue()}`} sx={{ mx: 1, minWidth: 120 }} />
            <Button
              variant="contained"
              sx={{ mx: 1 }}
              onClick={() => setRunning(!running)}
            >
              {running ? "Stop" : "Start"}
            </Button>
            <Chip label={`Speed: ${(realSpeed(speed) * 100).toFixed(0)}%`} sx={{ mx: 1, minWidth: 120 }} />
            <Slider
              step={1}
              min={-5}
              max={5}
              value={speed}
              onChange={(_, v) => {
                setSpeed(v as number);
              }}
              sx={{ mx: 3, maxWidth: 240 }}
            />
          </Box>
          <Divider sx={{ my: 2 }} />
          <Box sx={{ display: 'flex', flexDirection: 'row' }}>
            {/* Algorithm */}
            <Box sx={{ width: 560 }}>
              <FormControl sx={{ minWidth: 240, mb: 2 }}>
                <InputLabel id="algorithm-label">Algorithm</InputLabel>
                <Select
                  labelId="algorithm-label"
                  label="Algorithm"
                  autoWidth
                  value={algorithmName}
                  onChange={(e) => {
                    setAlgorithmName(e.target.value);
                  }}
                >
                  {algorithmNames.map((e) => (
                    <MenuItem value={e} key={e}>
                      {e}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Box sx={{ fontFamily: 'monospace' }}>
                {
                  algorithm.inst.map((e, idx) => <pre key={e.code} style={{ backgroundColor: idx === pc ? '#ff0' : undefined, margin: 4 }}>
                    {e.code}
                  </pre>)
                }
              </Box>
            </Box>
            <Divider sx={{ mx: 3 }} orientation="vertical" flexItem />
            {/* Graph */}
            <Box>
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel id="graph-label">Graph</InputLabel>
                <Select
                  labelId="graph-label"
                  label="Graph"
                  autoWidth
                  value={graphName}
                  onChange={(e) => {
                    setGraphName(e.target.value);
                  }}
                >
                  {graphNames.map((e) => (
                    <MenuItem value={e} key={e}>
                      {e}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                onClick={() => {
                  resetPc();
                  const newGraph = randomGraph();
                  setGraph(newGraph);
                  setResidualGraph(newGraph.getResidualNetwork());
                }}
                variant="contained"
                sx={{
                  ml: 2
                }}
              >
                Random
              </Button>
            </Box>
          </Box>
        </Card>
      </Box>
    </Box>
  );
}

export default App;
