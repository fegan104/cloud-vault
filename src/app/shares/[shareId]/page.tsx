import ViewShareScreen from "./ViewShareScreen";
import { TopAppBar } from "@/components/TopAppBar";
import { getShareName } from "@/lib/share/getShareName";

export default async function ViewSharePage({
  params,
}: {
  params: Promise<{ shareId: string }>
}) {
  const { shareId } = await params;
  const shareName = await getShareName(shareId);

  if (!shareName) {
    return <div>Share not found</div>;
  }

  return (
    <>
      <TopAppBar />
      <ViewShareScreen
        shareId={shareId}
        name={shareName}
      />
    </>
  )
}