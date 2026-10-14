-- Repair product media URLs after moving away from Lovable-hosted /__l5e/assets-v1 paths.
-- Place uploaded media in public/products before deploying this frontend.
UPDATE public.products
SET media = '[
  {"type":"image","url":"/products/junk-case-blue.jpg"},
  {"type":"image","url":"/products/junk-case-blue-detail.jpg"},
  {"type":"video","url":"/products/junk-case-video-1.mp4"},
  {"type":"video","url":"/products/junk-case-video-2.mp4"}
]'::jsonb,
updated_at = now()
WHERE category = 'junk-cases';

UPDATE public.products
SET media = '[
  {"type":"image","url":"/products/braces-blue.jpg"},
  {"type":"image","url":"/products/braces-pink.jpg"},
  {"type":"image","url":"/products/braces-silver.jpg"}
]'::jsonb,
updated_at = now()
WHERE category = 'braces';

UPDATE public.products
SET media = '[
  {"type":"image","url":"/products/cluster-lashes-pink.jpg"},
  {"type":"image","url":"/products/cluster-lashes-purple.jpg"}
]'::jsonb,
updated_at = now()
WHERE category = 'cluster-lashes';

UPDATE public.products
SET media = '[
  {"type":"video","url":"/products/pimple-patches-video.mp4"}
]'::jsonb,
updated_at = now()
WHERE category = 'pimple-patches';
