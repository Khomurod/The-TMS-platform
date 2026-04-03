"use client";

import React, { ReactNode, useEffect, useRef, Fragment, useId } from "react";
import { X } from "lucide-react";
import { Transition, TransitionChild } from "@headlessui/react";

/* ═══════════════════════════════════════════════════════════════
   Modal — Accessible Dialog Component
   ARIA compliant: role="dialog", aria-modal, aria-labelledby
   Focus trapping: Tab/Shift+Tab cycle within modal
   ═══════════════════════════════════════════════════════════════ */

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg";
}

/** Get all focusable elements within a container */
function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const selector = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ');
  return Array.from(container.querySelectorAll<HTMLElement>(selector));
}

export default function Modal({ isOpen, onClose, title, children, size = "md" }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  // Save and restore focus
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      // Focus first focusable element after render
      requestAnimationFrame(() => {
        if (modalRef.current) {
          const focusable = getFocusableElements(modalRef.current);
          if (focusable.length > 0) {
            focusable[0].focus();
          }
        }
      });
    } else if (previousFocusRef.current) {
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }
  }, [isOpen]);

  // Close on Escape + Focus trapping
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }

      // Focus trap
      if (e.key === "Tab" && modalRef.current) {
        const focusable = getFocusableElements(modalRef.current);
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    if (isOpen) window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const widthClass = size === "sm" ? "max-w-md" : size === "lg" ? "max-w-3xl" : "max-w-xl";

  return (
    <Transition show={isOpen} as={Fragment}>
      <div className="fixed inset-0 z-50">
        {/* Overlay */}
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div
            className="modal-overlay"
            onClick={onClose}
          />
        </TransitionChild>

        {/* Content */}
        <div className="modal-container">
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <div
              ref={modalRef}
              className={`${widthClass} w-full mx-4 modal-content`}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
            >
              {/* Header */}
              <div className="modal-header">
                <h2 id={titleId} className="modal-title">{title}</h2>
                <button
                  onClick={onClose}
                  className="topbar-icon-btn focus-ring"
                  aria-label="Close modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {/* Body */}
              <div className="modal-body">
                {children}
              </div>
            </div>
          </TransitionChild>
        </div>
      </div>
    </Transition>
  );
}
