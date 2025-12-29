import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronDown, Check } from "lucide-react"

// Sleek Select Component - Inspired by shadcn/ui and Aceternity
const Select = React.forwardRef(({ className, children, ...props }, ref) => {
  return (
    <SelectProvider {...props}>
      {children}
    </SelectProvider>
  )
})
Select.displayName = "Select"

// Context for Select state
const SelectContext = React.createContext({})

const SelectProvider = ({ value, onValueChange, children }) => {
  const [open, setOpen] = React.useState(false)
  const [selectedValue, setSelectedValue] = React.useState(value)

  React.useEffect(() => {
    setSelectedValue(value)
  }, [value])

  const handleSelect = (val) => {
    setSelectedValue(val)
    onValueChange?.(val)
    setOpen(false)
  }

  return (
    <SelectContext.Provider value={{ open, setOpen, selectedValue, handleSelect }}>
      {children}
    </SelectContext.Provider>
  )
}

const SelectTrigger = React.forwardRef(({ className, children, ...props }, ref) => {
  const { open, setOpen, selectedValue } = React.useContext(SelectContext)

  return (
    <button
      ref={ref}
      type="button"
      onClick={() => setOpen(!open)}
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-lg border border-border bg-background px-4 py-2 text-sm",
        "ring-offset-background transition-all duration-200",
        "placeholder:text-muted-foreground",
        "hover:border-muted-foreground/50 hover:bg-muted/50",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        // Glow effect on focus (Aceternity-inspired)
        "focus:shadow-[0_0_0_2px_rgba(255,255,255,0.1)]",
        "dark:focus:shadow-[0_0_15px_rgba(255,255,255,0.1)]",
        className
      )}
      {...props}
    >
      {children}
      <ChevronDown className={cn(
        "h-4 w-4 opacity-50 transition-transform duration-200",
        open && "rotate-180"
      )} />
    </button>
  )
})
SelectTrigger.displayName = "SelectTrigger"

const SelectValue = React.forwardRef(({ placeholder, className, ...props }, ref) => {
  const { selectedValue } = React.useContext(SelectContext)

  return (
    <span ref={ref} className={cn("block truncate", !selectedValue && "text-muted-foreground", className)} {...props}>
      {selectedValue ? `Page ${selectedValue}` : placeholder}
    </span>
  )
})
SelectValue.displayName = "SelectValue"

const SelectContent = React.forwardRef(({ className, children, ...props }, ref) => {
  const { open, setOpen } = React.useContext(SelectContext)
  const contentRef = React.useRef(null)

  // Close on outside click
  React.useEffect(() => {
    const handleClickOutside = (e) => {
      if (contentRef.current && !contentRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [open, setOpen])

  if (!open) return null

  return (
    <div
      ref={contentRef}
      className={cn(
        "absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-border bg-background p-1",
        // Smooth animation
        "animate-in fade-in-0 zoom-in-95 slide-in-from-top-2",
        // Glass effect (Aceternity-inspired)
        "backdrop-blur-xl bg-background/95",
        "shadow-lg shadow-black/10 dark:shadow-black/30",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
})
SelectContent.displayName = "SelectContent"

const SelectItem = React.forwardRef(({ className, children, value, ...props }, ref) => {
  const { selectedValue, handleSelect } = React.useContext(SelectContext)
  const isSelected = selectedValue === value

  return (
    <button
      ref={ref}
      type="button"
      onClick={() => handleSelect(value)}
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center rounded-md py-2 px-3 text-sm outline-none",
        "transition-colors duration-150",
        "hover:bg-muted hover:text-foreground",
        "focus:bg-muted focus:text-foreground",
        isSelected && "bg-muted/80 text-foreground font-medium",
        className
      )}
      {...props}
    >
      <span className="flex-1 text-left">{children}</span>
      {isSelected && (
        <Check className="h-4 w-4 text-foreground opacity-70" />
      )}
    </button>
  )
})
SelectItem.displayName = "SelectItem"

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem }
