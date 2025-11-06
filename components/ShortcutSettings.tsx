import React, { useEffect, useState, useRef } from "react";
import { useShortcuts } from "../hooks/useShortcuts";
import { defaultShortcuts } from "../constants";

export default function ShortcutSettings() {
  const { shortcuts, saveShortcuts, resetShortcuts } = useShortcuts();
  const [editing, setEditing] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!editing) return;
      
      e.preventDefault();
      e.stopPropagation();

      const key = e.key === ' ' ? 'Space' : e.key;
      
      const combo = [
        e.ctrlKey && "Ctrl",
        e.altKey && "Alt",
        e.shiftKey && "Shift",
        !['Control', 'Alt', 'Shift'].includes(key) && key
      ].filter(Boolean).join("+");

      // Find if this combo is already assigned
      const existingAction = Object.keys(shortcuts).find(action => 
        shortcuts[action as keyof typeof shortcuts].includes(combo)
      );

      if (existingAction && existingAction !== editing) {
          if (!window.confirm(`This key combination is already assigned to "${existingAction.replace(/([A-Z])/g, " $1")}". Do you want to reassign it?`)) {
              setEditing(null);
              return;
          }
      }

      const updated = { ...shortcuts, [editing]: [combo] };
      saveShortcuts(updated);
      setEditing(null);
    };

    if (editing) {
      window.addEventListener("keydown", handleKeyDown, { capture: true });
    }
    
    return () => window.removeEventListener("keydown", handleKeyDown, { capture: true });
  }, [editing, shortcuts, saveShortcuts]);

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(shortcuts, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "anistream_shortcuts.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        // Basic validation
        if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
            // Merge with defaults to ensure all actions are present
            const newShortcuts = { ...defaultShortcuts, ...data };
            saveShortcuts(newShortcuts);
        } else {
            throw new Error("Invalid format");
        }
      } catch {
        alert("Invalid or malformed JSON file.");
      }
    };
    reader.readAsText(file);
    // Reset file input to allow importing the same file again
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-[rgb(var(--text-muted))]">
        Click any shortcut to remap it. Your changes are saved automatically.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {Object.entries(shortcuts).map(([action, keys]) => (
          <div
            key={action}
            className="flex justify-between items-center bg-[rgb(var(--surface-3))/60] p-3 rounded-lg hover:bg-[rgb(var(--surface-3))] transition"
          >
            <span className="capitalize text-sm font-medium text-[rgb(var(--text-secondary))]">{action.replace(/([A-Z])/g, " $1")}</span>
            <button
              onClick={() => setEditing(action)}
              className={`px-3 py-1 text-xs rounded border min-w-[80px] text-center font-mono ${
                editing === action
                  ? "border-[rgb(var(--color-primary-accent))] text-[rgb(var(--color-primary-accent))] animate-pulse"
                  : "border-[rgb(var(--border-color))] text-[rgb(var(--text-primary))]"
              }`}
            >
              {/* FIX: Cast `keys` to string[] to resolve `join` method error. */}
              {editing === action ? "Press key..." : (keys as string[]).join(" / ")}
            </button>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 pt-4 border-t border-white/10">
        <button
          onClick={resetShortcuts}
          className="bg-red-500/10 hover:bg-red-500/20 px-4 py-2 rounded-lg text-red-300 text-sm font-semibold"
        >
          Reset Defaults
        </button>

        <button
          onClick={handleExport}
          className="bg-blue-500/10 hover:bg-blue-500/20 px-4 py-2 rounded-lg text-blue-300 text-sm font-semibold"
        >
          Export
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="bg-green-500/10 hover:bg-green-500/20 px-4 py-2 rounded-lg text-green-300 text-sm font-semibold"
        >
          Import
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImport}
          className="hidden"
        />
      </div>
    </div>
  );
}