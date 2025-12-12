"use client";

import { useFormState } from "react-dom";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "./alert";
import { AlertTriangle } from "lucide-react";
import type { ComponentProps } from "react";


type ActionState = {
  message?: string;
};

type Props = Omit<ComponentProps<typeof Button>, "formAction"> & {
  pendingText?: string;
  formAction: (
    prevState: ActionState,
    formData: FormData
  ) => Promise<ActionState>;
  errorMessage?: string;
};

const initialState: ActionState = {
  message: "",
};

export function SubmitButton({
  children,
  formAction,
  errorMessage,
  pendingText = "Submitting...",
  ...props
}: Props) {
  const { pending, action } = useFormStatus();

  // ✅ React 19 API
const [state, internalFormAction] = useFormState(formAction, initialState);

  const isPending = pending && action === internalFormAction;

  return (
    <div className="flex flex-col gap-y-4 w-full">
      {(errorMessage || state?.message) && (
        <Alert variant="destructive" className="w-full">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {errorMessage || state?.message}
          </AlertDescription>
        </Alert>
      )}

      <Button
        {...props}
        type="submit"
        aria-disabled={pending}
        formAction={internalFormAction}
      >
        {isPending ? pendingText : children}
      </Button>
    </div>
  );
}
