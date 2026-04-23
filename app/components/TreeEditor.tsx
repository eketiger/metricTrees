'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  useReactFlow,
  MarkerType,
  type Edge,
  type Node,
  type NodeChange,
  type EdgeChange,
  type Connection,
} from 'reactflow';
import { MetricNodeComponent } from './MetricNode';
import { AskPanel } from './AskPanel';
import { CopilotToolbar } from './CopilotToolbar';
import { QueryPanel } from './QueryPanel';
import { DataSourcesModal } from './DataSourcesModal';
import { useLiveValues } from './useLiveValues';
import { SEED_NODES, SEED_EDGES, type DesignerNode, type DesignerEdge } from '@/lib/seed-data';
import { computeAll } from '@/lib/compute';

const nodeTypes = { metric: MetricNodeComponent };

interface TreeEditorProps {
  treeId: string;
  initialTitle?: string;
  initialStatus?: 'draft' | 'published' | 'archived';
}

function uid() {
  return 'n_' + Math.random().toString(36).slice(2, 9);
}

function defaultData(kind: DesignerNode['data']['kind']): DesignerNode['data'] {
  switch (kind) {
    case 'input': return { kind, name: 'New Metric', value: 100, unit: '', chartType: 'area' };
    case 'formula': return { kind, name: 'New Formula', formula: '', chartType: 'area' };
    case 'output': return { kind, name: 'New North Star', formula: '', unit: '$', target: 1_000_000, chartType: 'area' };
    case 'segment': return { kind, name: 'New Breakdown', segments: [{ label: 'A', value: 0.5 }, { label: 'B', value: 0.3 }] };
    case 'strategy': return { kind, name: 'New Strategy', text: 'Describe the initiative…', owner: 'XX' };
    case 'annotation': return { kind, name: 'Note', text: 'Add context here…' };
  }
}

