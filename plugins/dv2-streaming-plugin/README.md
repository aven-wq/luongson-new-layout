# DV2 Streaming Plugin

A comprehensive WordPress plugin for streaming content with shortcodes and custom layouts.

## ✨ Automatic Setup on Activation

When you activate the plugin, it automatically:

1. **Creates 4 Pages:**
   - Trang chủ (`/dv2-trang-chu`) - Homepage with featured content
   - Lịch thi đấu (`/lich-thi-dau`) - Match schedule
   - Streams (`/streams`) - Stream list & detail pages
   - Highlights (`/highlights`) - Latest highlights

2. **Enables Pretty Permalinks:**
   - Automatically switches from `?p=123` to `/post-name/` format
   - Required for custom URLs to work

3. **Configures URL Rewriting:**
   - `/streams/{id}` for individual streams
   - All custom page URLs work immediately

## Features

### Shortcodes (All Support Layout Parameter)

All shortcodes support a `layout` parameter with three available layouts: **socolive** (default), **vebo**, **thapcam**

1. **[danh_sach_featured_video]** - Display featured streams
   ```
   [danh_sach_featured_video count="5" layout="socolive"]
   [danh_sach_featured_video count="5" layout="vebo"]
   [danh_sach_featured_video count="5" layout="thapcam"]
   ```

2. **[danh_sach_video_hot]** - Display hot live streams
   ```
   [danh_sach_video_hot count="8" layout="socolive"]
   ```

3. **[danh_sach_blv_hot]** - Display hot BLV commentators
   ```
   [danh_sach_blv_hot count="10" category="" layout="socolive"]
   ```

4. **[lich_truc_tiep]** - Display live match schedule
   ```
   [lich_truc_tiep layout="socolive"]
   ```

5. **[highlights_moi_nhat]** - Display latest highlights
   ```
   [highlights_moi_nhat count="20" layout="socolive"]
   ```

6. **[de_xuat_video]** - Display suggested videos
   ```
   [de_xuat_video count="12" layout="socolive"]
   ```

7. **[stream_detail]** - Display stream detail (auto-reads ID from URL)
   ```
   [stream_detail layout="socolive"]
   ```

**Layout Examples:**
```
<!-- Default layout (socolive) -->
[danh_sach_featured_video count="5"]

<!-- Vebo layout -->
[danh_sach_featured_video count="5" layout="vebo"]

<!-- Thapcam layout -->
[danh_sach_featured_video count="5" layout="thapcam"]

<!-- Mix layouts on same page -->
[danh_sach_featured_video layout="socolive"]
[danh_sach_blv_hot layout="vebo"]
[highlights_moi_nhat layout="thapcam"]
```

### URL Rewriting

Custom URL structures:
- `/streams/{id}` - Stream detail page

### Assets Loading

**CDN Assets:**
- Bootstrap CSS
- Font Awesome icons
- Google Fonts (Roboto, Open Sans)
- Video.js player
- Slick Carousel

**Local Assets:**
- Custom CSS for styling
- JavaScript for interactivity
- Player functionality
- AJAX handling

## Installation

1. Upload the `dv2-streaming-plugin` folder to `/wp-content/plugins/`
2. Activate the plugin through the 'Plugins' menu in WordPress
3. Start using the shortcodes in your pages/posts

## Usage Examples

### Display BLV List on a Page

```
[dv2_blv_list count="20" orderby="date" order="DESC"]
```

### Display Featured Streams

```
[dv2_stream_featured count="5"]
```

### Display Grid of Content

```
[dv2_grid type="blv" count="12" columns="4"]
```

### Display Latest Mixed Content

```
[dv2_latest count="10" type="both"]
```

### API Live chat
- https://github.com/thinkwithdev/plugin_livechat

## File Structure

```
dv2-streaming-plugin/
├── assets/
│   ├── css/
│   │   ├── main.css
│   │   ├── grid.css
│   │   ├── player.css
│   │   └── admin.css
│   ├── js/
│   │   ├── main.js
│   │   ├── player.js
│   │   ├── ajax-handler.js
│   │   └── admin.js
│   ├── images/
│   └── fonts/
├── includes/
│   ├── class-shortcodes.php
│   ├── class-url-rewrite.php
│   └── class-assets-loader.php
├── dv2-streaming-plugin.php
└── README.md
```

## Requirements

- WordPress 5.0 or higher
- PHP 7.4 or higher

## Support

For issues and feature requests, please contact the plugin author.

## License

GPL v2 or later

## Changelog

### 1.0.0
- Initial release
- 6 shortcodes
- URL rewriting
- CDN and local asset loading

