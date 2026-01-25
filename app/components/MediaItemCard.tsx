import type { JellyfinItem } from "~/types/jellyfin";

const DEFAULT_FALLBACK_SVG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" 
    xml:space="preserve" width="2048" height="2048" 
    style="shape-rendering:geometricPrecision;text-rendering:geometricPrecision;image-rendering:optimizeQuality;fill-rule:evenodd;clip-rule:evenodd"><defs><style>.fil0{fill:#424242;fill-rule:nonzero}</style></defs><g id="Layer_x0020_1"><g id="_337034264"><path id="_337034576" class="fil0" d="M1430.7 1228.39c56.217 0 107.118 22.792 143.962 59.635 36.843 36.843 59.634 87.744 59.634 143.962 0 56.217-22.79 107.118-59.634 143.961-36.844 36.845-87.745 59.635-143.962 59.635-56.217 0-107.118-22.79-143.961-59.635-36.844-36.843-59.635-87.744-59.635-143.96 0-56.22 22.79-107.12 59.635-143.963 36.843-36.843 87.744-59.635 143.961-59.635z"/><path id="_337034192" d="m1533.79 259.873-.006-.058 30.878-3.429c34.35-3.817 65.42 21.038 69.234 55.39.544 4.912.382 2.479.382 7.058v1081.33c0 34.613-28.08 62.694-62.694 62.694-34.613 0-62.694-28.08-62.694-62.694V388.684l-685.712 76.19v1115.53c0 34.615-28.08 62.694-62.694 62.694-34.613 0-62.694-28.08-62.694-62.694V408.814c0-32.915 25.44-58.884 57.661-62.464l778.34-86.482z" style="fill:#424242"/><path id="_337034120" class="fil0" d="M618.439 1382.53c56.531 0 107.717 22.918 144.767 59.968 37.05 37.05 59.968 88.236 59.968 144.767 0 56.531-22.918 107.717-59.968 144.767-37.05 37.049-88.236 59.967-144.767 59.967-56.531 0-107.717-22.918-144.767-59.967-37.049-37.05-59.968-88.235-59.968-144.767 0-56.53 22.92-107.717 59.968-144.767 37.05-37.05 88.235-59.968 144.767-59.968z"/></g></g><path style="fill:none" d="M0 0h2048v2048H0z"/></svg>
  `);

    

type MediaItemCardProps = {
  item: JellyfinItem;
  imageUrl?: string;
  isSelected?: boolean;
  onToggle: (item: JellyfinItem) => void;
  TypeIcon: React.ComponentType<{ size?: number; color?: string }>;
  duration?: string | null;
  imageFit?: "cover" | "contain";
  showSelectionBorder?: boolean;
  lineClampTitle?: boolean;
};

export function MediaItemCard({
  item,
  imageUrl,
  isSelected = false,
  onToggle,
  TypeIcon,
  duration,
  imageFit = "cover",
  showSelectionBorder = false,
  lineClampTitle = false,
}: MediaItemCardProps) {
  const borderClass = showSelectionBorder
    ? isSelected
      ? "border-2 border-blue-500"
      : "border border-[#333]"
    : "border border-[#333]";

  const objectFitClass =
    imageFit === "contain" ? "object-contain" : "object-cover";

  return (
    <div className={`rounded-xl overflow-hidden bg-[#111] h-[260px] ${borderClass}`}>
      <div className="h-[180px]">
        <img
          src={imageUrl || DEFAULT_FALLBACK_SVG}
          alt={item.Name}
          className={`w-full h-full ${objectFitClass}`}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = DEFAULT_FALLBACK_SVG;
          }}
        />
      </div>

      <div className="p-2 flex flex-col gap-[6px]">
        <span
          className={`text-[#bbb] text-xs leading-tight ${
            lineClampTitle ? "line-clamp-3" : ""
          }`}
        >
          {item.Name}
        </span>

        <div className="flex items-center gap-[6px]">
          <TypeIcon size={14} color="#3b82f6" />

          {duration && (
            <span className="text-[11px] text-[#888]">{duration}</span>
          )}

          <button
            onClick={() => onToggle(item)}
            className={`w-[34px] h-[34px] rounded-full text-white flex items-center justify-center ml-auto ${
              isSelected ? "bg-green-500" : "bg-[#ff3b83]"
            }`}
            aria-label="Selecionar item"
          >
            {isSelected ? "✓" : "+"}
          </button>
        </div>
      </div>
    </div>
  );
}
