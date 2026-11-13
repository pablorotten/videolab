import { loadFont as loadJost } from '@remotion/google-fonts/Jost';

// Google Fonts that `video.json` may name in a style's `fontFamily`, keyed by the name
// it writes. The files ship with the package, so renders need no network. Loading is
// eager: the weight list covers the default styles (intro 900, captions 700).
const googleFonts: Record<string, string> = {
  Jost: loadJost('normal', { weights: ['400', '700', '900'], subsets: ['latin'] }).fontFamily,
};

// Maps the family named in `video.json` to the one the browser actually needs.
// System fonts and CSS stacks (Arial, Georgia, ...) pass through untouched, and
// unknown Google Fonts fall back instead of throwing.
export const resolveFontFamily = (name: string): string => googleFonts[name] ?? name;
