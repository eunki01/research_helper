import smtplib
from email.mime.text import MIMEText
from central_server.core.config import settings

def send_email(to_email: str, subject: str, body: str):
  smtp_server = settings.SMTP_SERVER
  smtp_port = settings.SMTP_PORT
  sender_email = settings.SMTP_USER
  sender_password = settings.SMTP_PASSWORD
  
  msg = MIMEText(body)
  msg["Subject"] = subject
  msg["From"] = sender_email
  msg["To"] = to_email
  
  try:
    with smtplib.SMTP(smtp_server, smtp_port) as server:
      server.set_debuglevel(1)
      server.starttls()
      server.login(sender_email, sender_password)
      print("[DEBUG] SMTP 로그인 성공")
      
      server.sendmail(sender_email, to_email, msg.as_string())
      print("[DEBUG] 이메일 전송 성공")
  except smtplib.SMTPAuthenticationError as e:
    print("불러온 이메일 패스워드", send_email, sender_password)
    
    print("[ERROR] SMTP 인증 실패: 이메일 또는 비밀번호를 확인하세요")
    print(f"[DEBUG] 상세 정보: {e}")
  except smtplib.SMTPException as e:
    print("[ERROR] SMTP 오류 발생")
    print(f"[DEBUG] 상세 정보: {e}")
    raise
  finally:
    print("[DEBUG] 이메일 전송 프로세스 종료")