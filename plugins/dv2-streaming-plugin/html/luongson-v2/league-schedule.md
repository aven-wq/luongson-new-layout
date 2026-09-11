# Prompt: Trang Lịch thi đấu theo giải (LuongSon V2)

> Copy toàn bộ nội dung từ mục **PROMPT BẮT ĐẦU** đến **PROMPT KẾT THÚC** khi giao task cho agent.

---

## PROMPT BẮT ĐẦU

### Bối cảnh

Plugin `dv2-streaming-plugin`, layout `luongson-v2`. Hiện có 2 trang đang **ổn định — không được phá**:

| Trang | Shortcode | JS chính |
|-------|-----------|----------|
| Trang chủ | `[de_xuat_video layout="luongson-v2"]` + `[danh_sach_featured_video layout="luongson-v2"]` | `home-match.js`, `list-matches.js` |
| Lịch thi đấu | `[lich_truc_tiep layout="luongson-v2"]` | `schedule.js` |

Cần thêm trang thứ 3: **Lịch thi đấu theo giải**, UI theo mockup (dropdown chọn giải ở header “Đang phát sóng”, title lịch đổi theo giải, 2 block cùng filter).

Shortcode trang mới:

```text
[danh_sach_featured_video layout="luongson-v2" league_filter="1"]
[lich_truc_tiep layout="luongson-v2" league_filter="1"]
```

(Hoặc tên attribute tương đương rõ nghĩa; quan trọng là **opt-in**, default off.)

### Mục tiêu sản phẩm

1. Dropdown chọn giải (danh sách từ `GET /api/dv2-streaming-plugin/competitions-hot` — file `includes/handle-proxy/endpoints/competitions-hot.php`).
2. Khi chọn giải: `[danh_sach_featured_video]` fetch lại trận theo `competition_id` (param API `competitions=<id>`).
3. Cùng lúc `[lich_truc_tiep]` lọc trận theo giải đó; title dạng `Lịch thi đấu {Tên giải}` (mockup: “Lịch thi đấu Premier League”).
4. Deep-link: click tên giải ở row lịch (`schedule.js` ~530–534, hiện đang `href=detailUrl` trận) → vào trang lịch theo giải, pre-select giải đó + hiện filter.
5. Trang chủ + trang lịch thường **giữ nguyên hành vi UI/API** như hiện tại.

### Nguyên tắc kiến trúc (bắt buộc)

**1. Opt-in bằng shortcode attribute — không đổi default**

- `league_filter` (hoặc `mode="league"`) chỉ bật trên trang mới.
- Không có attribute → không render dropdown, không đọc `competition_id` từ URL, không emit/listen sync event, không đổi title, không đổi URL league link (trừ điểm entry đã thống nhất ở mục 4).
- PHP block (`home-featured-streams.block.php`, `stream-calander.block.php`) nhận `$atts`, ghi `data-*` lên root (vd. `data-league-filter="1"`). JS chỉ kích hoạt khi thấy flag này.

**2. URL là source of truth cho giải đang chọn**

- Query: `?competition_id=<id>` (bắt buộc). Có thể thêm `competition_name` / slug chỉ để SEO/hiển thị; **id** mới dùng để filter API.
- Load trang / đổi dropdown → `history.replaceState` hoặc `pushState` cập nhật query (không full reload nếu đang ở trang league).
- Cả 2 shortcode đọc cùng URL → đồng bộ tự nhiên, F5/share link vẫn đúng.
- Entry từ click tên giải trên trang lịch thường: navigate sang URL trang league + `?competition_id=...` (+ name nếu cần).

**3. Sync runtime giữa 2 shortcode**

- Featured sở hữu dropdown (UI filter ở block “Đang phát sóng”).
- Khi đổi giải: cập nhật URL + `CustomEvent` (vd. `luongson:competition-change` với `{ id, name }`) trên `document`.
- Schedule listen event + cũng hydrate từ URL lúc init.
- Không hard-couple DOM giữa 2 file; không require mount thứ tự đặc biệt.

**4. Entry point từ tên giải (`schedule.js`)**

- Hiện `buildScheduleMatchRowHtml` gắn `league.name` → `detailUrl` (sai cho use-case này).
- Đổi link tên giải → URL trang “Lịch thi đấu theo giải” + `competition_id` (+ name nếu có).
- Cấu hình base URL qua `window.luongsonSchedule` / WP localize (không hardcode path trong JS).
- Click team/score/odds vẫn vào chi tiết trận như cũ.
- Scope đổi link: **mọi** instance `schedule.js` (cả trang lịch thường và trang league) đều trỏ tên giải sang trang league — hợp lý UX. Không đụng link khác.

**5. API filter — mở rộng an toàn, không phá default**

Hiện `streams-range.php`:

- FE chỉ gửi `from`, `to`, `page`, `pageSize`.
- Server tự gắn `statuses=1,2`, `priorityCompetitions` (admin/hot). **Không** nhận `competitions` từ FE.

Cần:

