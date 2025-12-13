import ViewShareScreen from "./ViewShareScreen";
import { VaultAppBar } from "@/components/VaultAppBar";
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
      <VaultAppBar showSignOut={false} />
      <ViewShareScreen
        shareId={shareId}
        name={shareName}
      />
    </>
  )
}