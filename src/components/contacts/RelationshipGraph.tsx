'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Info,
} from 'lucide-react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import '@/lib/utils';

import type { ExtendedContact, ContactCategory } from './contact.types';

interface RelationshipGraphProps {
  contacts: ExtendedContact[];
  selectedContactId?: string;
  onContactSelect?: (contact: ExtendedContact) => void;
  highlightPath?: string[]; // Contact IDs to highlight as a path
}

interface Node {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  contact: ExtendedContact;
  radius: number;
}

interface Link {
  source: string;
  target: string;
  strength: number;
  type: 'company' | 'deal' | 'interaction';
}

const categoryColors: Record<ContactCategory, { bg: string; border: string; text: string }> = {
  Founders: { bg: '#F3E8FF', border: '#A855F7', text: '#7E22CE' },
  Executives: { bg: '#DBEAFE', border: '#3B82F6', text: '#1D4ED8' },
  Advisors: { bg: '#CCFBF1', border: '#14B8A6', text: '#0F766E' },
  Bankers: { bg: '#FEF3C7', border: '#F59E0B', text: '#B45309' },
  Lawyers: { bg: '#F1F5F9', border: '#64748B', text: '#334155' },
  Investors: { bg: '#DCFCE7', border: '#22C55E', text: '#15803D' },
  Accountants: { bg: '#FFEDD5', border: '#F97316', text: '#C2410C' },
  Board: { bg: '#E0E7FF', border: '#6366F1', text: '#4338CA' },
};

function generateLinks(contacts: ExtendedContact[]): Link[] {
  const links: Link[] = [];

  // Generate links based on same company
  const companyGroups = new Map<string, string[]>();
  contacts.forEach((c) => {
    if (c.company) {
      const existing = companyGroups.get(c.company) || [];
      existing.push(c.id);
      companyGroups.set(c.company, existing);
    }
  });

  companyGroups.forEach((ids) => {
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const sourceId = ids[i];
        const targetId = ids[j];
        if (sourceId && targetId) {
          links.push({
            source: sourceId,
            target: targetId,
            strength: 0.8,
            type: 'company',
          });
        }
      }
    }
  });

  // Generate links based on shared deals
  const dealGroups = new Map<string, string[]>();
  contacts.forEach((c) => {
    c.linkedDeals.forEach((deal) => {
      const existing = dealGroups.get(deal.id) || [];
      existing.push(c.id);
      dealGroups.set(deal.id, existing);
    });
  });

  dealGroups.forEach((ids) => {
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const sourceId = ids[i];
        const targetId = ids[j];
        if (sourceId && targetId) {
          // Check if link already exists
          const exists = links.some(
            (l) =>
              (l.source === sourceId && l.target === targetId) ||
              (l.source === targetId && l.target === sourceId)
          );
          if (!exists) {
            links.push({
              source: sourceId,
              target: targetId,
              strength: 0.9,
              type: 'deal',
            });
          }
        }
      }
    }
  });

  // Add some interaction-based links (simulated based on high relationship scores)
  contacts.forEach((c) => {
    if (c.relationshipScore >= 80) {
      // Find other high-score contacts in the network
      contacts
        .filter((other) => other.id !== c.id && other.relationshipScore >= 75)
        .slice(0, 2)
        .forEach((other) => {
          const exists = links.some(
            (l) =>
              (l.source === c.id && l.target === other.id) ||
              (l.source === other.id && l.target === c.id)
          );
          if (!exists) {
            links.push({
              source: c.id,
              target: other.id,
              strength: 0.5,
              type: 'interaction',
            });
          }
        });
    }
  });

  return links;
}

