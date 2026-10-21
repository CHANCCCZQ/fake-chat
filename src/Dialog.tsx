import { useRef, type ReactNode } from 'react';
import { Dialog as DialogRoot, DialogContent, DialogTitle } from './components/ui/dialog';

export default function Dialog({
  title,
  children,
  onClose,
  className = '',
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  className?: string;
}) {
  const opener = useRef(
    document.activeElement instanceof HTMLElement ? document.activeElement : null,
  );
  return (
    <DialogRoot
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        className={`dialog ${className}`}
        aria-describedby={undefined}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          if (opener.current?.isConnected) opener.current.focus({ preventScroll: true });
        }}
      >
        <header className="dialog-header">
          <DialogTitle>{title}</DialogTitle>
        </header>
        {children}
      </DialogContent>
    </DialogRoot>
  );
}
