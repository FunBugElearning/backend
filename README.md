# FunbugProject Backend

Nền tảng quản lý lớp học, điểm danh và điểm số xây dựng bằng Spring Boot, sử dụng PostgreSQL và JWT cho xác thực, kèm giao diện Thymeleaf đơn giản.

## Công nghệ chính
- Spring Boot 3.5, Java 17
- Spring Data JPA (PostgreSQL), Lombok
- Spring Security + JWT (jjwt)
- Thymeleaf templates cho trang web đăng nhập/dashboard

## Cấu trúc thư mục
- `src/main/java/com/example/funbugProject/Controller`: REST API và controller giao diện web (login, dashboard theo vai trò)
- `src/main/java/com/example/funbugProject/Service`: nghiệp vụ CRUD cho user, lớp học, điểm danh, điểm số
- `src/main/java/com/example/funbugProject/Repository`: lớp JPA repository
- `src/main/java/com/example/funbugProject/Entity`: entity `User`, `Role`, `Classroom`, `Attendance`, `Score`
- `src/main/java/com/example/funbugProject/Security`: cấu hình bảo mật và tiện ích JWT
- `src/main/resources/templates`: trang `login`, `student`, `teacher`, `admin`

## Cấu hình
- Tệp `src/main/resources/application.properties` chứa thông tin kết nối PostgreSQL:
  - `spring.datasource.url=jdbc:postgresql://localhost:5432/funbugdb`
  - `spring.datasource.username=...`
  - `spring.datasource.password=...`
  - `spring.jpa.hibernate.ddl-auto=update`
- JWT secret và thời hạn token đặt trong `src/main/java/com/example/funbugProject/Security/JwtUtil.java`.
- Khi triển khai, nên cung cấp giá trị qua biến môi trường (`SPRING_DATASOURCE_*`, `SPRING_JPA_*`) thay vì hard-code.

## Chạy dự án cục bộ
1) Cài đặt JDK 17, Maven và PostgreSQL.
2) Tạo database `funbugdb`, cập nhật user/password trong `application.properties` nếu cần.
3) Chạy ứng dụng: `./mvnw spring-boot:run` (hoặc `mvn spring-boot:run`).
4) Đóng gói: `mvn clean package` → chạy file `target/funbugProject-0.0.1-SNAPSHOT.jar`.
5) Ứng dụng mặc định chạy trên `http://localhost:8080`.

## Luồng xác thực & bảo mật
- `POST /api/auth/login`: nhận `email` + `password`, trả về JWT, role và email.
- Đặt header `Authorization: Bearer <token>` cho các API yêu cầu bảo vệ.
- Mở công khai: `/api/auth/**`, `/api/users/**`; các đường dẫn còn lại yêu cầu JWT hợp lệ (lọc qua `JwtFilter`).
- `GET /api/auth/validate?token=...`: kiểm tra tính hợp lệ của token.

## API chính (REST)
- User: `GET/POST/PUT/DELETE /api/users`
- Classroom: `GET/POST/PUT/DELETE /api/classrooms`, `GET /api/classrooms/teacher/{teacherId}`
- Attendance: `GET/POST/PUT/DELETE /attendances`, `GET /attendances/student/{studentId}`
- Score: `GET/POST/PUT/DELETE /scores`, `GET /scores/{id}`

## Giao diện web (Thymeleaf)
- `/login` (form đăng nhập), `/logout`
- Sau đăng nhập chuyển trang theo vai trò: `student.html`, `teacher.html`, `admin.html`
- Các trang demo/dummy: `/student/*`, `/teacher/*`, `/admin/*` cho dashboard và tính năng.

## Ghi chú
- Mật khẩu hiện đang lưu/so sánh dạng rõ; nên mã hóa (vd. BCrypt) trước khi dùng thực tế.
- JWT secret đang hard-code; nên chuyển sang biến môi trường ở môi trường production.



