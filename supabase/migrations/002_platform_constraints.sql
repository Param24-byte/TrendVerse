-- 1. Add CHECK constraint for platforms to act as the single source of truth
ALTER TABLE posts
ADD CONSTRAINT posts_platform_check
CHECK (platform IN ('github', 'hackernews', 'producthunt', 'huggingface', 'devto', 'reddit', 'stackexchange'));



-- 2. Create a view to efficiently count posts per platform per niche (Fixes the 1000-row limit issue in the pie chart)
CREATE OR REPLACE VIEW platform_niche_counts AS
SELECT 
    niche, 
    platform, 
    COUNT(*) as post_count
FROM 
    posts
GROUP BY 
    niche, platform;
