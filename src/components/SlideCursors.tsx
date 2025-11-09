import { useOthers } from "@liveblocks/react";
import type { Presence } from "../types/liveblocks";

export function SlideCursors({ slideId }: { slideId: string }) {
	const others = useOthers();

	const colors = [
		"#ef4444",
		"#f59e0b",
		"#10b981",
		"#3b82f6",
		"#8b5cf6",
		"#ec4899",
	];

	return (
		<>
			{others
				.map((o) => {
					const presence = o.presence as Presence;
					return {
						id: o.connectionId,
						cursor: presence?.cursor,
						sId: presence?.slideId,
						userName: presence?.user?.name || "Anonymous",
					};
				})
				.filter(o =>
					o.cursor !== null && o.sId === slideId
				)
				.map((o) => {
					const color = colors[o.id % colors.length];
					return (
						<div
							key={o.id}
							className="pointer-events-none absolute"
							style={{
								left: `${o.cursor?.xPercent}%`,
								top: `${o.cursor?.yPercent}%`,
								transform: "translate(-50%, -50%)",
							}}
						>
							<div className="flex flex-col items-start">
								<svg
									className="w-4 h-4 drop-shadow"
									viewBox="0 0 24 24"
									fill={color}
								>
									<path d="M3 2l7 18 2-7 7-2L3 2z" />
								</svg>
								<div
									className="mt-1 px-2 py-1 rounded text-xs font-medium text-white shadow-lg"
									style={{ backgroundColor: color }}
								>
									{o.userName}
								</div>
							</div>
						</div>
					);
				})}
		</>
	);
}
