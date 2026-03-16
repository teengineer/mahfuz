import { memo, useRef, useEffect, useState } from "react";
import type { SyntaxNode } from "@mahfuz/shared/types";
import { SyntaxNodeComponent } from "./SyntaxNodeComponent";
import { ROLE_COLORS } from "./SyntaxLegend";

interface SyntaxTreeProps {
  nodes: SyntaxNode[];
}

export const SyntaxTree = memo(function SyntaxTree({ nodes }: SyntaxTreeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [arcs, setArcs] = useState<Array<{ x1: number; x2: number; color: string }>>([]);

  // Calculate arc positions after render
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Wait for layout
    requestAnimationFrame(() => {
      const children = Array.from(container.children) as HTMLElement[];
      const newArcs: typeof arcs = [];

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
        const containerRect = container.getBoundingClientRect();

        newArcs.push({
          x1: parentRect.left + parentRect.width / 2 - containerRect.left,
          x2: childRect.left + childRect.width / 2 - containerRect.left,
          color: ROLE_COLORS[node.role] || "#6b7280",
        });
      }

      setArcs(newArcs);
    });
  }, [nodes]);

  return (
    <div className="relative">
      {/* SVG arcs overlay */}
      {arcs.length > 0 && (
        <svg className="pointer-events-none absolute left-0 top-0 h-8 w-full" style={{ overflow: "visible" }}>
          {arcs.map((arc, i) => {
            const midX = (arc.x1 + arc.x2) / 2;
            const height = Math.abs(arc.x2 - arc.x1) * 0.3 + 12;
            return (
              <path
                key={i}
                d={`M ${arc.x1} 0 Q ${midX} ${-height} ${arc.x2} 0`}
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
        ref={containerRef}
        className="flex flex-wrap-reverse justify-end gap-1 overflow-x-auto pt-10 pb-2 scrollbar-none"
        dir="rtl"
      >
        {nodes.map((node) => (
          <SyntaxNodeComponent key={node.p} node={node} />
        ))}
      </div>
    </div>
  );
});
