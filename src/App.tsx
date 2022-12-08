import { Box, Button, Card, Chip, CssBaseline, Divider, FormControl, InputLabel, MenuItem, Select, Slider, Typography } from '@mui/material';
import React, { useEffect, useRef, useState } from 'react';
import CytoscapeGraph from './CytoscapeGraph';
import { Algorithm } from './Algorithm';
import { Graph } from './Graph';
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

  const [currIntervalId, setCurrIntervalId] = useState<NodeJS.Timer | undefined>(undefined);
  function unsetInterval() {
    if (currIntervalId === undefined) return;
    clearInterval(currIntervalId);
    setCurrIntervalId(undefined);
  }
  function startInterval(speed: number) {
    // unsetInterval();
    // const intervalId = setInterval(step, 500 / realSpeed(speed));
    // setCurrIntervalId(intervalId);
  }

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
              onClick={() => {
                if (currIntervalId === undefined) {
                  startInterval(speed);
                } else {
                  unsetInterval();
                }
              }}
            >
              {currIntervalId === undefined ? "Start" : "Stop"}
            </Button>
            <Chip label={`Speed: ${(realSpeed(speed) * 100).toFixed(0)}%`} sx={{ mx: 1, minWidth: 120 }} />
            <Slider
              step={1}
              min={-5}
              max={5}
              value={speed}
              onChange={(_, v) => {
                setSpeed(v as number);
                if (currIntervalId !== undefined) startInterval(v as number);
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
            </Box>
          </Box>
        </Card>
      </Box>
    </Box>
  );
}

export default App;
