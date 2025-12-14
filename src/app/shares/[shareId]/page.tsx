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
      <div className="flex flex-col w-full pt-1.5 md:pt-0">
        <TopAppBar />
      </div>
      <ViewShareScreen
        shareId={shareId}
        name={shareName}
      />
    </>
  )
}