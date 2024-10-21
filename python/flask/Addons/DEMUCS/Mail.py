import json
from email.mime.text import MIMEText
import smtplib


settings_file = open("/var/www/apache-flask/app/static/mailsetting.json", "r")
settings_data = json.load(settings_file)

def mail_sending(content, email=settings_data["sending_address"], subject="test"):
    msg = MIMEText(content, "plain", "utf-8")
    msg['Subject'] = subject
    msg['To'] = email

    try:
        smtpobj = smtplib.SMTP('smtp.gmail.com', 587)  # SMTPオブジェクトを作成。smtp.gmail.comのSMTPサーバーの587番ポートを設定。
        smtpobj.ehlo()                                 # SMTPサーバとの接続を確立
        smtpobj.starttls()                             # TLS暗号化通信開始
        gmail_address = settings_data['mail_address']       # Googleアカウント(このアドレスをFromにして送られるっぽい)
        app_password = settings_data['app_password']       # アプリパスワード
        smtpobj.login(gmail_address, app_password)          # SMTPサーバーへログイン

        smtpobj.sendmail(gmail_address, email, msg.as_string())

        """ SMTPサーバーとの接続解除 """
        smtpobj.quit()
        return "success"
    except Exception as e:
        print(e)
        return "fail"