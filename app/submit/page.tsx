import { SubmitPanel } from "@/components/SubmitPanel";

type SearchParams = Promise<{
  algo_mode?: string;
  hashes?: string;
}>;

export default async function SubmitPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  return (
    <SubmitPanel
      initialAlgoMode={params.algo_mode}
      initialHashes={params.hashes}
    />
  );
}
