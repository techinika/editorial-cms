-- Add blocks and table_of_contents columns to articles table
-- These columns store the block-based content structure and table of contents

ALTER TABLE public.articles 
ADD COLUMN IF NOT EXISTS blocks JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS table_of_contents JSONB DEFAULT '[]'::jsonb;

-- Add comment to explain the columns
COMMENT ON COLUMN public.articles.blocks IS 'JSON array of content blocks (paragraph, heading, image, etc.)';
COMMENT ON COLUMN public.articles.table_of_contents IS 'JSON array of table of contents entries extracted from headings';

-- Update existing articles to convert HTML content to blocks (optional, can be run separately)
-- This is commented out because it requires the parseHtmlToBlocks function which runs in the browser
-- You can manually convert articles by updating them through the CMS
