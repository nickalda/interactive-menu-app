import type * as React from "react"

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        src?: string
        alt?: string
        ar?: boolean
        poster?: string
        "ar-modes"?: string
        "ios-src"?: string
        "camera-controls"?: boolean
        "touch-action"?: string
        "shadow-intensity"?: string | number
      }
    }
  }
}

export {}
