import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { RepoNode } from '../services/githubService';

interface GraphViewProps {
  nodes: RepoNode[];
  relationships: { source: string; target: string; type: string }[];
  onNodeClick?: (nodeId: string) => void;
}

interface D3Node extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  type: 'blob' | 'tree' | 'meta';
}

interface D3Link extends d3.SimulationLinkDatum<D3Node> {
  type: string;
}

export const GraphView: React.FC<GraphViewProps> = ({ nodes, relationships }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !nodes.length) return;

    const width = svgRef.current.clientWidth || 800;
    const height = 600;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Definitions for markers (arrows)
    svg.append("defs").selectAll("marker")
      .data(["meta", "hierarchy"])
      .enter().append("marker")
      .attr("id", d => `arrow-${d}`)
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 20)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("fill", d => d === 'meta' ? "#3b82f6aa" : "#ffffff11")
      .attr("d", "M0,-5L10,0L0,5");

    // Prepare data
    const d3Nodes: D3Node[] = [];
    const nodeMap = new Map<string, D3Node>();

    // Root node
    const root: D3Node = { id: 'root', name: 'REPOSITORY', type: 'tree' };
    d3Nodes.push(root);
    nodeMap.set('root', root);

    // Add actual directory nodes from tree
    nodes.filter(n => n.type === 'tree').slice(0, 40).forEach(n => {
      const node: D3Node = { id: n.path, name: n.path.split('/').pop() || n.path, type: 'tree' };
      d3Nodes.push(node);
      nodeMap.set(n.path, node);
    });

    // Add meta nodes from AI relationships
    relationships.forEach(rel => {
      [rel.source, rel.target].forEach(id => {
        if (!nodeMap.has(id)) {
          const node: D3Node = { id, name: id.split('/').pop() || id, type: 'meta' };
          d3Nodes.push(node);
          nodeMap.set(id, node);
        }
      });
    });

    const d3Links: D3Link[] = relationships.map(rel => ({
      source: rel.source,
      target: rel.target,
      type: rel.type
    })).filter(l => nodeMap.has(l.source as string) && nodeMap.has(l.target as string));

    // Hierarchical links
    nodes.filter(n => n.type === 'tree').forEach(n => {
      const parts = n.path.split('/');
      const parentPath = parts.length > 1 ? parts.slice(0, -1).join('/') : 'root';
      if (nodeMap.has(parentPath) && nodeMap.has(n.path)) {
        d3Links.push({ source: parentPath, target: n.path, type: 'hierarchy' });
      }
    });

    const simulation = d3.forceSimulation<D3Node>(d3Nodes)
      .force("link", d3.forceLink<D3Node, D3Link>(d3Links).id(d => d.id).distance(d => d.type === 'hierarchy' ? 60 : 140))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(50));

    const link = svg.append("g")
      .selectAll("line")
      .data(d3Links)
      .enter().append("line")
      .attr("stroke", d => d.type === 'hierarchy' ? "#ffffff11" : "#3b82f644")
      .attr("stroke-width", d => d.type === 'hierarchy' ? 1 : 1.5)
      .attr("stroke-dasharray", d => d.type === 'meta' ? "4,2" : "0")
      .attr("marker-end", d => `url(#arrow-${d.type === 'hierarchy' ? 'hierarchy' : 'meta'})`);

    const node = svg.append("g")
      .selectAll("g")
      .data(d3Nodes)
      .enter().append("g")
      .attr("cursor", "grab")
      .on("click", (event, d: any) => {
        if (onNodeClick) onNodeClick(d.id);
      })
      .on("mouseover", function() {
        d3.select(this).select("circle").attr("r", 10).attr("fill", "#60a5fa");
        d3.select(this).select("text").attr("fill", "#fff").attr("font-weight", "bold").attr("opacity", 1);
      })
      .on("mouseout", function(event, d: any) {
        d3.select(this).select("circle").attr("r", d.type === 'tree' ? 6 : 4).attr("fill", d.type === 'tree' ? "#3b82f6" : "#60a5fa33");
        d3.select(this).select("text").attr("fill", "#ffffff88").attr("font-weight", "normal").attr("opacity", 0.7);
      })
      .call(d3.drag<any, D3Node>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    node.append("circle")
      .attr("r", d => d.type === 'tree' ? 6 : 4)
      .attr("fill", d => d.type === 'tree' ? "#3b82f6" : "#60a5fa33")
      .attr("stroke", d => d.type === 'tree' ? "#60a5fa" : "#3b82f666")
      .attr("stroke-width", 1);

    node.append("text")
      .text(d => d.name)
      .attr("x", 12)
      .attr("y", 4)
      .attr("font-size", "9px")
      .attr("font-family", "inherit")
      .attr("fill", "#ffffff88")
      .attr("opacity", 0.7)
      .style("pointer-events", "none");

    simulation.on("tick", () => {
      link
        .attr("x1", d => (d.source as any).x)
        .attr("y1", d => (d.source as any).y)
        .attr("x2", d => (d.target as any).x)
        .attr("y2", d => (d.target as any).y);

      node
        .attr("transform", d => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
      d3.select(event.sourceEvent.target.parentNode).attr("cursor", "grabbing");
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
      d3.select(event.sourceEvent.target.parentNode).attr("cursor", "grab");
    }

    return () => { simulation.stop(); };
  }, [nodes, relationships]);

  return (
    <div className="w-full h-full bg-[#050505] border border-white/5 rounded-2xl relative group shadow-2xl">
      <div className="absolute top-4 left-6 z-10 space-y-1">
        <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">Live Architectural Schematic</h3>
        <p className="text-[9px] text-zinc-600">Drag nodes to reorganize the mental model</p>
      </div>
      
      <div className="absolute bottom-6 left-6 z-10 flex gap-4">
         <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest">Directories</span>
         </div>
         <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-400/20 border border-blue-400" />
            <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest">Global Logic</span>
         </div>
      </div>

      <svg ref={svgRef} className="w-full h-full" />
    </div>
  );
};
