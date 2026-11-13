# Tran_Thi_Minh_Anh_website — Portfolio CNS&AI của Trần Thị Minh Anh

Portfolio học phần **Nhập môn Công nghệ số và ứng dụng AI (INF2501)** — sinh viên Sư phạm Âm nhạc, Trường ĐH Sư phạm Nghệ thuật Trung ương.

## Trạng thái
- ✅ Giao diện riêng + trang Giới thiệu (thông tin, sở thích, mục tiêu học tập, định hướng phát triển, mục tiêu portfolio — giữ nguyên văn, có tách ý để trình bày)
- ✅ Trang Dự án / chi tiết bài / Tổng kết dựng sẵn; ô nào còn `…` hiện nhãn "đang cập nhật"
- ✅ Bài 3 (Viết prompt hiệu quả): 3 tác vụ × 3 prompt chạy thật trên Gemini (12/11/2026) + 1 lượt nối prompt, 27 ảnh chụp màn hình, chấm 5 tiêu chí, kiểm chứng với tài liệu gốc, phân tích và 7 nguyên tắc (nội dung ở `students/tran_thi_minh_anh/bai3.yaml`)
- ✅ Bài 1 (Tệp tin & thư mục): cây thư mục thật trên máy + quy tắc đặt tên, 5 ảnh File Explorer (`bai1.yaml`)
- ✅ Bài 2 (Tìm kiếm học thuật): 7 truy vấn với toán tử nâng cao (DuckDuckGo, 13/11/2026), 11 nguồn chấm CRAAP (`bai2.yaml`)
- ✅ Bài 4 (Hợp tác trực tuyến): vai trò người điều phối trong cuộc họp Google Meet 12/11/2026, ảnh minh chứng do nhóm cung cấp (`bai4.yaml`)
- ✅ Bài 5 (AI tạo sinh): học liệu tương tác “Khởi động giọng cùng Đô Rê Mi” – Gemini 2 lượt, bảng đối chiếu giữ/sửa/bỏ (`bai5.yaml`)
- ✅ Bài 6 (AI có trách nhiệm): nhật ký sự cố + căn cứ pháp lý 2025 + bộ nguyên tắc 4 giai đoạn + bảng tự kiểm tra (`bai6.yaml`)
- ⚠️ Tổng kết: đã có **bản nháp** – đề thi yêu cầu sinh viên tự viết phần cảm nhận, tự đánh giá
- ⏳ Mã sinh viên, lớp, email: chưa có

## Giao diện — "Recital"
Lấy cảm hứng từ ảnh Minh Anh trong lễ 20/11 của Khoa: váy champagne, phông tím sân khấu với nốt nhạc xanh và phím đàn. Bố cục là **tờ chương trình hòa nhạc**, khác hẳn các portfolio khác (không dùng header ngang).
- Màu: ngà `#f8f3ec`, champagne `#d9b896`, vàng đồng `#8a6436`, tím sân khấu `#5b4a8b`, đêm `#1f1934`, mực `#2a1f2f`
- Chữ: **Cormorant Garamond** (tiêu đề, nghiêng thanh lịch) + **Be Vietnam Pro** (nội dung) — tự host, đủ dấu tiếng Việt
- Điều hướng: thanh "chương trình" dọc bên trái (I. Prélude · II. Programme · III. Coda), mobile thành ngăn kéo
- Hero: tên lớn, ảnh trong **khung vòm** viền champagne; bên dưới là **khuông nhạc tương tác** — chạm/vuốt để hát nốt (gọi tên Đô–Rê–Mi)
- **Phòng luyện thanh (Vocalise)**: chọn mẫu (5 nốt / rải hợp âm / quãng tám), nguyên âm a-o-u-i, giọng xuất phát; đàn dạo hợp âm, giọng mẫu hát và tự nâng nửa cung mỗi lượt; khuông nhạc hiện đúng hóa biểu theo giọng
- Mục tiêu học tập = **crescendo** p → mp → mf → f, bấm ký hiệu để nghe to dần
- Định hướng phát triển = **cấu trúc bài hát** Intro / Verse / Pre-chorus / Chorus / Outro, nút "Hát cả bài" chạy kiểu karaoke
- Mục tiêu portfolio = **vé xem hòa nhạc** (nghiêng theo chuột)
- Dự án = tờ chương trình 6 tiết mục, số La Mã, rê chuột nghe nốt mở màn; trang bài có "ghi chú bên lề"
- Footer: **phím đàn 2 quãng tám** chơi được
- Trang bài prompt dạng **tổng phổ**: mỗi phiên bản prompt là một dòng nhạc mang ký hiệu cường độ *p / mf / f*; điểm 5 tiêu chí vẽ thành 5 nốt trên khuông; bảng kiểm chứng riêng cho từng tác vụ; "giai điệu điểm số" so sánh 9 prompt; "lời phê" phân tích; 7 nguyên tắc xếp theo gam Đô → Si (bấm nghe); lightbox xem ảnh
- Âm thanh tổng hợp bằng Web Audio (giọng hát dùng bộ lọc formant), có nút bật/tắt; tôn trọng *prefers-reduced-motion*

## Cấu trúc
```
students/tran_thi_minh_anh/data.yaml   ← toàn bộ nội dung
students/tran_thi_minh_anh/images/     ← ảnh đại diện + ảnh minh chứng bài tập
template/*.html.j2, template/assets/   ← giao diện
scripts/render.py                      ← YAML → HTML tĩnh vào dist/
```

## Dùng
```bash
pip install -r requirements.txt
python scripts/render.py
python -m http.server -d dist   # mở http://localhost:8000
```
Push lên `main` → GitHub Actions tự build & deploy (bật **Settings → Pages → Source: GitHub Actions** một lần).
