import { LiveList, LiveMap, LiveObject } from "@liveblocks/client";

/**
 * Text element on a slide canvas
 */
export type TextElement = {
	id: string;
	type: "text";
	content: string;
	xPercent: number;
	yPercent: number;
	fontSize?: number;
	isBold?: boolean;
	isItalic?: boolean;
};

/**
 * Liveblocks Storage schema for a single slide
 * Each slide room stores its elements as a LiveMap
 */
export type Storage = {
	/**
	 * Map of element ID -> element data
	 * Using LiveMap for CRDT conflict-free updates
	 */
	elements: LiveMap<string, LiveObject<TextElement>>;
	/**
	 * Metadata about the slide
	 */
	metadata: LiveObject<{
		lastModified: number;
		version: number;
	}>;
};

/**
 * User presence data
 * Tracks cursor position, active slide, selection, and user info
 */
export type Presence = {
	cursor: {
		xPercent: number;
		yPercent: number;
	} | null;
	slideId: string | null;
	selection: {
		elementId: string;
		color: string;
	} | null;
	user: {
		name: string;
		avatar?: string;
		color: string;
	} | null;
};

/**
 * User metadata (not used in public key mode, but kept for future auth endpoint)
 */
export type UserMeta = {
	id: string;
	info: {
		name: string;
		avatar?: string;
		color: string;
	};
};

/**
 * Room event types (for future use with broadcasting)
 */
export type RoomEvent = {
	type: "ELEMENT_SELECTED";
	elementId: string;
	userId: string;
};

/**
 * Thread metadata (for future commenting features)
 */
export type ThreadMetadata = {
	elementId?: string;
	resolved?: boolean;
};

// Declare Liveblocks types for React hooks
declare global {
	interface Liveblocks {
		Storage: Storage;
		Presence: Presence;
		UserMeta: UserMeta;
		RoomEvent: RoomEvent;
		ThreadMetadata: ThreadMetadata;
	}
}

