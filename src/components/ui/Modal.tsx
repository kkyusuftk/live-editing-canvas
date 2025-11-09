import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "./Button";

interface ModalProps {
	isOpen: boolean;
	children: React.ReactNode;
	onClose: () => void;
	onConfirm: () => void;
	onModalClose: () => void;
}

export const Modal = ({
	isOpen,
	children,
	onClose,
	onConfirm,
	onModalClose,
}: ModalProps) => {
	return (
		<Dialog.Root open={isOpen} onOpenChange={onModalClose}>
			<Dialog.Portal>
				<Dialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 z-50" />
				<Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg p-6 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
					<div className="space-y-4">
						{children}
						<div className="flex justify-end gap-2 pt-4">
							<Button variant="secondary" onClick={onClose}>
								Cancel
							</Button>
							<Button onClick={onConfirm}>Confirm</Button>
						</div>
					</div>
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>
	);
};
