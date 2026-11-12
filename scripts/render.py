#!/usr/bin/env python3
"""render.py – đọc students/<id>/data.yaml → sinh website tĩnh vào dist/

Cách dùng:
    python scripts/render.py                       # nếu students/ chỉ có 1 người
    python scripts/render.py tran_thi_minh_anh     # chỉ định người cần render
"""

import shutil
import sys
from pathlib import Path

import yaml
from jinja2 import Environment, FileSystemLoader

ROOT = Path(__file__).resolve().parent.parent
TEMPLATE_DIR = ROOT / "template"
ASSETS_DIR = TEMPLATE_DIR / "assets"
STUDENTS_DIR = ROOT / "students"
DIST_DIR = ROOT / "dist"

ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"]


def is_blank(v):
    """True nếu ô dữ liệu còn trống hoặc chỉ là placeholder '…'."""
    if v is None:
        return True
    if isinstance(v, (list, tuple)):
        return all(is_blank(x) for x in v)
    t = str(v).strip()
    return t in ("", "…", "...") or t.endswith(": …") or t.endswith(": ...")


def step_kind(line):
    low = str(line).lower()
    if low.startswith("khó khăn"):
        return "challenge"
    if low.startswith("ai:"):
        return "ai"
    return "step"


def make_env():
    env = Environment(loader=FileSystemLoader(str(TEMPLATE_DIR)), autoescape=True,
                      trim_blocks=True, lstrip_blocks=True)
    env.filters["roman"] = lambda n: ROMAN[int(n)] if 0 < int(n) < len(ROMAN) else str(n)
    env.filters["step_kind"] = step_kind
    env.tests["blank"] = is_blank
    return env


def copy_img(student_id, rel, img_dir):
    src = STUDENTS_DIR / student_id / rel
    if not src.exists():
        print(f"  [WARN] không thấy ảnh {src}")
        return None
    img_dir.mkdir(parents=True, exist_ok=True)
    shutil.copy(src, img_dir / src.name)
    return f"assets/img/{src.name}"


def render_student(env, student_id):
    with open(STUDENTS_DIR / student_id / "data.yaml", encoding="utf-8") as f:
        data = yaml.safe_load(f)
    data["slug"] = student_id

    if DIST_DIR.exists():
        shutil.rmtree(DIST_DIR)
    DIST_DIR.mkdir(parents=True)
    shutil.copytree(ASSETS_DIR, DIST_DIR / "assets")
    (DIST_DIR / ".nojekyll").write_text("", encoding="utf-8")

    if data.get("avatar"):
        src = STUDENTS_DIR / student_id / data["avatar"]
        if src.exists():
            shutil.copy(src, DIST_DIR / "assets" / src.name)
            data["avatar_url"] = f"assets/{src.name}"
            print(f"  [OK] avatar: {src.name}")

    img_dir = DIST_DIR / "assets" / "img"
    for p in data["projects"]:
        prod = p.get("product") or {}
        kept = []
        for g in prod.get("gallery") or []:
            url = copy_img(student_id, g["file"], img_dir)
            if url:
                kept.append({**g, "src": url})
        if prod:
            prod["gallery"] = kept

    def write(name, tpl, **extra):
        html = env.get_template(tpl).render(**data, **extra)
        (DIST_DIR / name).write_text(html, encoding="utf-8")
        print(f"  [OK] {name}")

    write("index.html", "index.html.j2", page="home")
    write("projects.html", "projects.html.j2", page="projects")
    projects = data["projects"]
    for i, p in enumerate(projects):
        write(f"project-{p['id']}.html", "project.html.j2", page="projects", project=p,
              prev_p=projects[i - 1] if i > 0 else None,
              next_p=projects[i + 1] if i < len(projects) - 1 else None)
    write("conclusion.html", "conclusion.html.j2", page="conclusion")


def main():
    all_ids = sorted(d.name for d in STUDENTS_DIR.iterdir() if (d / "data.yaml").exists())
    if len(sys.argv) > 1:
        student_id = sys.argv[1]
    elif len(all_ids) == 1:
        student_id = all_ids[0]
    else:
        sys.exit(f"Có {len(all_ids)} sinh viên trong students/: {all_ids} — hãy chỉ định 1 người.")
    if student_id not in all_ids:
        sys.exit(f"Không tìm thấy students/{student_id}/data.yaml")
    print(f"=== Rendering: {student_id} → dist/ ===")
    render_student(make_env(), student_id)


if __name__ == "__main__":
    main()
