"use client";

import { Menu as MenuPrimitive } from "@base-ui/react/menu";
import { cn } from "cn";

function DropdownMenu(props: MenuPrimitive.Root.Props) {
  return <MenuPrimitive.Root {...props} />;
}

function DropdownMenuTrigger(
  props: MenuPrimitive.Trigger.Props
) {
  return <MenuPrimitive.Trigger {...props} />;
}

function DropdownMenuPortal(
  props: MenuPrimitive.Portal.Props
) {
  return <MenuPrimitive.Portal {...props} />;
}

type DropdownMenuContentProps = MenuPrimitive.Popup.Props & {
  align?: "start" | "center" | "end";
  sideOffset?: number;
};

function DropdownMenuContent({
  className,
  align = "end",
  sideOffset = 6,
  ...props
}: DropdownMenuContentProps) {
  return (
    <MenuPrimitive.Portal keepMounted>
      <MenuPrimitive.Positioner sideOffset={sideOffset} align={align}>
        <MenuPrimitive.Popup
          className={cn(
            "z-50 min-w-40 rounded-md border bg-popover p-1",
            "text-popover-foreground shadow-md outline-none",
            "data-open:animate-in data-open:fade-in-0",
            "data-closed:animate-out data-closed:fade-out-0",
            className
          )}
          {...props}
        />
      </MenuPrimitive.Positioner>
    </MenuPrimitive.Portal>
  );
}

function DropdownMenuItem({
  className,
  ...props
}: MenuPrimitive.Item.Props) {
  return (
    <MenuPrimitive.Item
      className={cn(
        "flex cursor-default items-center rounded-sm px-2 py-2",
        "text-sm outline-none select-none",
        "data-highlighted:bg-accent data-highlighted:text-accent-foreground",
        className
      )}
      {...props}
    />
  );
}

function DropdownMenuSeparator({
  className,
  ...props
}: MenuPrimitive.Separator.Props) {
  return (
    <MenuPrimitive.Separator
      className={cn("-mx-1 my-1 h-px bg-border", className)}
      {...props}
    />
  );
}

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuPortal,
};
