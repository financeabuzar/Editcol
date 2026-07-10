# EditCol Auth Testing Playbook

## Endpoints (all prefixed `/api/auth`)
- POST `/register` — { name, email, phone, password, role } → sends OTP (returned in response since mocked)
- POST `/verify-otp` — { email, otp, type: "email"|"phone" }
- POST `/resend-otp` — { email, type }
- POST `/login` — { email, password, remember_me }
- POST `/logout`
- GET `/me`
- POST `/refresh`
- POST `/forgot-password` — { email } → returns reset_token (mocked, logged)
- POST `/reset-password` — { token, new_password }

## Admin credentials
- Email: set `ADMIN_EMAIL` in the backend environment.
- Password: set `ADMIN_PASSWORD` in the backend environment.

## MongoDB collections
users, otp_codes, password_reset_tokens, login_attempts, editors, conversations, messages, project_requests, reports, reviews

## Curl test
```
API=$(grep REACT_APP_BACKEND_URL /app/frontend/.env | cut -d= -f2)
curl -c c.txt -X POST $API/api/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"<ADMIN_EMAIL>","password":"<ADMIN_PASSWORD>","remember_me":true}'
curl -b c.txt $API/api/auth/me
```