function EditorInner({ treeId, initialTitle = 'Untitled Tree', initialStatus = 'draft' }: TreeEditorProps) {
  const rf = useReactFlow();
  const [nodes, setNodes] = useState<Node[]>(SEED_NODES as unknown as Node[]);
  const [edges, setEdges] = useState<Edge[]>(SEED_EDGES as unknown as Edge[]);
  const [docName, setDocName] = useState(initialTitle);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tool, setTool] = useState<'select' | 'metric' | 'formula' | 'output' | 'strategy' | 'note'>('select');
  const [askOpen, setAskOpen] = useState(false);
  const [status, setStatus] = useState(initialStatus);
  const [dataSourcesOpen, setDataSourcesOpen] = useState(false);
  const [rightTab, setRightTab] = useState<'copilot' | 'query'>('copilot');
  const [liveMode, setLiveMode] = useState(false);
  const liveStream = useLiveValues(treeId, liveMode);

  const { computed, errors } = useMemo(
    () => computeAll(nodes as unknown as { id: string; data: { kind: string; name?: string; value?: number; formula?: string } }[]),
    [nodes],
  );

  const displayNodes = useMemo(
    () =>
      nodes.map((n) => {
        const liveVal = liveStream.values[n.id];
        const liveErr = liveStream.errors[n.id];
        return {
          ...n,
          type: 'metric',
          data: {
            ...n.data,
            computedValue: liveVal !== undefined ? liveVal : computed[n.id],
            error: liveErr ?? errors[n.id],
            onRename: (id: string, name: string, cancel?: boolean) => {
              setNodes((ns) => ns.map((nn) => nn.id === id ? { ...nn, data: { ...nn.data, name: cancel ? nn.data.name : name, editing: false } } : nn));
            },
          },
        };
      }),
    [nodes, computed, errors, liveStream.values, liveStream.errors],
  );

  const displayEdges = useMemo(
    () =>
      edges.map((e) => ({
        ...e,
        markerEnd: { type: MarkerType.Arrow, width: 16, height: 16 },
        className: 'strength-' + ((e.data as { strength?: string } | undefined)?.strength ?? 'moderate'),
      })),
    [edges],
  );

  const onNodesChange = useCallback((changes: NodeChange[]) => setNodes((ns) => applyNodeChanges(changes, ns)), []);
  const onEdgesChange = useCallback((changes: EdgeChange[]) => setEdges((es) => applyEdgeChanges(changes, es)), []);
  const onConnect = useCallback((params: Connection) => setEdges((es) => addEdge({ ...params, data: { strength: 'moderate' } }, es)), []);

  const addNodeAt = (kind: DesignerNode['data']['kind'], pos: { x: number; y: number }) => {
    const id = uid();
    setNodes((ns) => [...ns, { id, type: 'metric', position: pos, data: defaultData(kind) } as Node]);
    setSelectedId(id);
  };

  const onPaneClick = useCallback(
    (e: React.MouseEvent) => {
      if (tool === 'select') return;
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const pos = rf.project({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      const kindMap: Record<string, DesignerNode['data']['kind']> = {
        metric: 'input', formula: 'formula', output: 'output', strategy: 'strategy', note: 'annotation',
      };
      addNodeAt(kindMap[tool] ?? 'input', pos);
      setTool('select');
    },
    [tool, rf],
  );

  useEffect(() => {
    // Auto-save title/status
    const t = setTimeout(() => {
      fetch(`/api/metric-trees/${treeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: docName, status }),
      }).catch(() => {});
    }, 400);
    return () => clearTimeout(t);
  }, [treeId, docName, status]);

  const publish = async () => {
    setStatus('published');
  };

  const selectedNode = nodes.find((n) => n.id === selectedId) ?? null;

  return (
    <div className="app no-flyout">
      <div className="topbar">
        <a className="tb-btn" href="/home" title="Back to workspace">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 3L4 7l5 4" stroke="currentColor" strokeLinecap="round" /></svg>
        </a>
        <div className="brand"><div className="brand-mark" /></div>
        <div className="doc-name-wrap">
          <div className="doc-name-status" title="Auto-saved" />
          <input className="doc-name-input" style={{ width: `${Math.max(docName.length, 8)}ch` }} value={docName} onChange={(e) => setDocName(e.target.value)} />
        </div>
        <div className="tb-group">
          <button className="tb-btn" onClick={() => rf.fitView({ padding: 0.15, duration: 300 })}>Fit</button>
          <button className="tb-btn" onClick={() => setDataSourcesOpen(true)} title="Manage data sources">
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><ellipse cx="7" cy="3.5" rx="4.5" ry="1.5" stroke="currentColor"/><path d="M2.5 3.5V10c0 .8 2 1.5 4.5 1.5s4.5-.7 4.5-1.5V3.5M2.5 7c0 .8 2 1.5 4.5 1.5S11.5 7.8 11.5 7" stroke="currentColor"/></svg>
            Data
          </button>
          <button
            className={liveMode ? 'tb-btn primary' : 'tb-btn'}
            onClick={() => setLiveMode((v) => !v)}
            title={liveMode ? 'Live polling is on' : 'Start live polling'}
          >
            {liveMode ? (liveStream.connected ? '● Live' : '○ Connecting…') : 'Go Live'}
          </button>
          <button className="tb-btn" onClick={() => setAskOpen(true)}>Ask</button>
          <button className={status === 'published' ? 'tb-btn primary' : 'tb-btn'} onClick={publish}>
            {status === 'published' ? 'Published' : 'Publish'}
          </button>
        </div>
        <div className="tb-spacer" />
      </div>

      <div className="rail">
        <button className="rail-btn" title="Library">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="3" y="3" width="5" height="5" stroke="currentColor" rx="1" /><rect x="10" y="3" width="5" height="5" stroke="currentColor" rx="1" /><rect x="3" y="10" width="5" height="5" stroke="currentColor" rx="1" /><rect x="10" y="10" width="5" height="5" stroke="currentColor" rx="1" /></svg>
        </button>
      </div>

      <div className="canvas" onClick={onPaneClick} style={{ cursor: tool !== 'select' ? 'crosshair' : 'default' }}>
        <ReactFlow
          nodes={displayNodes}
          edges={displayEdges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onSelectionChange={({ nodes: sel }) => setSelectedId(sel?.[0]?.id ?? null)}
          onNodeDoubleClick={(_, n) => {
            if (n.data.kind === 'annotation' || n.data.kind === 'segment') return;
            setNodes((ns) => ns.map((nn) => nn.id === n.id ? { ...nn, data: { ...nn.data, editing: true } } : nn));
          }}
          proOptions={{ hideAttribution: true }}
          fitView
          minZoom={0.2}
          maxZoom={2}
        >
          <Background color="var(--grid-color)" gap={22} size={1} />
          <MiniMap
            nodeColor={(n) => {
              const k = (n.data as { kind?: string } | undefined)?.kind;
              return k === 'output' ? '#111' : k === 'formula' ? 'var(--accent)' : '#d4d4d2';
            }}
            maskColor="rgba(0,0,0,0.04)"
            pannable
            zoomable
            position="bottom-right"
            style={{ width: 150, height: 100 }}
          />
          <Controls position="bottom-left" />
        </ReactFlow>

        <div className="floating-tools">
          {[
            ['select', 'Select'],
            ['metric', 'Metric'],
            ['formula', 'Formula'],
            ['output', 'North star'],
            ['strategy', 'Strategy'],
            ['note', 'Note'],
          ].map(([id, label]) => (
            <button key={id} className={`ft-btn${tool === id ? ' active' : ''}`} onClick={() => setTool(id as typeof tool)}>
              <span>{label}</span>
            </button>
          ))}
        </div>

        <div className="help-pill">
          <span><b>Double-click</b> rename</span>
          <span><b>Drag handle</b> connect</span>
          <span><b>Ask</b> query the tree</span>
        </div>
      </div>

      <div className="right">
        {selectedNode ? (
          <>
            <div className="right-tabs">
              <div className={`right-tab${rightTab === 'copilot' ? ' active' : ''}`} onClick={() => setRightTab('copilot')}>Copilot</div>
              <div className={`right-tab${rightTab === 'query' ? ' active' : ''}`} onClick={() => setRightTab('query')}>Query</div>
            </div>
            <div className="right-body">
              {rightTab === 'copilot' && (
                <CopilotToolbar
                  treeId={treeId}
                  node={selectedNode}
                  onPatch={(patch) => setNodes((ns) => ns.map((n) => n.id === selectedNode.id ? { ...n, data: { ...n.data, ...patch } } : n))}
                />
              )}
              {rightTab === 'query' && (
                <QueryPanel
                  treeId={treeId}
                  nodeId={selectedNode.id}
                  dataSourceId={(selectedNode.data as { dataSourceId?: string | null }).dataSourceId ?? null}
                  initialQuery={(selectedNode.data as { query?: string }).query ?? ''}
                  onValue={(value) => setNodes((ns) => ns.map((n) => n.id === selectedNode.id ? { ...n, data: { ...n.data, value, computedValue: value ?? undefined } } : n))}
                  onError={(e) => setNodes((ns) => ns.map((n) => n.id === selectedNode.id ? { ...n, data: { ...n.data, error: e } } : n))}
                  onDataSourceChange={(id) => setNodes((ns) => ns.map((n) => n.id === selectedNode.id ? { ...n, data: { ...n.data, dataSourceId: id } } : n))}
                  onOpenDataSources={() => setDataSourcesOpen(true)}
                />
              )}
            </div>
          </>
        ) : (
          <div className="inspector-empty">
            <div className="inspector-empty-mark">◌</div>
            Select a node to inspect
          </div>
        )}
      </div>

      {askOpen && <AskPanel treeId={treeId} onClose={() => setAskOpen(false)} />}
      {dataSourcesOpen && <DataSourcesModal onClose={() => setDataSourcesOpen(false)} />}
    </div>
  );
}

export function TreeEditor(props: TreeEditorProps) {
  return (
    <ReactFlowProvider>
      <EditorInner {...props} />
    </ReactFlowProvider>
  );
}
