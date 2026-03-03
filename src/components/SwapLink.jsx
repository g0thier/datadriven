function SwapLink({ href = "#", part1, part2, align = "left" }) {
  const alignmentClasses = {
    left: "justify-start text-left",
    center: "justify-center text-center",
    right: "justify-end text-right",
  };

  return (
    <a href={href} className="group inline-block text-sm text-indigo-500">
      <span className="relative inline-block align-middle w-full">
        <span className="invisible whitespace-nowrap">
          {part1.length > part2.length ? part1 : part2}
        </span>

        <span
          className={`
            absolute inset-0
            overflow-hidden
            h-[1.25em] leading-[1.25em]
            flex items-center
            ${alignmentClasses[align]}
          `}
        >
          <span
            className="
              absolute
              transition-all duration-300 ease-in-out
              group-hover:-translate-y-full
              group-hover:opacity-0
              whitespace-nowrap
            "
          >
            {part1}
          </span>

          <span
            className="
              absolute
              translate-y-full opacity-0
              transition-all duration-300 ease-in-out
              group-hover:translate-y-0
              group-hover:opacity-100
              whitespace-nowrap
            "
          >
            {part2}
          </span>
        </span>
      </span>
    </a>
  );
}

export default SwapLink;