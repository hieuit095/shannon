# No Mocks, No Placeholders & Strict Verifiable Evidence Rule

1. **Không sử dụng mock, mã giả hay mã giữ chỗ (Zero Mocks / No Placeholders):**
   - Mọi tính năng, API, dịch vụ và giao diện người dùng phải được kết nối và hoạt động thực tế 100% với hệ thống thật (Real Backend, Real Engine, Real File System, Real Database, Real Network).
   - Tuyệt đối nghiêm cấm việc hardcode dữ liệu giả lập (mock data), mã giả (pseudo-code), hàm rỗng (no-op / stub) hoặc giữ chỗ tính năng (TODO / placeholder) thay cho việc triển khai thật.
   - Khi không có dữ liệu thực tế (ví dụ: chưa có lần quét nào), hệ thống phải hiển thị trạng thái rỗng thực tế (Empty State: "Chưa có dữ liệu / Chưa có phiên quét nào"), tuyệt đối không tự tạo dữ liệu giả để lấp đầy giao diện.

2. **Yêu cầu Bằng chứng Xác thực (Strict Verifiable Evidence Before Completion):**
   - Không cho phép kết luận công việc đã hoàn thành nếu không có bằng chứng xác thực trực tiếp (Verifiable Evidence).
   - Nghiêm cấm dự đoán, ước lượng hoặc đưa ra kết luận chủ quan mà không có kiểm chứng thực tế bằng lệnh thực thi, logs, HTTP status code hoặc kết quả build.
   - Mọi công việc chỉ được xác nhận là hoàn thành khi có dẫn chứng cụ thể và chính xác (lệnh kiểm tra, kết quả đầu ra thực tế từ hệ thống).
