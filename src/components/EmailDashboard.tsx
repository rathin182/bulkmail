"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, StopCircle, RefreshCw, CheckCircle, XCircle, Loader2, Plus, Trash2, CheckSquare, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface EmailDashboardProps {
    emails: string[];
    senderEmail: string;
    onReset: () => void;
}

type SendingStatus = "pending" | "sending" | "sent" | "failed";

interface EmailStatus {
    email: string;
    status: SendingStatus;
    selected: boolean;
}

export default function EmailDashboard({ emails, senderEmail, onReset }: EmailDashboardProps) {
    const [emailList, setEmailList] = useState<EmailStatus[]>(
        emails.map((email) => ({ email, status: "pending", selected: true }))
    );
    const [isSending, setIsSending] = useState(false);
    const [progress, setProgress] = useState(0);
    const [newEmail, setNewEmail] = useState("");
    const abortControllerRef = useRef<AbortController | null>(null);

    const toggleSelection = (index: number) => {
        if (isSending) return;
        setEmailList((prev) => {
            const newList = [...prev];
            newList[index] = { ...newList[index], selected: !newList[index].selected };
            return newList;
        });
    };

    const toggleAll = () => {
        if (isSending) return;
        const allSelected = emailList.every(e => e.selected);
        setEmailList(prev => prev.map(e => ({ ...e, selected: !allSelected })));
    };

    const addEmail = () => {
        if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
            toast.error("Please enter a valid email address.");
            return;
        }
        if (emailList.some(e => e.email === newEmail)) {
            toast.error("Email already exists in the list.");
            return;
        }
        setEmailList(prev => [...prev, { email: newEmail, status: "pending", selected: true }]);
        setNewEmail("");
    };

    const removeEmail = (index: number) => {
        if (isSending) return;
        setEmailList(prev => prev.filter((_, i) => i !== index));
    };

    const startSending = async () => {
        setIsSending(true);
        abortControllerRef.current = new AbortController();

        const emailsToSend = emailList.filter(e => e.selected && e.status !== "sent");
        const totalSelected = emailList.filter(e => e.selected).length;
        let completed = emailList.filter(e => e.selected && e.status === "sent").length; // Count already sent ones

        // We iterate through the main list to find selected & pending items
        for (let i = 0; i < emailList.length; i++) {
            if (abortControllerRef.current.signal.aborted) {
                break;
            }

            const currentEmail = emailList[i];

            // Skip if not selected or already sent
            if (!currentEmail.selected || currentEmail.status === "sent") {
                continue;
            }

            // Update status to sending
            setEmailList((prev) => {
                const newList = [...prev];
                newList[i].status = "sending";
                return newList;
            });

            try {
                const response = await fetch("/api/send", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        to: currentEmail.email,
                        from: senderEmail,
                        subject: "Bulk Email Test",
                        text: `Hello, this is a test email from ${senderEmail}.`,
                    }),
                    signal: abortControllerRef.current.signal,
                });

                if (response.ok) {
                    toast.success("Email sent to " + currentEmail.email);
                    setEmailList((prev) => {
                        const newList = [...prev];
                        newList[i].status = "sent";
                        return newList;
                    });
                } else {
                    toast.error("sending failed for " + currentEmail.email);
                    setEmailList((prev) => {
                        const newList = [...prev];
                        newList[i].status = "failed";
                        return newList;
                    });
                }
            } catch (error) {
                if ((error as Error).name !== 'AbortError') {
                    toast.error("sending failed for " + currentEmail.email);
                    setEmailList((prev) => {
                        const newList = [...prev];
                        newList[i].status = "failed";
                        return newList;
                    });
                }
            }

            completed++;
            setProgress((completed / totalSelected) * 100);
        }
        setIsSending(false);
        toast.info("Sending process completed.");
    };

    const stopSending = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        setIsSending(false);
    };

    const selectedCount = emailList.filter(e => e.selected).length;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-4xl mx-auto space-y-6"
        >
            <div className="flex flex-col md:flex-row items-center justify-between p-4 bg-neutral-900/50 border border-neutral-800 rounded-xl gap-4">
                <div className="space-y-1 w-full md:w-auto">
                    <h2 className="text-xl font-bold text-white">Email Dashboard</h2>
                    <p className="text-sm text-neutral-400">
                        Selected: <span className="text-white font-mono">{selectedCount}</span> / {emailList.length} |
                        Sender: <span className="text-blue-400">{senderEmail}</span>
                    </p>
                </div>

                <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end">
                    {!isSending ? (
                        <button
                            onClick={startSending}
                            disabled={selectedCount === 0}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-white rounded-lg transition-colors"
                        >
                            <Send className="w-4 h-4" />
                            Send {selectedCount}
                        </button>
                    ) : (
                        <button
                            onClick={stopSending}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors"
                        >
                            <StopCircle className="w-4 h-4" />
                            Stop
                        </button>
                    )}
                    <button
                        onClick={onReset}
                        disabled={isSending}
                        className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Reset
                    </button>
                </div>
            </div>

            {/* Manual Add Input */}
            <div className="flex gap-2">
                <input
                    type="email"
                    placeholder="Add manual email..."
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="flex-1 bg-neutral-900/50 border border-neutral-800 rounded-lg px-4 py-2 text-white placeholder:text-neutral-500 focus:outline-none focus:border-blue-500 transition-colors"
                    onKeyDown={(e) => e.key === 'Enter' && addEmail()}
                />
                <button
                    onClick={addEmail}
                    className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Add
                </button>
            </div>

            {/* Progress Bar */}
            {isSending && (
                <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-blue-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ type: "tween", ease: "easeInOut" }}
                    />
                </div>
            )}

            <div className="bg-neutral-950 border border-neutral-800 rounded-xl overflow-hidden max-h-[500px] overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-[40px_1fr_100px_40px] gap-4 p-4 border-b border-neutral-800 bg-neutral-900/80 sticky top-0 z-10 font-medium text-neutral-300">
                    <div className="flex items-center justify-center cursor-pointer" onClick={toggleAll}>
                        {emailList.every(e => e.selected) && emailList.length > 0 ? <CheckSquare className="w-5 h-5 text-blue-500" /> : <Square className="w-5 h-5 text-neutral-500" />}
                    </div>
                    <div>Email Address</div>
                    <div className="text-center">Status</div>
                    <div className="text-center">Action</div>
                </div>
                <div className="divide-y divide-neutral-800">
                    <AnimatePresence initial={false}>
                        {emailList.map((item, index) => (
                            <motion.div
                                key={`${item.email}-${index}`}
                                layout
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className={cn(
                                    "grid grid-cols-[40px_1fr_100px_40px] gap-4 p-3 items-center text-sm transition-colors hover:bg-neutral-900/30",
                                    item.selected ? "opacity-100" : "opacity-50 grayscale",
                                    item.status === "sending" && "bg-blue-500/10"
                                )}
                            >
                                <div className="flex items-center justify-center cursor-pointer" onClick={() => toggleSelection(index)}>
                                    {item.selected ? <CheckSquare className="w-5 h-5 text-blue-500" /> : <Square className="w-5 h-5 text-neutral-600" />}
                                </div>
                                <div className="truncate text-neutral-300 font-mono">{item.email}</div>
                                <div className="flex justify-center">
                                    {item.status === "pending" && <span className="text-neutral-500 text-xs">Pending</span>}
                                    {item.status === "sending" && <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />}
                                    {item.status === "sent" && <CheckCircle className="w-4 h-4 text-green-500" />}
                                    {item.status === "failed" && <XCircle className="w-4 h-4 text-red-500" />}
                                </div>
                                <div className="flex justify-center">
                                    <button
                                        onClick={() => removeEmail(index)}
                                        className="text-neutral-600 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    {emailList.length === 0 && (
                        <div className="p-8 text-center text-neutral-500">
                            No emails in list. Add one manually or upload a file.
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
