import type { CSSProperties, FormEventHandler } from "react";
import { memo, useCallback } from "react";

type CanvasTextProps = {
	content: string;
	className?: string;
	style?: CSSProperties;
	isEditing: boolean;
	onInputText: (text: string) => void;
	onFocus?: () => void;
	onBlur?: () => void;
	elementId: string;
};

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

export type CanvasSlide = {
	id: string;
	elements: TextElement[];
};

const shallowEqual = (
	a?: Record<string, unknown>,
	b?: Record<string, unknown>,
) => {
	if (a === b) return true;
	if (!a || !b) return false;
	const aKeys = Object.keys(a);
	const bKeys = Object.keys(b);
	if (aKeys.length !== bKeys.length) return false;
	for (const k of aKeys) {
		if ((a as Record<string, unknown>)[k] !== (b as Record<string, unknown>)[k])
			return false;
	}
	return true;
};

export const CanvasText = memo(
	function CanvasText({
		content,
		className,
		style,
		isEditing: _isEditing,
		onInputText,
		onFocus,
		onBlur,
		elementId,
	}: CanvasTextProps) {
		const handleInput = useCallback<FormEventHandler<HTMLDivElement>>(
			(e) => {
				const text = e.currentTarget.textContent ?? "";
				onInputText(text);
			},
			[onInputText],
		);

		return (
			<div
				contentEditable
				suppressContentEditableWarning
				data-canvas-text="true"
				data-element-id={elementId}
				className={className}
				style={style}
				onInput={handleInput}
				onFocus={onFocus}
				onBlur={onBlur}
			>
				{content}
			</div>
		);
	},
	(prev, next) => {
		if (next.isEditing) return true;
		return (
			prev.content === next.content &&
			prev.className === next.className &&
			shallowEqual(
				prev.style as Record<string, unknown>,
				next.style as Record<string, unknown>,
			) &&
			prev.isEditing === next.isEditing
		);
	},
);
