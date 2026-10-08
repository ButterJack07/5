from pathlib import Path
import shutil
import subprocess

root = Path("/opt/fogbound")
snippet_dir = Path("/etc/nginx/snippets")
snippet_dir.mkdir(parents=True, exist_ok=True)
shutil.copy2(root / "deploy/fogbound.conf", "/etc/nginx/snippets/fogbound.conf")

line = "    include /etc/nginx/snippets/fogbound.conf;"

# Update all nginx configuration files under conf.d and sites-enabled
target_files = list(Path("/etc/nginx/conf.d").glob("*.conf")) + list(
    Path("/etc/nginx/sites-enabled").glob("*")
)
for conf in target_files:
    if not conf.is_file():
        continue
    try:
        text = conf.read_text(encoding="utf-8", errors="ignore")
        if line not in text:
            shutil.copy2(conf, str(conf) + ".fogbound-backup")
            # Try to inject inside server block before location / or after ssl configuration
            if "location / {" in text:
                new_text = text.replace("location / {", line + "\n    location / {", 1)
            elif "server {" in text:
                new_text = text.replace("server {", "server {\n" + line, 1)
            else:
                continue
            conf.write_text(new_text, encoding="utf-8")
            if subprocess.run(["nginx", "-t"]).returncode != 0:
                # Revert if nginx -t fails
                conf.write_text(text, encoding="utf-8")
    except Exception as e:
        print(f"Skipping {conf}: {e}")

shutil.copy2(root / "deploy/fogbound.service", "/etc/systemd/system/fogbound.service")
subprocess.run(["systemctl", "daemon-reload"], check=True)
subprocess.run(["systemctl", "enable", "--now", "fogbound"], check=True)
subprocess.run(["systemctl", "restart", "fogbound"], check=True)
subprocess.run(["systemctl", "reload", "nginx"], check=True)
print(
    "✔ Fogbound service & Nginx proxy (HTTP/80 & HTTPS/443) successfully installed and reloaded!"
)