- Cho phép **optional** query `competitions` (một id, sanitize giống `dv2_streams_range_sanitize_priority_ids`).
- Chỉ khi có `competitions` hợp lệ mới forward upstream `competitions=<id>` (đúng contract bạn nêu).
- Khi **không** có param → giữ nguyên logic cũ 100% (trang chủ / lịch thường không đổi).
- Không mở FE ghi đè `statuses` / `priorityCompetitions`.
- `list-matches.js` + `schedule.js`: chỉ thêm `competitions` vào request khi `league_filter` bật **và** có `competition_id`.

**6. UI dropdown (chỉ khi `league_filter="1"`)**

- Vị trí: header phải của “Đang phát sóng” (mockup: nút xanh “Premier League”).
- Data: `competitions-hot`. Empty/error → ẩn hoặc disabled + fallback message ngắn.
- Init: nếu URL có `competition_id` khớp list → chọn id đó; không khớp → chọn item đầu (hoặc giữ id URL nếu API trận vẫn nhận) — ghi rõ choice trong PR.
- Đổi giải → refetch featured + event cho schedule; schedule refetch theo ngày đang chọn + update title.
- Trang chủ: **không** có dropdown.

**7. Title `[lich_truc_tiep]` khi league mode**

- Default trang lịch: giữ “Lịch thi đấu Bóng Đá hôm nay mới nhất 24h”.
- League mode: `Lịch thi đấu {name}`; thiếu name → “Lịch thi đấu” hoặc id tạm, update khi hot-list load xong.

### Ràng buộc kỹ thuật

- Chỉ đụng `luongson-v2` (+ proxy `streams-range` nếu cần param). Không regress layout khác (socolive/vebo/…).
- Tái sử dụng `list-matches.js` / `schedule.js` / CSS hiện có; nhánh `if (leagueFilterEnabled)` — tránh fork file mới trừ khi thật sự cần.
- Shortcode PHP: thêm attr vào `shortcode_atts` trong `class-shortcodes.php` nếu cần, forward xuống block.
- Assets: không đổi enqueue làm trang chủ/lịch thường load thừa logic nặng; flag `data-*` đủ.
- Escape HTML / sanitize id; không tin name từ URL khi render (escape).
- Giữ date picker + load-more schedule; filter giải **kết hợp** date, không thay date.
- Loading/empty: empty state rõ khi giải không có trận.

### Thứ tự triển khai đề xuất

1. Proxy `streams-range`: optional `competitions` (backward-compatible).
2. Shortcode + PHP blocks: attr `league_filter` + `data-*` + slot dropdown (featured) + title hook (schedule).
3. `list-matches.js`: load hot competitions, dropdown, URL sync, truyền `competitions`, emit event.
4. `schedule.js`: đọc URL/event, filter API, đổi title; sửa href tên giải → trang league.
5. Localize/config base URL trang league (WP hoặc `window.*`).
6. QA 3 trang (checklist dưới).

### Acceptance criteria

- [ ] Trang chủ: không dropdown; API featured không gửi `competitions`; UI/hành vi như cũ.
- [ ] Trang lịch thường: không dropdown; schedule không filter theo giải; API không gửi `competitions`; date picker/load-more ổn; **tên giải** link sang trang league + `competition_id`.
- [ ] Trang league: shortcode có `league_filter="1"`; dropdown từ competitions-hot; chọn giải → featured + schedule cùng filter; title schedule đúng tên giải.
- [ ] Vào `/trang-league/?competition_id=X` → pre-select X, cả 2 block đúng giải.
- [ ] Đổi dropdown cập nhật query (shareable); F5 giữ state.
- [ ] Không regress layout khác / shortcode thiếu attr.
- [ ] Empty/error API xử lý ổn, không JS crash.

### File tham chiếu

- `html/luongson-v2/list-matches.js` + `list-matches.css` + `home-featured-streams.block.php`
- `html/luongson-v2/schedule.js` (đặc biệt ~530–534) + `schedule.css` + `stream-calander.block.php`
- `includes/class-shortcodes.php` — `danh_sach_featured_video`, `lich_truc_tiep`
- `includes/handle-proxy/endpoints/streams-range.php`
- `includes/handle-proxy/endpoints/competitions-hot.php`
- Mockup: dropdown giải trên “Đang phát sóng”; “Lịch thi đấu {League}” bên dưới

### Out of scope

- Không redesign trang chủ / lịch thường.
- Không đổi `[de_xuat_video]`.
- Không filter giải cho layout ngoài `luongson-v2`.
- Không bắt buộc WP page slug cụ thể — chỉ cần URL cấu hình được.

### Definition of done

Implement + tự test 3 trang theo checklist. Tóm tắt: file đổi, cách bật shortcode, ví dụ URL `competition_id`, xác nhận không ảnh hưởng 2 trang cũ.

## PROMPT KẾT THÚC

---

## Ghi chú nhanh cho editor (không copy vào prompt agent)

**Cách gắn trang WP**

```text
[danh_sach_featured_video layout="luongson-v2" league_filter="1"]
[lich_truc_tiep layout="luongson-v2" league_filter="1"]
```

**Vì sao opt-in attribute + URL sync**

- Không phá default shortcode đang chạy ổn.
- Deep-link/share/F5 đúng.
- 2 shortcode độc lập, sync qua URL + event — đúng kiểu ghép block WordPress.

**Lưu ý proxy**

`streams-range` hiện cố ý không nhận competition từ FE. Mở optional `competitions` phải default-off và sanitize chặt.
