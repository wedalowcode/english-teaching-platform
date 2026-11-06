"use client";

import * as React from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "cn";

function Drawer(props: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot="drawer" {...props} />;
}

function DrawerTrigger(props: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="drawer-trigger" {...props} />;
}

function DrawerPortal(props: DialogPrimitive.Portal.Props) {
  return <DialogPrimitive.Portal data-slot="drawer-portal" {...props} />;
}

function DrawerClose(props: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="drawer-close" {...props} />;
}

function DrawerOverlay({
  className,
  ...props
}: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="drawer-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-black/30",
        "data-open:animate-in data-open:fade-in-0",
        "data-closed:animate-out data-closed:fade-out-0",
        className
      )}
      {...props}
    />
  );
}

function DrawerContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: DialogPrimitive.Popup.Props & {
  showCloseButton?: boolean;
}) {
  return (
    <DrawerPortal>
      <DrawerOverlay />

      <DialogPrimitive.Popup
        data-slot="drawer-content"
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex h-full w-full flex-col",
          "border-l bg-background shadow-xl",
          "sm:max-w-lg",
          "duration-300 ease-in-out",
          "data-open:animate-in data-open:slide-in-from-right",
          "data-closed:animate-out data-closed:slide-out-to-right",
          className
        )}
        {...props}
      >
        {children}

        {showCloseButton && (
          <DialogPrimitive.Close
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                className="absolute right-4 top-4"
              />
            }
          >
            <XIcon />
            <span className="sr-only">关闭</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Popup>
    </DrawerPortal>
  );
}

function DrawerHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-header"
      className={cn("flex flex-col gap-2 border-b p-6", className)}
      {...props}
    />
  );
}

function DrawerBody({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-body"
      className={cn("flex-1 overflow-y-auto p-6", className)}
      {...props}
    />
  );
}

function DrawerFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-footer"
      className={cn("border-t p-4", className)}
      {...props}
    />
  );
}

function DrawerTitle({
  className,
  ...props
}: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      data-slot="drawer-title"
      className={cn("text-lg font-semibold", className)}
      {...props}
    />
  );
}

function DrawerDescription({
  className,
  ...props
}: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      data-slot="drawer-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

export {
  Drawer,
  DrawerTrigger,
  DrawerPortal,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
};
