import { LiveMap, LiveObject } from "@liveblocks/client";
import type { TextElement, Storage } from "../types/liveblocks";

/**
 * Create initial storage for a new slide room
 */
export function createInitialStorage(): Storage {
	return {
		elements: new LiveMap<string, LiveObject<TextElement>>(),
		metadata: new LiveObject({
			lastModified: Date.now(),
			version: 1,
		}),
	};
}

/**
 * Serialize storage to JSON for Supabase persistence
 */
export function serializeStorage(storage: Storage | any): string {
	const elementsArray: TextElement[] = [];
	
	storage.elements.forEach((liveElement: any) => {
		// Handle both LiveObject instances and plain objects from useStorage
		const element = typeof liveElement.toObject === 'function' 
			? liveElement.toObject() 
			: liveElement;
		elementsArray.push(element);
	});

	// Handle both LiveObject instances and plain objects from useStorage
	const metadata = typeof storage.metadata.toObject === 'function'
		? storage.metadata.toObject()
		: storage.metadata;

	return JSON.stringify({
		elements: elementsArray,
		metadata: metadata,
	});
}

/**
 * Deserialize JSON from Supabase to populate Liveblocks storage
 */
export function deserializeStorage(json: string): {
	elements: Map<string, TextElement>;
	metadata: { lastModified: number; version: number };
} {
	try {
		const parsed = JSON.parse(json);
		const elementsMap = new Map<string, TextElement>();

		if (parsed.elements && Array.isArray(parsed.elements)) {
			for (const element of parsed.elements) {
				elementsMap.set(element.id, element);
			}
		}

		return {
			elements: elementsMap,
			metadata: parsed.metadata || {
				lastModified: Date.now(),
				version: 1,
			},
		};
	} catch (error) {
		console.error("Failed to deserialize storage:", error);
		return {
			elements: new Map(),
			metadata: {
				lastModified: Date.now(),
				version: 1,
			},
		};
	}
}

/**
 * Generate a room ID for a given slide
 */
export function getSlideRoomId(slideId: string): string {
	return `slide-${slideId}`;
}

/**
 * Generate a random color for user presence
 */
export function generateUserColor(): string {
	const colors = [
		"#ef4444", // red
		"#f59e0b", // amber
		"#10b981", // green
		"#3b82f6", // blue
		"#8b5cf6", // purple
		"#ec4899", // pink
		"#06b6d4", // cyan
		"#f97316", // orange
	];
	return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Get user display name from auth store or generate anonymous name
 */
export function getUserDisplayName(user: { email?: string } | null): string {
	if (!user?.email) {
		return `Anonymous ${Math.floor(Math.random() * 1000)}`;
	}
	return user.email.split("@")[0];
}

