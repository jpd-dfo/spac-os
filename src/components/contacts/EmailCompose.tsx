'use client';

import { useState } from 'react';
import { Send, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

import { Button } from '@/components/ui/Button';
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from '@/components/ui/Modal';
import { trpc } from '@/lib/trpc';

interface EmailComposeProps {
  isOpen: boolean;
  onClose: () => void;
  replyTo?: {
    threadId: string;
    subject: string;
    to: string;
  };
  defaultTo?: string;
}

export function EmailCompose({ isOpen, onClose, replyTo, defaultTo }: EmailComposeProps) {
  const [to, setTo] = useState(replyTo?.to || defaultTo || '');
  const [cc, setCc] = useState('');
  const [subject, setSubject] = useState(replyTo ? `Re: ${replyTo.subject}` : '');
  const [body, setBody] = useState('');

  const utils = trpc.useUtils();

  const sendMutation = trpc.email.send.useMutation({
    onSuccess: () => {
      toast.success('Email sent');
      utils.email.list.invalidate();
      handleClose();
    },
    onError: () => toast.error('Failed to send email'),
  });

  const replyMutation = trpc.email.reply.useMutation({
    onSuccess: () => {
      toast.success('Reply sent');
      utils.email.list.invalidate();
      utils.email.getThread.invalidate();
      handleClose();
    },
    onError: () => toast.error('Failed to send reply'),
  });

  const handleClose = () => {
    setTo(defaultTo || '');
    setCc('');
    setSubject('');
    setBody('');
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!to.trim()) {
      toast.error('Please enter a recipient');
      return;
    }

    if (!replyTo && !subject.trim()) {
      toast.error('Please enter a subject');
      return;
    }

    if (!body.trim()) {
      toast.error('Please enter a message');
      return;
    }

    if (replyTo) {
      replyMutation.mutate({
        threadId: replyTo.threadId,
        body: body.trim(),
      });
    } else {
      sendMutation.mutate({
        to: to.split(',').map((e) => e.trim()),
        cc: cc ? cc.split(',').map((e) => e.trim()) : undefined,
        subject: subject.trim(),
        body: body.trim(),
      });
    }
  };

  const isLoading = sendMutation.isPending || replyMutation.isPending;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <form onSubmit={handleSubmit}>
        <ModalHeader>
          <ModalTitle>{replyTo ? 'Reply' : 'New Email'}</ModalTitle>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <div>
              <label htmlFor="email-to" className="block text-sm font-medium text-slate-700 mb-1">
                To <span className="text-red-500">*</span>
              </label>
              <input
                id="email-to"
                type="text"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="input w-full"
                placeholder="email@example.com"
                disabled={!!replyTo}
              />
              <p className="text-xs text-slate-500 mt-1">Separate multiple emails with commas</p>
            </div>

            {!replyTo && (
              <div>
                <label htmlFor="email-cc" className="block text-sm font-medium text-slate-700 mb-1">
                  CC
                </label>
                <input
                  id="email-cc"
                  type="text"
                  value={cc}
                  onChange={(e) => setCc(e.target.value)}
                  className="input w-full"
                  placeholder="cc@example.com"
                />
              </div>
            )}

            <div>
              <label htmlFor="email-subject" className="block text-sm font-medium text-slate-700 mb-1">
                Subject {!replyTo && <span className="text-red-500">*</span>}
              </label>
              <input
                id="email-subject"
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="input w-full"
                placeholder="Email subject"
                disabled={!!replyTo}
              />
            </div>

            <div>
              <label htmlFor="email-body" className="block text-sm font-medium text-slate-700 mb-1">
                Message <span className="text-red-500">*</span>
              </label>
              <textarea
                id="email-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="input w-full"
                rows={10}
                placeholder="Write your message..."
              />
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button type="button" variant="secondary" onClick={handleClose}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send
              </>
            )}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

export default EmailCompose;
