// components/password-modal.tsx
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy } from 'lucide-react';
import { useState } from 'react';

interface PasswordModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    password: string;
    user: {
        name: string;
        email: string;
    };
}

export function PasswordModal({ open, onOpenChange, password, user }: PasswordModalProps) {
    const [copied, setCopied] = useState(false);

    const copyPassword = async () => {
        try {
            await navigator.clipboard.writeText(password);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy password:', err);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Generated Password</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="rounded-lg bg-green-50 p-4">
                        <p className="text-green-800">
                            New password has been generated for {user.name} ({user.email})
                        </p>
                    </div>

                    <div>
                        <Label>Password</Label>
                        <div className="mt-1 flex gap-2">
                            <Input value={password} readOnly className="font-mono" />
                            <Button type="button" variant="outline" onClick={copyPassword} className={copied ? 'text-green-600' : ''}>
                                <Copy className="mr-2 h-4 w-4" />
                                {copied ? 'Copied!' : 'Copy'}
                            </Button>
                        </div>
                    </div>

                    <div className="rounded-lg bg-yellow-50 p-4">
                        <p className="text-yellow-800">Please copy this password now. It won't be shown again.</p>
                    </div>

                    <div className="flex justify-end">
                        <Button onClick={() => onOpenChange(false)}>Close</Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
