# Streams & Highlights Pages - Usage Guide

## Automatic Page Creation

When you activate the DV2 Streaming Plugin, it automatically creates two pages:

### 1. `/streams` Page
- **URL:** `http://yourdomain.com/streams`
- **Content:** Contains the `[stream_detail]` shortcode
- **Purpose:** Lists all streams or displays individual stream details

### 2. `/highlights` Page
- **URL:** `http://yourdomain.com/highlights`
- **Content:** Contains the `[highlights_moi_nhat count="20"]` shortcode
- **Purpose:** Displays the latest highlights

## URL Structure

### Streams List
Access all streams:
```
http://yourdomain.com/streams
```

### Individual Stream
Access a specific stream by ID or slug:
```
http://yourdomain.com/streams/{slug}
http://yourdomain.com/streams/{id}
```

**Examples:**
- `http://yourdomain.com/streams/premier-league-match`
- `http://yourdomain.com/streams/123`

## How It Works

### Stream Detail Shortcode

The `[stream_detail]` shortcode automatically:

1. **Without ID:** Shows a list of all streams
2. **With ID:** Shows the individual stream detail page

The shortcode reads the `stream_id` from the URL using WordPress rewrite rules.

### URL Rewriting

The plugin adds a custom rewrite rule:
```php
^streams/([^/]+)/?$
```

This captures anything after `/streams/` and passes it to the shortcode as `stream_id`.

## Stream Detail Page Features

When viewing an individual stream (`/streams/{id}`), the page displays:

1. **Stream Title** - The post title
2. **Metadata:**
   - Publication date
   - View count (if available)
3. **Video Player:**
   - Supports custom video URLs (HLS format)
   - Supports embed codes
   - Falls back to thumbnail if no video
4. **Stream Content** - The full post content
5. **Related Streams** - 6 random related streams

## Required Post Meta Fields

For streams to display properly, you can set these custom fields:

- `video_url` - Direct URL to video (HLS/M3U8 format)
- `embed_code` - Custom embed code (HTML)
- `views` - View count (number)

**Example:**
```php
update_post_meta($post_id, 'video_url', 'https://example.com/stream.m3u8');
update_post_meta($post_id, 'views', 1500);
```

## Creating Links to Streams

In your templates or posts, link to streams using:

```php
<?php echo home_url('/streams/' . get_post_field('post_name', $post_id)); ?>
```

Or with the post slug:
```html
<a href="/streams/my-stream-slug">Watch Stream</a>
```

## Styling

The plugin includes `stream-detail.css` with classes:

- `.dv2-streams-list` - Grid of stream items
- `.dv2-stream-item` - Individual stream card
- `.dv2-stream-detail` - Stream detail page container
- `.dv2-stream-player` - Video player container
- `.dv2-related-streams` - Related streams section

### Customizing Styles

To override styles, add to your theme's CSS:

```css
.dv2-stream-detail .dv2-stream-title {
    color: your-color;
    font-size: your-size;
}
```

## Manual Page Creation (if needed)

If the pages weren't created automatically, you can create them manually:

1. Go to **Pages > Add New**
2. Create a page titled "Streams" with slug "streams"
3. Add the shortcode: `[stream_detail]`
4. Publish

Repeat for "Highlights" page with `[highlights_moi_nhat count="20"]`

## Flushing Rewrite Rules

If URLs aren't working, flush rewrite rules:

1. Go to **Settings > Permalinks**
2. Click "Save Changes" (no need to change anything)

Or programmatically:
```php
flush_rewrite_rules();
```

## Testing

1. **Activate the plugin** - Pages should be created automatically
2. **Visit `/streams`** - Should show list of streams
3. **Create a stream post** - Add a stream via Posts > Streams
4. **Visit `/streams/{slug}`** - Should show the stream detail

## API Integration

When syncing from external API, ensure your API returns:

```json
{
    "id": "unique-id",
    "title": "Stream Title",
    "content": "Stream description",
    "thumbnail_url": "https://...",
    "meta": {
        "video_url": "https://stream.m3u8",
        "views": 1500
    }
}
```

The plugin will automatically:
- Create/update the stream post
- Set the video URL meta field
- Update the thumbnail
- Purge cache

## Troubleshooting

### URLs return 404
- Go to Settings > Permalinks and save
- Check if pages exist in Pages list
- Verify rewrite rules are added

### Shortcode not working
- Check if plugin is activated
- Verify shortcode spelling: `[stream_detail]`
- Check page content contains the shortcode

### No streams showing
- Create stream posts via Posts > Streams
- Check posts are published (not draft)
- Verify query is working (check PHP errors)

## Advanced Customization

### Custom Template

Create a custom template in your theme:

**File:** `single-stream-detail.php`

```php
<?php
// Your custom stream detail template
get_header();

// The shortcode will still work here
echo do_shortcode('[stream_detail]');

get_footer();
?>
```

### Filter Stream Query

Modify the streams query:

```php
add_filter('dv2_streams_query_args', function($args) {
    $args['posts_per_page'] = 50; // Show 50 streams
    return $args;
});
```

### Custom Video Player

Override the video player output:

```php
add_filter('dv2_video_player_html', function($html, $post_id, $video_url) {
    // Return your custom player HTML
    return '<div class="my-player">...</div>';
}, 10, 3);
```

## Support

For issues or questions, check:
- Plugin documentation in `README.md`
- WordPress debug log
- Browser console for JavaScript errors

