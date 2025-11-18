import clsx from "clsx"
import { ReactNode } from "react"

type HeadingProps = {
  as: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "span"
  size: "small" | "medium" | "large" | "custom"
  weight?: "regular" | "medium" | "semibold" | "bold"
  children: ReactNode
  className?: string
}

const sizeStyles = {
  small: clsx("leading-snug text-md lg:text-xl"),
  medium: clsx("leading-tight text-xl lg:text-2xl"),
  large: clsx("leading-tight text-2xl lg:text-3xl"),
  custom: "",
}

const Heading = ({
  as,
  size,
  weight = "bold",
  children,
  className,
}: HeadingProps) => {
  const Component = as

  return (
    <Component
      className={clsx(className, sizeStyles[size], {
        "font-bold": weight === "bold",
        "font-semibold": weight === "semibold",
        "font-medium": weight === "medium",
        "font-normal": weight === "regular",
      })}
    >
      {children}
    </Component>
  )
}

export default Heading
