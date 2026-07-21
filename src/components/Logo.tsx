export function Logo({ className = "brand-logo-svg" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 226.52 226.52"
      className={className}
      style={{ minWidth: "26px", minHeight: "26px" }}
    >
      <title>sound</title>
        <g id="Camada_1-2" data-name="Camada 1">
          <rect
            width="226.52"
            height="226.52"
            rx="65.77"
            fill="var(--brand)"
          />
          <path
            fill="var(--text-on-brand)"
            d="M113.26,43.26a70,70,0,1,0,70,70A70,70,0,0,0,113.26,43.26Zm0,86.53a16.53,16.53,0,1,1,16.53-16.53A16.53,16.53,0,0,1,113.26,129.79Z"
          />
        </g>
    </svg>
  );
}