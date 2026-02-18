"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Check, Mail, ArrowRight, FileText, Type } from "lucide-react";
import { cn } from "@/lib/utils";
import * as XLSX from "xlsx";

interface EmailUploaderProps {
    emailOne: string;
    emailTwo: string;
    onEmailsExtracted: (emails: string[], sender: string) => void;
}

export default function EmailUploader({ emailOne, emailTwo, onEmailsExtracted }: EmailUploaderProps) {
    const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isParsing, setIsParsing] = useState(false);
    const [mode, setMode] = useState<"file" | "manual">("file");
    const [manualText, setManualText] = useState("");

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            processFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            processFile(e.target.files[0]);
        }
    };

    const processFile = async (file: File) => {
        if (!selectedEmail) {
            alert("Please select a sender email first.");
            return;
        }

        setIsParsing(true);
        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const worksheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[worksheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

            const extractedEmails: string[] = [];
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            jsonData.forEach(row => {
                row.forEach(cell => {
                    if (typeof cell === 'string' && emailRegex.test(cell.trim())) {
                        extractedEmails.push(cell.trim());
                    }
                });
            });

            finishExtraction(extractedEmails);
        } catch (error) {
            console.error("Error parsing file:", error);
            alert("Error parsing file.");
        } finally {
            setIsParsing(false);
        }
    };

    const processManualText = () => {
        if (!selectedEmail) {
            alert("Please select a sender email first.");
            return;
        }

        const emailRegex = /[^\s@]+@[^\s@]+\.[^\s@]+/g;
        const extractedEmails = manualText.match(emailRegex) || [];
        finishExtraction(extractedEmails);
    };

    const finishExtraction = (emails: string[]) => {
        const uniqueEmails = Array.from(new Set(emails));
        if (uniqueEmails.length > 0) {
            onEmailsExtracted(uniqueEmails, selectedEmail!);
        } else {
            alert("No valid emails found.");
        }
    };

    return (
        <div className="w-full max-w-md mx-auto space-y-8">
            <div className="space-y-4">
                <h2 className="text-2xl font-bold text-center text-white/90">
                    Select Sender
                </h2>
                <div className="grid grid-cols-1 gap-4">
                    {[emailOne, emailTwo].map((email) => (
                        <motion.div
                            key={email}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setSelectedEmail(email)}
                            className={cn(
                                "relative group cursor-pointer p-4 rounded-xl border transition-all duration-300 overflow-hidden",
                                selectedEmail === email
                                    ? "bg-blue-600/20 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                                    : "bg-neutral-900/50 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900"
                            )}
                        >
                            <div className="flex items-center justify-between relative z-10">
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "p-2 rounded-lg transition-colors duration-300",
                                        selectedEmail === email ? "bg-blue-500 text-white" : "bg-neutral-800 text-neutral-400 group-hover:text-neutral-200"
                                    )}>
                                        <Mail className="w-5 h-5" />
                                    </div>
                                    <span className={cn(
                                        "font-medium transition-colors duration-300",
                                        selectedEmail === email ? "text-blue-100" : "text-neutral-400 group-hover:text-neutral-200"
                                    )}>
                                        {email}
                                    </span>
                                </div>
                                {selectedEmail === email && (
                                    <motion.div
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className="bg-blue-500 rounded-full p-1"
                                    >
                                        <Check className="w-3 h-3 text-white" />
                                    </motion.div>
                                )}
                            </div>

                            {selectedEmail === email && (
                                <motion.div
                                    layoutId="glow"
                                    className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                />
                            )}
                        </motion.div>
                    ))}
                </div>
            </div>

            <AnimatePresence>
                {selectedEmail && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="space-y-4"
                    >
                        {/* Mode Toggle */}
                        <div className="flex p-1 bg-neutral-900 rounded-lg border border-neutral-800">
                            <button
                                onClick={() => setMode("file")}
                                className={cn(
                                    "flex-1 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2",
                                    mode === "file" ? "bg-neutral-800 text-white shadow" : "text-neutral-500 hover:text-neutral-300"
                                )}
                            >
                                <FileText className="w-4 h-4" />
                                Upload File
                            </button>
                            <button
                                onClick={() => setMode("manual")}
                                className={cn(
                                    "flex-1 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2",
                                    mode === "manual" ? "bg-neutral-800 text-white shadow" : "text-neutral-500 hover:text-neutral-300"
                                )}
                            >
                                <Type className="w-4 h-4" />
                                Manual Input
                            </button>
                        </div>

                        {mode === "file" ? (
                            <label
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                className={cn(
                                    "relative flex flex-col items-center justify-center w-full h-64 rounded-2xl border-2 border-dashed transition-all duration-300 group cursor-pointer overflow-hidden",
                                    isDragging
                                        ? "border-blue-500 bg-blue-500/10"
                                        : "border-neutral-800 bg-neutral-900/30 hover:bg-neutral-900/50 hover:border-neutral-700"
                                )}
                            >
                                <input type="file" className="hidden" accept=".xlsx,.xls,.csv" onChange={handleFileInput} />
                                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-neutral-950/50 pointer-events-none" />

                                <div className="relative z-10 flex flex-col items-center gap-4 text-center p-6">
                                    <div className={cn(
                                        "p-4 rounded-full transition-all duration-300 shadow-lg",
                                        isDragging ? "bg-blue-500 text-white scale-110" : "bg-neutral-800 text-neutral-400 group-hover:text-neutral-200 group-hover:scale-105"
                                    )}>
                                        {isParsing ? <div className="animate-spin w-8 h-8 border-2 border-white/30 border-t-white rounded-full" /> : <Upload className="w-8 h-8" />}
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-lg font-medium text-neutral-200">
                                            {isParsing ? "Parsing file..." : "Upload your Excel file"}
                                        </p>
                                        <p className="text-sm text-neutral-500">
                                            Drag and drop or click to browse
                                        </p>
                                    </div>
                                </div>

                                <div className={cn(
                                    "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none",
                                    "bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)]"
                                )} />
                            </label>
                        ) : (
                            <div className="space-y-4">
                                <textarea
                                    value={manualText}
                                    onChange={(e) => setManualText(e.target.value)}
                                    placeholder="Paste or type emails here (separated by commas, spaces, or newlines)..."
                                    className="w-full h-64 p-4 bg-neutral-900/30 border border-neutral-800 rounded-xl text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-blue-500 focus:bg-neutral-900/50 transition-all resize-none"
                                />
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={processManualText}
                                    disabled={!manualText.trim()}
                                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition-all"
                                >
                                    <span>Extract Emails</span>
                                    <ArrowRight className="w-4 h-4" />
                                </motion.button>
                            </div>
                        )}

                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
