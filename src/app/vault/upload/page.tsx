import { getUser } from "../../../lib/getUser";
import { UploadScreenContent } from "./UploadScreenContent";
import { uploadAction } from "./uploadAction";
import { redirect } from "next/navigation";

export default async function UploadPage() {
  const user = await getUser();
  if (!user) {
    return redirect("/signin");
  }

  return (
    <div>
      <UploadScreenContent masterKeySalt={user.masterKeySalt} onEncrypted={uploadAction} />
    </div>
  );
}