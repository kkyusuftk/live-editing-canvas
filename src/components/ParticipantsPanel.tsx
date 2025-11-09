import { useOthers, useSelf, useUpdateMyPresence } from "@liveblocks/react/suspense";
import { getUserDisplayName, generateUserColor } from "../lib/liveblocks";
import { useAuthStore } from "../store/auth";
import { useEffect } from "react";

export function ParticipantsPanel() {
	const others = useOthers();
	const self = useSelf();
	const updateMyPresence = useUpdateMyPresence();
	const { user } = useAuthStore();

	// Set user info in presence when component mounts
	useEffect(() => {
		if (user) {
			const userName = getUserDisplayName(user);
			const userColor = generateUserColor();
			
			updateMyPresence({
				user: {
					name: userName,
					color: userColor,
				},
			});
		}
	}, [user, updateMyPresence]);

	const allParticipants = [
		...(self ? [{
			id: self.connectionId,
			name: self.presence.user?.name || "You",
			color: self.presence.user?.color || "#3b82f6",
			isYou: true,
		}] : []),
		...others.map((other) => ({
			id: other.connectionId,
			name: other.presence.user?.name || "Anonymous",
			color: other.presence.user?.color || "#9ca3af",
			isYou: false,
		})),
	];

	if (allParticipants.length <= 1) {
		return null; // Don't show panel if only one person
	}

	return (
		<div className="fixed top-20 right-4 z-20 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg px-3 py-2 min-w-[160px]">
			<div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
				Active ({allParticipants.length})
			</div>
			<div className="space-y-1">
				{allParticipants.map((participant) => (
					<div key={participant.id} className="flex items-center space-x-2">
						<div
							className="w-3 h-3 rounded-full flex-shrink-0"
							style={{ backgroundColor: participant.color }}
						/>
						<span className="text-sm text-gray-900 dark:text-white truncate">
							{participant.name}
							{participant.isYou && " (you)"}
						</span>
					</div>
				))}
			</div>
		</div>
	);
}

