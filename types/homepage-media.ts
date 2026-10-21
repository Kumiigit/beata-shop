export const HOMEPAGE_MEDIA_SLOTS = [
  { key: 'hero', label: 'Top banner', help: 'Beside “Find your next favourite”', defaultUrl: '/home-hero.png' },
  { key: 'category-tshirts', label: 'Category: T-shirts', help: 'Browse categories card' },
  { key: 'category-hoodies', label: 'Category: Hoodies', help: 'Browse categories card' },
  { key: 'category-accessories', label: 'Category: Caps & hats', help: 'Browse categories card' },
  { key: 'category-workwear', label: 'Category: Workwear', help: 'Browse categories card', defaultUrl: '/category-workwear-hivis.png' },
  { key: 'category-mugs', label: 'Category: Mugs', help: 'Browse categories card' },
  { key: 'category-bags', label: 'Category: Bags', help: 'Browse categories card', defaultUrl: '/category-bags.png' },
  { key: 'special-drop', label: 'A special drop', help: 'Large seasonal collection banner' },
  { key: 'custom-choose', label: 'Custom print: Choose', help: 'Step 1 image' },
  { key: 'custom-upload', label: 'Custom print: Upload', help: 'Step 2 image' },
  { key: 'custom-proof', label: 'Custom print: Approve', help: 'Step 3 image' },
  { key: 'custom-print', label: 'Custom print: Print', help: 'Step 4 image' },
  { key: 'inspiration-bold', label: 'Make it yours: Bold type', help: 'Inspiration tile' },
  { key: 'inspiration-nature', label: 'Make it yours: Nature', help: 'Inspiration tile' },
  { key: 'inspiration-travel', label: 'Make it yours: Travel', help: 'Inspiration tile' },
  { key: 'inspiration-illustration', label: 'Make it yours: Illustration', help: 'Inspiration tile' },
  { key: 'inspiration-minimal', label: 'Make it yours: Minimal', help: 'Inspiration tile' },
  { key: 'inspiration-personal', label: 'Make it yours: Something personal', help: 'Inspiration tile' },
] as const;

export type HomepageMediaKey = typeof HOMEPAGE_MEDIA_SLOTS[number]['key'];
export type HomepageMedia = Partial<Record<HomepageMediaKey, string>>;
