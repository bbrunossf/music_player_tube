import Slider from "react-slick";
import PlaylistCard from "~/components/PlaylistCard";
import type { JellyfinItem } from "~/types/jellyfin";
import { CreatePlaylistCard } from "./CreatePlaylistCard";
import { CreatePlaylistModal } from "./CreatePlaylistModal";


type PlaylistCarouselProps = {
  playlists: JellyfinItem[];
  selectedPlaylistId: string | null;
  getImageUrl: (item: JellyfinItem, type: string) => string | null;
  fallbackImage: string;
  onSelect: (id: string) => void;
  onCreatePlaylist?: (name: string) => Promise<boolean>;
};

const sliderSettings = {
  dots: true,
  infinite: false,
  speed: 500,
  slidesToShow: 3,
  slidesToScroll: 3,
  responsive: [
    {
      breakpoint: 768,
      settings: {
        slidesToShow: 1,
        slidesToScroll: 1,
      },
    },
  ],
};

export default function PlaylistCarousel({
  playlists,
  selectedPlaylistId,
  getImageUrl,
  fallbackImage,
  onSelect,
  onCreatePlaylist,
}: PlaylistCarouselProps) {
  const SliderComponent =
    typeof window === "undefined" ? Slider.default : Slider;
  const handleCreateFromModal = onCreatePlaylist;

  return (
    <SliderComponent {...sliderSettings}>
      {playlists.map((playlist) => {
        const isActive = playlist.Id === selectedPlaylistId;

        return (
          <PlaylistCard
            key={playlist.Id}
            playlist={playlist}
            isActive={isActive}
            imageUrl={getImageUrl(playlist, "Primary") || undefined}
            fallbackImage={fallbackImage}
            onSelect={onSelect}
          />
        );
      })}
      {/* Card de criar nova playlist com modal embutido */}
      {onCreatePlaylist && (
        <CreatePlaylistModal
          onCreate={onCreatePlaylist}
        />
      )}
    </SliderComponent>
  );
}
