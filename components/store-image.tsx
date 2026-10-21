import Image, { type ImageProps } from 'next/image';

type StoreImageProps = Omit<ImageProps, 'src' | 'loader' | 'unoptimized'> & { src: string };

export function StoreImage({ src, loading = 'lazy', decoding = 'async', ...props }: StoreImageProps) {
  // Catalogue entries may contain absolute links to our own image endpoint.
  let source = src;
  try {
    const url = new URL(src);
    if (url.protocol === 'https:' && ['beata-shop.co', 'www.beata-shop.co'].includes(url.hostname)) {
      source = `${url.pathname}${url.search}`;
    }
  } catch { /* Relative paths are already suitable for the image optimizer. */ }

  // Preserve support for external catalogue URLs and local artwork previews.
  // Only shop-hosted photos are sent through the optimizer.
  const local = source.startsWith('/') && !source.startsWith('//');
  return <Image {...props} src={source} loading={loading} decoding={decoding} unoptimized={!local} />;
}
