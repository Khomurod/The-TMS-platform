"use client";

import React, { ReactNode, useEffect, Fragment } from "react";
import { X } from "lucide-react";
import { Transition } from "@headlessui/react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg";
}

export default function Modal({ isOpen, onClose, title, children, size = "md" }: ModalProps) {
  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (isOpen) window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  const widthClass = size === "sm" ? "max-w-md" : size === "lg" ? "max-w-3xl" : "max-w-xl";

  return (
    <Transition show={isOpen} as={Fragment}>
      <div className="fixed inset-0 z-50">
        {/* Overlay */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
        </Transition.Child>

        {/* Content */}
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <div className={`${widthClass} w-full mx-4 bg-[var(--surface-lowest)] rounded-xl shadow-2xl border border-[var(--outline-variant)] pointer-events-auto`}>
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--surface-container)]">
                <h2 className="text-lg font-bold text-[var(--on-surface)]">{title}</h2>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--on-surface-variant)] hover:text-[var(--on-surface)] hover:bg-[var(--surface-container)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
                  aria-label="Close modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {/* Body */}
              <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
                {children}
              </div>
            </div>
          </Transition.Child>
        </div>
      </div>
    </Transition>
  );
}

/* Reusable Form Field Component */

interface FormFieldProps {
  label: string;
  required?: boolean;
  children: ReactNode;
}

export function FormField({ label, required, children }: FormFieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-[var(--on-surface-variant)] uppercase tracking-wider">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
    </div>
  );
}

/* ── Legacy utility class exports ────────────────────────────────
   These are still imported by fleet/page.tsx and drivers/page.tsx.
   TODO: Migrate those pages to use <Input /> and <Button /> components,
   then delete these exports.
   ───────────────────────────────────────────────────────────────── */
export const inputClass = "w-full px-3.5 py-2.5 border border-[var(--outline-variant)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-[var(--surface-lowest)] text-[var(--on-surface)] placeholder:text-[var(--on-surface-variant)] shadow-sm hover:border-[var(--outline)] disabled:opacity-50 disabled:cursor-not-allowed";
export const selectClass = "w-full px-3.5 py-2.5 border border-[var(--outline-variant)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-[var(--surface-lowest)] text-[var(--on-surface)]";
export const btnPrimary = "bg-gradient-to-r from-[var(--primary)] to-[var(--primary-container)] text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:brightness-110 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-blue-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40";
export const btnSecondary = "bg-[var(--surface-lowest)] text-[var(--on-surface)] border border-[var(--outline-variant)] px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[var(--surface-container)] hover:border-[var(--outline)] transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40";
