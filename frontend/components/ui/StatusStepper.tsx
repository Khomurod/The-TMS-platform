"use client";

import React from "react";
import { Check } from "lucide-react";

interface StatusStepperProps {
  stages: Array<{ key: string; label: string }>;
  currentStage: string;
}

export default function StatusStepper({ stages, currentStage }: StatusStepperProps) {
  const currentIdx = stages.findIndex((s) => s.key === currentStage);

  return (
    <div className="stepper">
      {stages.map((stage, i) => {
        const isCompleted = i < currentIdx;
        const isCurrent   = i === currentIdx;

        return (
          <React.Fragment key={stage.key}>
            <div className="stepper-step">
              <div className={`stepper-circle${isCompleted ? " stepper-circle--completed" : isCurrent ? " stepper-circle--current" : " stepper-circle--future"}`}>
                {isCompleted ? <Check className="h-3.5 w-3.5" /> : <span>{i + 1}</span>}
              </div>
              <span className={`stepper-label${isCompleted ? " stepper-label--completed" : isCurrent ? " stepper-label--current" : " stepper-label--future"}`}>
                {stage.label}
              </span>
            </div>
            {i < stages.length - 1 && (
              <div className={`stepper-line${isCompleted ? " stepper-line--completed" : " stepper-line--future"}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export const LOAD_STAGES = [
  { key: "offer",       label: "Offer"       },
  { key: "booked",      label: "Booked"      },
  { key: "assigned",    label: "Assigned"    },
  { key: "dispatched",  label: "Dispatched"  },
  { key: "in_transit",  label: "In Transit"  },
  { key: "delivered",   label: "Delivered"   },
  { key: "invoiced",    label: "Invoiced"    },
  { key: "paid",        label: "Paid"        },
];
