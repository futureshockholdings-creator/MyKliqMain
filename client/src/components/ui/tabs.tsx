import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

const ScrollableTabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, children, ...props }, forwardedRef) => {
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const listRef = React.useRef<React.ElementRef<typeof TabsPrimitive.List>>(null)
  const [edges, setEdges] = React.useState({ left: false, right: false })

  React.useImperativeHandle(forwardedRef, () => listRef.current!, [])

  React.useEffect(() => {
    const updateEdges = () => {
      const container = scrollRef.current
      const list = listRef.current
      if (!container || !list) return
      const viewport = container.getBoundingClientRect()
      const content = list.getBoundingClientRect()
      const next = {
        left: content.left < viewport.left - 1,
        right: content.right > viewport.right + 1,
      }
      setEdges(previous =>
        previous.left === next.left && previous.right === next.right ? previous : next
      )
    }

    const scrollToVisible = (target?: HTMLElement | null) => {
      const container = scrollRef.current
      const element = target ?? listRef.current?.querySelector<HTMLElement>('[data-state="active"]')
      if (!container || !element) return

      const containerRect = container.getBoundingClientRect()
      const elementRect = element.getBoundingClientRect()
      // Leave room for the overflow cue without covering the selected label.
      const inset = Math.min(24, containerRect.width / 8)
      if (elementRect.left < containerRect.left + inset) {
        container.scrollLeft -= containerRect.left + inset - elementRect.left
      } else if (elementRect.right > containerRect.right - inset) {
        container.scrollLeft += elementRect.right - containerRect.right + inset
      }
      updateEdges()
    }

    const list = listRef.current
    const container = scrollRef.current
    if (!list || !container) return

    const handleFocusIn = (event: FocusEvent) => scrollToVisible(event.target as HTMLElement)
    const frame = window.requestAnimationFrame(() => scrollToVisible())
    const observer = new MutationObserver(() => scrollToVisible())
    observer.observe(list, { attributes: true, subtree: true, attributeFilter: ["data-state"] })
    const resizeObserver = typeof ResizeObserver === "undefined"
      ? undefined
      : new ResizeObserver(() => scrollToVisible())
    resizeObserver?.observe(container)
    resizeObserver?.observe(list)
    list.addEventListener("focusin", handleFocusIn)
    container.addEventListener("scroll", updateEdges, { passive: true })

    return () => {
      window.cancelAnimationFrame(frame)
      observer.disconnect()
      resizeObserver?.disconnect()
      list.removeEventListener("focusin", handleFocusIn)
      container.removeEventListener("scroll", updateEdges)
    }
  }, [])

  return (
    <div className="relative w-full min-w-0 max-w-full">
      <div
        ref={scrollRef}
        className="w-full min-w-0 max-w-full overflow-x-auto overscroll-x-contain py-1"
      >
        <TabsPrimitive.List
          ref={listRef}
          className={cn(
            "inline-flex h-auto min-h-[52px] w-max min-w-full flex-nowrap items-center justify-start gap-1 rounded-md bg-muted p-1 text-muted-foreground [&>[role=tab]]:grow",
            className
          )}
          {...props}
        >
          {children}
        </TabsPrimitive.List>
      </div>
      {edges.left && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-1 left-0 w-5 rounded-l-md bg-gradient-to-r from-muted to-transparent" />
      )}
      {edges.right && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-1 right-0 w-5 rounded-r-md bg-gradient-to-l from-muted to-transparent" />
      )}
    </div>
  )
})
ScrollableTabsList.displayName = "ScrollableTabsList"

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
      className
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, ScrollableTabsList, TabsTrigger, TabsContent }