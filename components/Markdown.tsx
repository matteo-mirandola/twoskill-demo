import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function Markdown({ children }: { children: string }) {
  return (
    <div
      className="max-w-none text-sm leading-6 text-inherit
      [&_p]:mb-3 [&_p:last-child]:mb-0 [&_strong]:font-semibold
      [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mb-1
      [&_table]:my-3 [&_table]:w-full [&_table]:border-collapse [&_table]:text-xs
      [&_th]:border [&_th]:border-current/20 [&_th]:bg-current/5 [&_th]:px-2 [&_th]:py-1.5 [&_th]:text-left [&_th]:font-semibold
      [&_td]:border [&_td]:border-current/20 [&_td]:px-2 [&_td]:py-1.5"
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  );
}
