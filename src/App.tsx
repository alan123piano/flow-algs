import { Box, Button, Card, Chip, CssBaseline, Divider, FormControl, InputLabel, MenuItem, Select, Slider, Typography } from '@mui/material';
import React, { useEffect, useState } from 'react';
import CytoscapeGraph from './CytoscapeGraph';
import { Algorithm } from './Algorithm';
import { Graph } from './Graph';
import Textbook1 from './graphs/Textbook1';
import Textbook2 from './graphs/Textbook2';
import FFPitfall from './graphs/FFPitfall';

const algoMap = new Map<string, Algorithm>();

const graphMap = new Map<string, Graph>();
graphMap.set('Textbook1', new Graph(Textbook1.nodes, Textbook1.edges));
graphMap.set('Textbook2', new Graph(Textbook2.nodes, Textbook2.edges));
graphMap.set('FFPitfall', new Graph(FFPitfall.nodes, FFPitfall.edges));

function App() {
  const algorithms = ['Ford-Fulkerson', 'Dinitz', 'Edmonds-Karp', 'Preflow-push'];
  const [algorithm, setAlgorithm] = useState(algorithms[0]);

  const graphNames = Array.from(graphMap.keys());
  const [graphName, setGraphName] = useState(graphNames[0]);

  const [graph, setGraph] = useState(new Graph([], []));
  const [residualGraph, setResidualGraph] = useState(new Graph([], []));

  const [speed, setSpeed] = useState(0);
  function realSpeed(speed: number) {
    return 1.2 ** speed;
  }

  useEffect(() => {
    const graph = graphMap.get(graphName)!;
    setGraph(graph);
    setResidualGraph(graph.getResidualNetwork());
  }, [graphName]);

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
            <Button variant="outlined" sx={{ mx: 1 }}>Step</Button>
            <Chip label="Step: 1" sx={{ mx: 1, minWidth: 120 }} />
            <Button variant="contained" sx={{ mx: 1 }}>Run</Button>
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
            <Box sx={{ width: 420 }}>
              <FormControl sx={{ minWidth: 240, mb: 2 }}>
                <InputLabel id="algorithm-label">Algorithm</InputLabel>
                <Select
                  labelId="algorithm-label"
                  label="Algorithm"
                  autoWidth
                  value={algorithm}
                  onChange={(e) => {
                    setAlgorithm(e.target.value);
                  }}
                >
                  {algorithms.map((e) => (
                    <MenuItem value={e} key={e}>
                      {e}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Box sx={{ fontFamily: 'monospace' }}>
                <div style={{ backgroundColor: '#ff0' }}>f := 0</div>
                <div>Repeat:</div>
                <div>&emsp;Find path P from s to t in G_f</div>
                <div>&emsp;f' := maximum flow along P</div>
                <div>&emsp;f := f + f'</div>
                <div>Until there is no path from s to t in G_f</div>
                <div>Return f</div>
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
