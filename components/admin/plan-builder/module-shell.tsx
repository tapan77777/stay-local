import Link from "next/link";
import type {
  DestinationModuleCounts,
  ModuleKey,
} from "@/lib/plan/types";
import { MODULE_KEYS, MODULE_LABEL } from "@/lib/plan/types";

interface Props {
  planId: string;
  destinationId: string;
  active: ModuleKey;
  counts: DestinationModuleCounts;
  children: React.ReactNode;
}

export function ModuleShell({
  planId,
  destinationId,
  active,
  counts,
  children,
}: Props) {
  return (
    <div className="space-y-5">
      <nav className="flex flex-wrap gap-2">
        {(MODULE_KEYS as readonly ModuleKey[]).map((k) => {
          const n = counts[k];
          const isActive = k === active;
          return (
            <Link
              key={k}
              href={`/admin/plans/${planId}/destinations/${destinationId}/${k}`}
              className={
                isActive
                  ? "rounded-full bg-charcoal px-3 py-1.5 text-xs text-white"
                  : "rounded-full border border-border bg-white px-3 py-1.5 text-xs text-charcoal hover:bg-charcoal/[0.04]"
              }
            >
              {MODULE_LABEL[k]}
              {n > 0 ? (
                <span className="ml-1.5 opacity-70">· {n}</span>
              ) : null}
            </Link>
          );
        })}
      </nav>
      {children}
    </div>
  );
}
