import { Editor } from "@/components/Editor";
import { EditorProvider } from "@/context/EditorContext";

export default function Home() {
  return (
    <EditorProvider>
      <Editor />
    </EditorProvider>
  );
}
