"use client"

import Script from "next/script"

export function BuyMeACoffee() {
  return (
    <div className="flex items-center justify-center p-2">
      <Script
        src="https://cdnjs.buymeacoffee.com/1.0.0/button.prod.min.js"
        strategy="afterInteractive"
        data-name="bmc-button"
        data-slug="daiquiri"
        data-color="#FFDD00"
        data-emoji=""
        data-font="Cookie"
        data-text="Buy me a coffee"
        data-outline-color="#000000"
        data-font-color="#000000"
        data-coffee-color="#ffffff"
      />
    </div>
  )
}
