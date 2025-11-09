import { useStorage } from "@liveblocks/react/suspense";
import { useEffect, useRef } from "react";
import { updateSlideStorage } from "../lib/api/decksApi";
import { serializeStorage } from "../lib/liveblocks";

/**
 * Hook to automatically persist Liveblocks storage to Supabase
 * Debounces saves to avoid excessive API calls
 */
export function useSlideStoragePersistence(slideId: string) {
	const saveTimerRef = useRef<number | null>(null);
	const lastSavedRef = useRef<string | null>(null);

	// Subscribe to storage changes
	const storage = useStorage((root) => root);

	useEffect(() => {
		if (!storage) return;

		// Debounced save function
		const scheduleSave = () => {
			if (saveTimerRef.current) {
				window.clearTimeout(saveTimerRef.current);
			}

			saveTimerRef.current = window.setTimeout(async () => {
				try {
					const serialized = serializeStorage(storage);

					// Only save if content actually changed
					if (serialized === lastSavedRef.current) {
						return;
					}

					await updateSlideStorage(slideId, serialized);
					lastSavedRef.current = serialized;
				} catch (error) {
					console.error("Failed to save slide storage:", error);
				}
			}, 2000); // Save after 2 seconds of inactivity
		};

		// Trigger save on storage changes
		scheduleSave();

		return () => {
			if (saveTimerRef.current) {
				window.clearTimeout(saveTimerRef.current);
			}
		};
	}, [storage, slideId]);

	// Save on unmount (page navigation)
	useEffect(() => {
		return () => {
			if (!storage) return;

			// Flush final save on unmount
			(async () => {
				try {
					const serialized = serializeStorage(storage);
					if (serialized !== lastSavedRef.current) {
						await updateSlideStorage(slideId, serialized);
					}
				} catch (error) {
					console.error("Failed to save on unmount:", error);
				}
			})();
		};
	}, [storage, slideId]);
}
