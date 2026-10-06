from pathlib import Path
import shutil
import subprocess

root = Path("/opt/fogbound")
conf = Path("/etc/nginx/conf.d/momentmap.conf")
text = conf.read_text()
line = "    include /etc/nginx/snippets/fogbound.conf;"
if line not in text:
    shutil.copy2(conf, str(conf) + ".fogbound-backup")
    text = text.replace(
        "    include /etc/nginx/snippets/gridvane-online.conf;",
        "    include /etc/nginx/snippets/gridvane-online.conf;\n" + line,
        1,
    )
shutil.copy2(root / "deploy/fogbound.conf", "/etc/nginx/snippets/fogbound.conf")
conf.write_text(text)
check = subprocess.run(["nginx", "-t"])
if check.returncode:
    backup = Path(str(conf) + ".fogbound-backup")
    if backup.exists():
        shutil.copy2(backup, conf)
    raise SystemExit(check.returncode)
shutil.copy2(root / "deploy/fogbound.service", "/etc/systemd/system/fogbound.service")
subprocess.run(["systemctl", "daemon-reload"], check=True)
subprocess.run(["systemctl", "enable", "--now", "fogbound"], check=True)
subprocess.run(["systemctl", "reload", "nginx"], check=True)
