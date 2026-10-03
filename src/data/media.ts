/**
 * Real site photographs supplied by RBE Capital Equip. (originals in media/originals/).
 * Project attribution was confirmed by the owner, photo by photo.
 * `taken` comes from the camera's own EXIF date and is omitted for WhatsApp copies,
 * whose file dates are not capture dates.
 */
import type { ImageMetadata } from 'astro';
import resortPortrait from '../assets/media/resort-himalaya-portrait.jpg';
import resortSnow from '../assets/media/resort-snow.jpg';
import padWorking from '../assets/media/padampuri-backhoe-working.jpg';
import padStabilisers from '../assets/media/padampuri-stabilisers.jpg';
import padFront from '../assets/media/padampuri-machine-front.jpg';
import padWall from '../assets/media/padampuri-retaining-wall.jpg';

export interface Photo {
  src: ImageMetadata;
  alt: string;
  project: 'ranikhet-majkhali' | 'padampuri';
  taken?: string;
}

export const photos = {
  resortPortrait: { src: resortPortrait, project: 'ranikhet-majkhali', taken: 'Dec 2019',
    alt: 'RBE’s JCB backhoe loader levelling ground for a hill resort development at Ranikhet–Majkhali, with new cottages around it and Himalayan snow peaks behind at dusk.' },
  resortSnow: { src: resortSnow, project: 'ranikhet-majkhali',
    alt: 'JCB backhoe loader working through snowfall on the Ranikhet–Majkhali resort construction site, with finished cottages and a building under construction behind.' },
  padWorking: { src: padWorking, project: 'padampuri', taken: 'Oct 2021',
    alt: 'JCB backhoe loader with stabilisers down, excavating between reinforced concrete columns on a building construction site, apartment blocks behind, Padampuri, Nainital district.' },
  padStabilisers: { src: padStabilisers, project: 'padampuri', taken: 'Oct 2021',
    alt: 'Rear view of a JCB backhoe loader with stabilisers planted on a building construction site, rebar columns and apartment blocks behind, Padampuri.' },
  padFront: { src: padFront, project: 'padampuri',
    alt: 'Front three-quarter view of RBE’s JCB backhoe loader parked below a cut hill slope on a hillside site at Padampuri, Nainital district.' },
  padWall: { src: padWall, project: 'padampuri', taken: 'Jun 2022',
    alt: 'JCB backhoe loader with stabilisers planted on firm ground below a stone retaining wall on a hillside site at Padampuri.' },
} satisfies Record<string, Photo>;
