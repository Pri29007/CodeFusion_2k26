// accentClasses.js
//
// Tailwind's compiler only picks up class names that appear literally in
// source. Interpolating `bg-${accent}-600` at runtime would silently produce
// unstyled elements once Tailwind purges the build. This map spells out
// every combination so each scheme's accent color renders correctly.

export const accentClasses = {
  kisan: {
    heroBg: "bg-kisan-700",
    heroBgSoft: "bg-kisan-100",
    text: "text-kisan-700",
    textOn600: "text-kisan-600",
    border: "border-kisan-600",
    bg600: "bg-kisan-600",
    ring: "focus:ring-kisan-600/30",
    button: "bg-kisan-600 hover:bg-kisan-700 focus:ring-kisan-600/30",
    chip: "bg-kisan-100 text-kisan-700",
    stepDone: "border-kisan-600 bg-kisan-600 text-white",
    stepCurrent: "border-kisan-600 bg-white text-kisan-700",
    connectorDone: "bg-kisan-600",
    link: "text-kisan-700 hover:text-kisan-600",
  },
  pmay: {
    heroBg: "bg-pmay-700",
    heroBgSoft: "bg-pmay-100",
    text: "text-pmay-700",
    textOn600: "text-pmay-600",
    border: "border-pmay-600",
    bg600: "bg-pmay-600",
    ring: "focus:ring-pmay-600/30",
    button: "bg-pmay-600 hover:bg-pmay-700 focus:ring-pmay-600/30",
    chip: "bg-pmay-100 text-pmay-700",
    stepDone: "border-pmay-600 bg-pmay-600 text-white",
    stepCurrent: "border-pmay-600 bg-white text-pmay-700",
    connectorDone: "bg-pmay-600",
    link: "text-pmay-700 hover:text-pmay-600",
  },
  ayush: {
    heroBg: "bg-ayush-700",
    heroBgSoft: "bg-ayush-100",
    text: "text-ayush-700",
    textOn600: "text-ayush-600",
    border: "border-ayush-600",
    bg600: "bg-ayush-600",
    ring: "focus:ring-ayush-600/30",
    button: "bg-ayush-600 hover:bg-ayush-700 focus:ring-ayush-600/30",
    chip: "bg-ayush-100 text-ayush-700",
    stepDone: "border-ayush-600 bg-ayush-600 text-white",
    stepCurrent: "border-ayush-600 bg-white text-ayush-700",
    connectorDone: "bg-ayush-600",
    link: "text-ayush-700 hover:text-ayush-600",
  },
};
