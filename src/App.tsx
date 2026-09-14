import { CheckCircle2 } from "lucide-react";
import CanvasActions from "./components/canvas/CanvasActions";
import MapActions from "./components/canvas/MapActions";
import MapViewport from "./components/canvas/MapViewport";
import EditorDialog from "./components/dialogs/EditorDialog";
import SelectionInspector from "./components/inspector/SelectionInspector";
import EditorHeader from "./components/layout/EditorHeader";
import StatusBar from "./components/layout/StatusBar";
import ViewSwitcher from "./components/layout/ViewSwitcher";
import MapSidebar from "./components/sidebar/MapSidebar";
import { useEditorController } from "./hooks/useEditorController";
export default function App() {
  const editor = useEditorController();
  return (
    <div className="app">
      <EditorHeader {...editor} />
      <div className="workspace">
        <MapSidebar {...editor} />
        <main>
          <ViewSwitcher {...editor} />
          <MapViewport
            {...editor}
            captionActions={
              <MapActions
                key={`${editor.map.id}-${editor.readonly}`}
                {...editor}
              />
            }
          >
            <CanvasActions
              key={`${editor.map.id}-${editor.three}-${editor.playing}`}
              {...editor}
            />
            {(editor.node || editor.edge) && <SelectionInspector {...editor} />}
          </MapViewport>
          <StatusBar {...editor} />
        </main>
      </div>
      <input
        hidden
        type="file"
        accept=".json,application/json"
        ref={editor.importer}
        onChange={editor.importFile}
      />
      {editor.toast && (
        <div role="status" className="toast">
          <CheckCircle2 size={17} />
          {editor.toast}
        </div>
      )}
      {editor.modal && <EditorDialog {...editor} />}
    </div>
  );
}
