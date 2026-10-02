/**
 * Real site photographs supplied by RBE Capital Equip. (originals in media/originals/).
 * Project attribution was confirmed by the owner, photo by photo.
 * `taken` comes from the camera's own EXIF date and is omitted for WhatsApp copies,
 * whose file dates are not capture dates.
 */
import type { ImageMetadata } from 'astro';
import resortPortrait from '../assets/media/resort-himalaya-portrait.jpg';
import resortWide from '../assets/media/resort-himalaya-wide.jpg';
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
    alt: 'RBE’s JCB backhoe loader on the levelled ground of the Ranikhet–Majkhali resort site, new buildings around it and snow peaks of the Himalaya behind at dusk.' },
  resortWide: { src: resortWide, project: 'ranikhet-majkhali', taken: 'Dec 2019',
    alt: 'JCB backhoe loader working between new resort buildings on the Ranikhet–Majkhali site, with the Himalayan range on the horizon.' },
  resortSnow: { src: resortSnow, project: 'ranikhet-majkhali',
    alt: 'The JCB backhoe loader on the Ranikhet–Majkhali resort site during snowfall, cottages and a building under construction behind.' },
  padWorking: { src: padWorking, project: 'padampuri', taken: 'Oct 2021',
    alt: 'JCB backhoe loader with stabilisers down and the backhoe digging, on the Padampuri road-widening project in Nainital district.' },
  padStabilisers: { src: padStabilisers, project: 'padampuri', taken: 'Oct 2021',
    alt: 'Rear view of the Uttarakhand-registered JCB backhoe loader, stabilisers planted, on the Padampuri road-widening project.' },
  padFront: { src: padFront, project: 'padampuri',
    alt: 'Front three-quarter view of RBE’s JCB backhoe loader, Uttarakhand registration UK02, in front of a cut hill slope on the Padampuri project.' },
  padWall: { src: padWall, project: 'padampuri', taken: 'Jun 2022',
    alt: 'JCB backhoe loader set up on firm ground below a stone retaining wall and hillside, Padampuri road-widening project.' },
} satisfies Record<string, Photo>;