export function RelationshipGraph({
  contacts,
  selectedContactId,
  onContactSelect,
  highlightPath,
}: RelationshipGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [links, setLinks] = useState<Link[]>([]);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState<Node | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<ContactCategory | 'all'>('all');
  const [showLegend, setShowLegend] = useState(true);
  const animationRef = useRef<number>();

  // Initialize nodes and links
  useEffect(() => {
    const width = containerRef.current?.clientWidth || 800;
    const height = 500;

    // Group contacts by category for initial positioning
    const categoryGroups = new Map<ContactCategory, ExtendedContact[]>();
    contacts.forEach((c) => {
      const existing = categoryGroups.get(c.category) || [];
      existing.push(c);
      categoryGroups.set(c.category, existing);
    });

    // Position nodes in clusters by category
    const categories = Array.from(categoryGroups.keys());
    const angleStep = (2 * Math.PI) / categories.length;
    const clusterRadius = Math.min(width, height) * 0.3;

    const newNodes: Node[] = [];
    categories.forEach((category, catIndex) => {
      const groupContacts = categoryGroups.get(category) || [];
      const centerAngle = catIndex * angleStep;
      const centerX = width / 2 + Math.cos(centerAngle) * clusterRadius;
      const centerY = height / 2 + Math.sin(centerAngle) * clusterRadius;

      groupContacts.forEach((contact, idx) => {
        const subAngle = (idx / groupContacts.length) * 2 * Math.PI;
        const subRadius = 30 + Math.random() * 50;
        newNodes.push({
          id: contact.id,
          x: centerX + Math.cos(subAngle) * subRadius,
          y: centerY + Math.sin(subAngle) * subRadius,
          vx: 0,
          vy: 0,
          contact,
          radius: 15 + (contact.relationshipScore / 100) * 15, // Bigger nodes for stronger relationships
        });
      });
    });

    setNodes(newNodes);
    setLinks(generateLinks(contacts));
  }, [contacts]);

  // Force simulation
  useEffect(() => {
    if (nodes.length === 0) {return;}

    const simulate = () => {
      setNodes((currentNodes) => {
        const newNodes = [...currentNodes];
        const width = containerRef.current?.clientWidth || 800;
        const height = 500;

        // Apply forces
        newNodes.forEach((node) => {
          // Center force
          const dx = width / 2 - node.x;
          const dy = height / 2 - node.y;
          node.vx += dx * 0.001;
          node.vy += dy * 0.001;

          // Repulsion between nodes
          newNodes.forEach((other) => {
            if (node.id === other.id) {return;}
            const ddx = node.x - other.x;
            const ddy = node.y - other.y;
            const dist = Math.sqrt(ddx * ddx + ddy * ddy) || 1;
            const minDist = node.radius + other.radius + 20;
            if (dist < minDist) {
              const force = ((minDist - dist) / dist) * 0.5;
              node.vx += (ddx * force) / dist;
              node.vy += (ddy * force) / dist;
            }
          });
        });

        // Apply link forces
        links.forEach((link) => {
          const source = newNodes.find((n) => n.id === link.source);
          const target = newNodes.find((n) => n.id === link.target);
          if (!source || !target) {return;}

          const dx = target.x - source.x;
          const dy = target.y - source.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const targetDist = 100 + (1 - link.strength) * 50;
          const force = (dist - targetDist) * 0.01 * link.strength;

          source.vx += (dx / dist) * force;
          source.vy += (dy / dist) * force;
          target.vx -= (dx / dist) * force;
          target.vy -= (dy / dist) * force;
        });

        // Update positions with damping
        newNodes.forEach((node) => {
          node.vx *= 0.9;
          node.vy *= 0.9;
          node.x += node.vx;
          node.y += node.vy;

          // Keep within bounds
          node.x = Math.max(node.radius, Math.min(width - node.radius, node.x));
          node.y = Math.max(node.radius, Math.min(height - node.radius, node.y));
        });

        return newNodes;
      });

      animationRef.current = requestAnimationFrame(simulate);
    };

    animationRef.current = requestAnimationFrame(simulate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [links, nodes.length]);

  // Draw on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {return;}

    const ctx = canvas.getContext('2d');
    if (!ctx) {return;}

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Apply zoom and pan
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // Filter nodes if needed
    const visibleNodes =
      categoryFilter === 'all'
        ? nodes
        : nodes.filter((n) => n.contact.category === categoryFilter);

    const visibleNodeIds = new Set(visibleNodes.map((n) => n.id));

    // Draw links
    links.forEach((link) => {
      if (!visibleNodeIds.has(link.source) || !visibleNodeIds.has(link.target)) {return;}

      const source = nodes.find((n) => n.id === link.source);
      const target = nodes.find((n) => n.id === link.target);
      if (!source || !target) {return;}

      const isHighlighted =
        highlightPath?.includes(link.source) && highlightPath?.includes(link.target);

      ctx.beginPath();
      ctx.moveTo(source.x, source.y);
      ctx.lineTo(target.x, target.y);

      if (isHighlighted) {
        ctx.strokeStyle = '#3B82F6';
        ctx.lineWidth = 3;
      } else {
        ctx.strokeStyle =
          link.type === 'company'
            ? 'rgba(34, 197, 94, 0.3)'
            : link.type === 'deal'
            ? 'rgba(59, 130, 246, 0.3)'
            : 'rgba(148, 163, 184, 0.2)';
        ctx.lineWidth = link.strength * 2;
      }

      ctx.stroke();
    });

    // Draw nodes
    visibleNodes.forEach((node) => {
      const colors = categoryColors[node.contact.category];
      const isSelected = node.id === selectedContactId;
      const isHovered = hoveredNode?.id === node.id;
      const isInPath = highlightPath?.includes(node.id);

      // Node shadow
      if (isSelected || isHovered || isInPath) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius + 4, 0, 2 * Math.PI);
        ctx.fillStyle = isInPath ? 'rgba(59, 130, 246, 0.3)' : 'rgba(0, 0, 0, 0.1)';
        ctx.fill();
      }

      // Node circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius, 0, 2 * Math.PI);
      ctx.fillStyle = colors.bg;
      ctx.fill();
      ctx.strokeStyle = isSelected || isInPath ? '#3B82F6' : colors.border;
      ctx.lineWidth = isSelected || isInPath ? 3 : 2;
      ctx.stroke();

      // Relationship score ring
      const scoreAngle = (node.contact.relationshipScore / 100) * 2 * Math.PI - Math.PI / 2;
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius + 2, -Math.PI / 2, scoreAngle);
      ctx.strokeStyle =
        node.contact.relationshipScore >= 80
          ? '#22C55E'
          : node.contact.relationshipScore >= 60
          ? '#F59E0B'
          : node.contact.relationshipScore >= 40
          ? '#F97316'
          : '#EF4444';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Initials
      const initials = `${node.contact.firstName[0]}${node.contact.lastName[0]}`;
      ctx.font = `bold ${node.radius * 0.7}px Inter, system-ui, sans-serif`;
      ctx.fillStyle = colors.text;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(initials, node.x, node.y);
    });

    ctx.restore();

    // Draw tooltip for hovered node
    if (hoveredNode && visibleNodeIds.has(hoveredNode.id)) {
      const screenX = hoveredNode.x * zoom + pan.x;
      const screenY = hoveredNode.y * zoom + pan.y;

      ctx.save();
      ctx.font = '12px Inter, system-ui, sans-serif';

      const name = `${hoveredNode.contact.firstName} ${hoveredNode.contact.lastName}`;
      const title = hoveredNode.contact.title;
      const company = hoveredNode.contact.company;
      const score = `Score: ${hoveredNode.contact.relationshipScore}`;

      const maxWidth = Math.max(
        ctx.measureText(name).width,
        ctx.measureText(title).width,
        ctx.measureText(company).width,
        ctx.measureText(score).width
      );

      const tooltipWidth = maxWidth + 20;
      const tooltipHeight = 80;
      const tooltipX = screenX + hoveredNode.radius * zoom + 10;
      const tooltipY = screenY - tooltipHeight / 2;

      // Tooltip background
      ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
      ctx.beginPath();
      ctx.roundRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight, 6);
      ctx.fill();

      // Tooltip content
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 12px Inter, system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(name, tooltipX + 10, tooltipY + 18);

      ctx.fillStyle = '#94A3B8';
      ctx.font = '11px Inter, system-ui, sans-serif';
      ctx.fillText(title, tooltipX + 10, tooltipY + 35);
      ctx.fillText(company, tooltipX + 10, tooltipY + 50);

      const scoreColor =
        hoveredNode.contact.relationshipScore >= 80
          ? '#22C55E'
          : hoveredNode.contact.relationshipScore >= 60
          ? '#F59E0B'
          : '#F97316';
      ctx.fillStyle = scoreColor;
      ctx.font = 'bold 11px Inter, system-ui, sans-serif';
      ctx.fillText(score, tooltipX + 10, tooltipY + 68);

      ctx.restore();
    }
  }, [nodes, links, zoom, pan, hoveredNode, selectedContactId, categoryFilter, highlightPath]);

  // Handle canvas interactions
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) {return;}

      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left - pan.x) / zoom;
      const y = (e.clientY - rect.top - pan.y) / zoom;

      if (isDragging) {
        setPan({
          x: e.clientX - rect.left - dragStart.x,
          y: e.clientY - rect.top - dragStart.y,
        });
        return;
      }

      // Check for node hover
      const hovered = nodes.find((node) => {
        const dx = node.x - x;
        const dy = node.y - y;
        return Math.sqrt(dx * dx + dy * dy) <= node.radius;
      });

      setHoveredNode(hovered || null);
      canvas.style.cursor = hovered ? 'pointer' : isDragging ? 'grabbing' : 'grab';
    },
    [nodes, zoom, pan, isDragging, dragStart]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) {return;}

      const rect = canvas.getBoundingClientRect();

      if (hoveredNode) {
        onContactSelect?.(hoveredNode.contact);
      } else {
        setIsDragging(true);
        setDragStart({
          x: e.clientX - rect.left - pan.x,
          y: e.clientY - rect.top - pan.y,
        });
      }
    },
    [hoveredNode, onContactSelect, pan]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom((z) => Math.max(0.5, Math.min(2, z * delta)));
  }, []);

  const resetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <CardTitle>Relationship Network</CardTitle>
          <Badge variant="secondary">{contacts.length} contacts</Badge>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as ContactCategory | 'all')}
            className="input h-9 w-auto text-sm"
          >
            <option value="all">All Categories</option>
            {Object.keys(categoryColors).map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <Button variant="secondary" size="sm" onClick={() => setShowLegend(!showLegend)}>
            <Info className="h-4 w-4" />
          </Button>
          <div className="flex items-center border border-slate-200 rounded-lg">
            <button
              onClick={() => setZoom((z) => Math.min(2, z * 1.2))}
              className="p-2 hover:bg-slate-100 transition-colors"
            >
              <ZoomIn className="h-4 w-4 text-slate-600" />
            </button>
            <button
              onClick={() => setZoom((z) => Math.max(0.5, z * 0.8))}
              className="p-2 hover:bg-slate-100 transition-colors border-l border-slate-200"
            >
              <ZoomOut className="h-4 w-4 text-slate-600" />
            </button>
            <button
              onClick={resetView}
              className="p-2 hover:bg-slate-100 transition-colors border-l border-slate-200"
            >
              <Maximize2 className="h-4 w-4 text-slate-600" />
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div ref={containerRef} className="relative" style={{ height: 500 }}>
          <canvas
            ref={canvasRef}
            width={800}
            height={500}
            className="w-full h-full"
            onMouseMove={handleMouseMove}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
          />

          {/* Legend */}
          {showLegend && (
            <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm border border-slate-200 rounded-lg p-3 shadow-lg">
              <h4 className="text-xs font-semibold text-slate-700 mb-2">Categories</h4>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                {Object.entries(categoryColors).map(([category, colors]) => (
                  <div key={category} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full border-2"
                      style={{ backgroundColor: colors.bg, borderColor: colors.border }}
                    />
                    <span className="text-xs text-slate-600">{category}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-2 border-t border-slate-100">
                <h4 className="text-xs font-semibold text-slate-700 mb-1">Connections</h4>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-0.5 bg-green-400" />
                    <span className="text-xs text-slate-500">Same company</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-0.5 bg-blue-400" />
                    <span className="text-xs text-slate-500">Shared deal</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-0.5 bg-slate-300" />
                    <span className="text-xs text-slate-500">Interaction</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="absolute bottom-4 right-4 text-xs text-slate-400">
            <span>Scroll to zoom - Drag to pan - Click to select</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default RelationshipGraph;
