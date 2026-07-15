import AssessmentApp from "@/components/AssessmentApp";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const k = typeof params.k === "string" ? params.k : null;
  const dev = params.dev === "1";

  return <AssessmentApp keyParam={k} devMode={dev} />;
}
