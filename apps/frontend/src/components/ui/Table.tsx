import type {
  HTMLAttributes,
  ReactNode,
  TdHTMLAttributes,
  ThHTMLAttributes,
} from "react";
import { cn } from "@/lib/cn";

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-max border-collapse">{children}</table>
    </div>
  );
}

export function Thead({ children }: { children: ReactNode }) {
  return <thead>{children}</thead>;
}

export function Tbody({ children }: { children: ReactNode }) {
  return <tbody>{children}</tbody>;
}

export function Tr({
  children,
  clickable = false,
  className,
  ...props
}: HTMLAttributes<HTMLTableRowElement> & {
  children: ReactNode;
  clickable?: boolean;
}) {
  return (
    <tr
      className={cn(
        "border-b border-[#e8ebf0] last:border-b-0",
        clickable && "cursor-pointer hover:bg-[#fafbfc]",
        className
      )}
      {...props}
    >
      {children}
    </tr>
  );
}

export function Th({
  children,
  ...props
}: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className="bg-[#fbfcfd] px-3.5 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-muted"
      {...props}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  ...props
}: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className="px-3.5 py-2.5 text-xs" {...props}>
      {children}
    </td>
  );
}
