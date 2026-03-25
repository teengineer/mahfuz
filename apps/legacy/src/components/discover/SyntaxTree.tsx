import { memo, useRef, useEffect, useState } from "react";
import type { SyntaxNode } from "@mahfuz/shared/types";
import { SyntaxNodeComponent } from "./SyntaxNodeComponent";
import { ROLE_COLORS } from "./SyntaxLegend";

interface SyntaxTreeProps {
  nodes: SyntaxNode[];
  highlightPosition?: number | null;
}

interface ArcData {
  x1: number;
  x2: number;
  y1: number;
  y2: number;
  color: string;
}

export const SyntaxTree = memo(function SyntaxTree({ nodes, highlightPosition }: SyntaxTreeProps) {
  const outerRef = useRef<HTMLDivElement>(null);
  const wordContainerRef = useRef<HTMLDivElement>(null);
  const [arcs, setArcs] = useState<ArcData[]>([]);

  // Calculate arc positions after render
  useEffect(() => {
    const outer = outerRef.current;
    const wordContainer = wordContainerRef.current;
    if (!outer || !wordContainer) return;

    // Wait for layout
    requestAnimationFrame(() => {
      const children = Array.from(wordContainer.children) as HTMLElement[];
      const outerRect = outer.getBoundingClientRect();
      const newArcs: ArcData[] = [];

      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (node.parent == null) continue;

        const parentIdx = nodes.findIndex((n) => n.p === node.parent);
        if (parentIdx === -1) continue;

        const childEl = children[i];
        const parentEl = children[parentIdx];
        if (!childEl || !parentEl) continue;

        const childRect = childEl.getBoundingClientRect();
        const parentRect = parentEl.getBoundingClientRect();

        newArcs.push({
          x1: parentRect.left + parentRect.width / 2 - outerRect.left,
          x2: childRect.left + childRect.width / 2 - outerRect.left,
          y1: parentRect.top - outerRect.top,
          y2: childRect.top - outerRect.top,
          color: ROLE_COLORS[node.role] || "#6b7280",
        });
      }

      setArcs(newArcs);
    });
  }, [nodes]);

  return (
    <div ref={outerRef} className="relative">
      {/* SVG arcs overlay */}
      {arcs.length > 0 && (
        <svg className="pointer-events-none absolute inset-0 h-full w-full" style={{ overflow: "visible" }}>
          {arcs.map((arc, i) => {
            const midX = (arc.x1 + arc.x2) / 2;
            const baseY = Math.min(arc.y1, arc.y2);
            const height = Math.abs(arc.x2 - arc.x1) * 0.3 + 12;
            return (
              <path
                key={i}
                d={`M ${arc.x1} ${arc.y1} Q ${midX} ${baseY - height} ${arc.x2} ${arc.y2}`}
                fill="none"
                stroke={arc.color}
                strokeWidth={1.5}
                strokeDasharray="3,2"
                opacity={0.5}
              />
            );
          })}
        </svg>
      )}

      {/* Word nodes */}
      <div
        ref={wordContainerRef}
        className="flex flex-wrap gap-2 pt-12 pb-2"
        dir="rtl"
      >
        {nodes.map((node) => (
          <SyntaxNodeComponent key={node.p} node={node} isHighlighted={highlightPosition === node.p} />
        ))}
      </div>
    </div>
  );
});
