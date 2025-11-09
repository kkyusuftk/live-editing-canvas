import { useMyPresence } from "@liveblocks/react";
import type React from "react";
import { useEffect } from "react";

export function PresenceMouseTracker({
	activeSlideId,
	slideContainerRefs,
}: {
	activeSlideId: string | null;
	slideContainerRefs: React.MutableRefObject<
		Record<string, HTMLDivElement | null>
	>;
}) {
	const [, updateMyPresence] = useMyPresence();

	useEffect(() => {
		updateMyPresence({ slideId: activeSlideId || null });
	}, [activeSlideId, updateMyPresence]);

	useEffect(() => {
		if (!activeSlideId) return;
		const el = slideContainerRefs.current[activeSlideId];
		if (!el) return;

		let raf = 0;
		const onMove = (e: MouseEvent) => {
			const rect = el.getBoundingClientRect();
			const x = ((e.clientX - rect.left) / rect.width) * 100;
			const y = ((e.clientY - rect.top) / rect.height) * 100;
			const xPercent = Math.max(0, Math.min(100, x));
			const yPercent = Math.max(0, Math.min(100, y));
			if (raf) cancelAnimationFrame(raf);
			raf = requestAnimationFrame(() => {
				updateMyPresence({
					cursor: { xPercent, yPercent },
					slideId: activeSlideId,
				});
			});
		};
		const onLeave = () => updateMyPresence({ cursor: null });

		el.addEventListener("mousemove", onMove);
		el.addEventListener("mouseleave", onLeave);
		return () => {
			if (raf) cancelAnimationFrame(raf);
			el.removeEventListener("mousemove", onMove);
			el.removeEventListener("mouseleave", onLeave);
		};
	}, [activeSlideId, slideContainerRefs, updateMyPresence]);

	return null;
}
