# يقص أسئلة الأوراق وأجوبتها صورًا (مثل المقص) ويكتب ملف exam-cuts.js للعبة القص واللصق.
#   - السؤال: من الورقة الأصلية
#   - الجواب: من الورقة نفسها (الخيارات/المربع)، وإذا الجواب مو مطبوع في الورقة: من ورقة الحل (المكتوب بالأخضر)
#   - بعد الحل الصح: صورة نفس المكان من ورقة الحل (الجواب بالأخضر)
# الإحداثيات بالنقاط (pt) من أعلى الصفحة.
import json, os, subprocess, sys
from PIL import Image
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
pdfmetrics.registerFont(TTFont("Ans", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"))

SOL, OUT_IMG, OUT_JS = sys.argv[1], sys.argv[2], sys.argv[3]
SCALE = 3  # 216 dpi
os.makedirs(OUT_IMG, exist_ok=True)

# ---------- رسم الصفحات ----------
pages = {}
def render(pdf, first, last, prefix):
    subprocess.run(["pdftoppm", "-r", str(72 * SCALE), "-f", str(first), "-l", str(last), "-png", pdf, prefix], check=True)

tmp = os.path.join(SOL, "render")
os.makedirs(tmp, exist_ok=True)
render(f"{SOL}/src/A.pdf", 1, 2, f"{tmp}/A")
render(f"{SOL}/src/C.pdf", 1, 1, f"{tmp}/C")
render(f"{SOL}/src/B.pdf", 1, 2, f"{tmp}/B")
render(f"{SOL}/out.pdf", 1, 5, f"{tmp}/S")
def load(name):
    return Image.open(f"{tmp}/{name}.png").convert("RGB")
pages = {"A1": load("A-1"), "A2": load("A-2"), "C1": load("C-1"), "B1": load("B-1"), "B2": load("B-2"),
         "SA1": load("S-1"), "SA2": load("S-2"), "SC1": load("S-3"), "SB1": load("S-4"), "SB2": load("S-5")}

count = 0
def cut(page, rect, name, pad=2):
    global count
    x0, y0, x1, y1 = rect
    x0, y0, x1, y1 = x0 - pad, y0 - pad, x1 + pad, y1 + pad
    im = pages[page].crop((round(x0 * SCALE), round(y0 * SCALE), round(x1 * SCALE), round(y1 * SCALE)))
    fn = f"{name}.webp"
    im.save(os.path.join(OUT_IMG, fn), "WEBP", quality=82, method=6)
    count += 1
    return {"s": fn, "w": round(x1 - x0, 1), "h": round(y1 - y0, 1)}

def L(x0, y0, x1, y1):  # كلمة تبدأ بقوس "(" — نشيل القوس
    return (x0 + 4.6, y0, x1, y1)
def R(x0, y0, x1, y1):  # كلمة تنتهي بقوس ")"
    return (x0, y0, x1 - 4.6, y1)

BOARDS = []
def board(paper, part, head_page, head_rect, qs, tray=None, extra=None):
    b = {"paper": paper, "part": part, "head": cut(head_page, head_rect, f"{paper}{part}-head", pad=3), "qs": qs}
    if tray:
        b["tray"] = tray
    BOARDS.append(b)

def pick(pid, page, qrect, opts, ok, solved_rect=None, solved_page=None, ctx=None, opad=3):
    """سؤال باختيارات مقصوصة من الورقة: opts = [(rect), ...] و ok = رقم الصح"""
    q = {"id": pid, "kind": "pick", "q": cut(page, qrect, f"{pid}-q"),
         "opts": [{"img": cut(page, r, f"{pid}-o{i}", pad=opad), "ok": i == ok} for i, r in enumerate(opts)]}
    q["solved"] = cut(solved_page or "S" + page, solved_rect or qrect, f"{pid}-s")
    return q

def slot(pid, page, qrect, key, solved_rect=None, ctx=None):
    """سؤال له مكان فاضي، وجوابه قطعة من الصينية المشتركة (key)"""
    q = {"id": pid, "kind": "slot", "q": cut(page, qrect, f"{pid}-q"), "ans": key}
    q["solved"] = cut("S" + page, solved_rect or qrect, f"{pid}-s")
    if ctx:
        q["ctx"] = ctx
    return q

def order(pid, page, qrect, words, target, solved_rect):
    """رتّبي: words = {"اسم": rect} بترتيب الورقة، target = الترتيب الصح"""
    pieces = {k: cut(page, r, f"{pid}-w{i}", pad=2.5) for i, (k, r) in enumerate(words.items())}
    return {"id": pid, "kind": "order", "q": cut(page, qrect, f"{pid}-q"),
            "pieces": [dict(pieces[k], k=k) for k in words], "target": target,
            "solved": cut("S" + page, solved_rect, f"{pid}-s")}

def piece(key, page, rect, name, pad=3):
    return dict(cut(page, rect, name, pad=pad), k=key)

def green(key, page, text, x, base, size, name, center=False):
    """قطعة من ورقة الحل: نفس المربع الأبيض اللي انكتب عليه الجواب الأخضر بالضبط (بدون أطراف الكلمات اللي جنبه)"""
    w = pdfmetrics.stringWidth(text, "Ans", size)
    x0 = x - w / 2 if center else x
    return dict(cut(page, (x0 - 1.2, base - size * 0.80, x0 + w + 1.2, base + size * 0.24), name, pad=0), k=key)

# =====================================================================
# الورقة الأولى (A) — صفحة 1
# =====================================================================
rows = [(191, 216), (216, 242), (242, 267), (267, 293)]
board("A", 0, "A1", (40, 143, 340, 184),
      [slot("A-g1", "A1", (36, 191, 369, 216), "a_key"),
       slot("A-g2", "A1", (36, 216, 369, 242), "a_football"),
       slot("A-g3", "A1", (36, 242, 369, 267), "a_sept"),
       slot("A-g5", "A1", (36, 267, 369, 293), "a_bed")],
      tray=[piece("a_sept", "A1", (391, 191, 534, 216), "A-a0", 0),
            piece("a_key", "A1", (391, 216, 534, 242), "A-a1", 0),
            piece("a_bed", "A1", (391, 242, 534, 267), "A-a2", 0),
            piece("a_football", "A1", (391, 267, 534, 293), "A-a3", 0)])

board("A", 1, "A1", (34, 302, 270, 343), [
    order("A-o1", "A1", (36, 355, 300, 376),
          {"weekend": (55.9, 361.5, 103.3, 373.5), "go": (115.7, 361.5, 128.5, 373.5), "shopping": (140.9, 361.5, 188.8, 373.5),
           "this": (201.4, 361.5, 223.3, 373.5), "will": (235.8, 361.5, 253.9, 373.5), "We": (266.3, 361.5, 285.3, 373.5)},
          ["We", "will", "go", "shopping", "this", "weekend"], (36, 377, 561, 398)),
    order("A-o2", "A1", (36, 400, 220, 424),
          {"His": (61.5, 403.0, 79.8, 415.0), "not": (92.2, 403.0, 110.3, 415.0), "tidy": (122.9, 403.0, 145.3, 415.0),
           "room": (157.8, 403.0, 185.3, 415.0), "is": (197.8, 403.0, 207.0, 415.0)},
          ["His", "room", "is", "not", "tidy"], (36, 426, 561, 452))])

tick, cross = (188.5, 205.0), (259.5, 277.6)
tf_rows = [((499, 560), (524.9, 546.9), 1), ((560, 624), (586.6, 608.6), 1), ((624, 697), (650.4, 672.5), 0), ((697, 777), (723.2, 745.3), 1)]
board("A", 2, "A1", (52, 452, 240, 491), [
    pick(f"A-t{i+1}", "A1", (108, r0, 487, r1), [(tick[0], s0, tick[1], s1), (cross[0], s0, cross[1], s1)], ok)
    for i, ((r0, r1), (s0, s1), ok) in enumerate(tf_rows)])

# صفحة 2
board("A", 3, "A2", (52, 36, 255, 74), [
    pick("A-tm1", "A2", (48, 79, 410, 98), [(164.2, 81.6, 193.8, 95.5), (213.2, 81.6, 258.5, 95.5)], 1),
    pick("A-tm2", "A2", (48, 99, 380, 117), [(229.3, 101.3, 250.4, 115.2), (269.9, 101.3, 293.8, 115.2)], 0),
    pick("A-tm3", "A2", (48, 118, 350, 137), [(117.9, 120.8, 133.4, 134.7), (149.1, 120.8, 169.3, 134.7)], 1),
    pick("A-cp1", "A2", (48, 138, 320, 156), [(131.8, 140.2, 168.3, 154.1), (187.8, 140.2, 231.0, 154.1)], 0)])

cols = [(90, 198), (198, 299), (299, 395), (395, 505)]
board("A", 4, "A2", (34, 184, 506, 273),
      [slot(f"A-v{i+1}", "A2", (x0, 284, x1, 410), k) for i, ((x0, x1), k) in enumerate(zip(cols, ["ride", "snail", "layout", "Gate"]))],
      tray=[piece("Gate", "A2", (192.3, 246.2, 227.8, 262.3), "A-vb0"), piece("ride", "A2", (244.7, 246.2, 274.8, 262.3), "A-vb1"),
            piece("layout", "A2", (291.5, 246.2, 336.5, 262.3), "A-vb2"), piece("snail", "A2", (352.7, 246.2, 386.1, 262.3), "A-vb3")])

cols = [(50, 171), (171, 305), (305, 426), (426, 540)]
board("A", 5, "A2", (34, 449, 470, 492),
      [slot(f"A-sp{i+1}", "A2", (x0, 518, x1, 653), k) for i, ((x0, x1), k) in enumerate(zip(cols, ["e", "i", "u", "o"]))],
      tray=[piece("i", "A2", (322.6, 469.0, 331.1, 485.0), "A-sb0", 5), piece("o", "A2", (350.3, 469.0, 358.8, 485.0), "A-sb1", 5),
            piece("e", "A2", (379.6, 469.0, 388.6, 485.0), "A-sb2", 5), piece("u", "A2", (409.4, 469.0, 417.7, 485.0), "A-sb3", 5)])

# =====================================================================
# الورقة الثانية (C)
# =====================================================================
board("C", 0, "C1", (20, 125, 165, 141), [
    pick("C-g3", "C1", (70, 162, 385, 182), [(107.9, 183.0, 232.0, 198.3), (357.2, 184.2, 455.0, 198.3)], 0, solved_rect=(70, 162, 500, 200)),
    pick("C-g2", "C1", (70, 199, 270, 217), [(104.8, 219.0, 192.0, 235.0), (353.8, 219.0, 496.0, 235.0)], 1, solved_rect=(70, 199, 505, 237))])

board("C", 1, "C1", (20, 253, 120, 269), [
    pick("C-t5", "C1", (55, 272, 222, 349), [(89.1, 351.2, 99.8, 365.2), (156.7, 351.2, 165.8, 365.2)], 0, solved_rect=(55, 272, 222, 368)),
    pick("C-t6", "C1", (226, 272, 420, 349), [(260.0, 351.2, 269.0, 365.2), (332.4, 351.2, 343.1, 365.2)], 1, solved_rect=(226, 272, 420, 368)),
    pick("C-t7", "C1", (425, 272, 563, 349), [(454.1, 351.2, 464.8, 365.2), (521.6, 351.2, 530.7, 365.2)], 1, solved_rect=(425, 272, 563, 368))])

un_ctx = cut("C1", (25, 428, 215, 448), "C-un-ctx")
board("C", 2, "C1", (20, 382, 186, 398), [
    order("C-mo6", "C1", (25, 401, 325, 420),
          {"April": (45.2, 403.9, 72.2, 417.9), "march": (85.5, 403.9, 121.5, 417.9),
           "February": (134.8, 403.9, 185.7, 417.9), "January": (202.1, 403.9, 246.0, 417.9)},
          ["January", "February", "march", "April"], (25, 401, 575, 421)),
    slot("C-un1", "C1", (240, 429, 277, 448), "unlucky", solved_rect=(240, 429, 440, 448), ctx=un_ctx),
    slot("C-un2", "C1", (286, 429, 324, 448), "unclean", solved_rect=(286, 429, 560, 448), ctx=un_ctx)],
    tray=[green("unlucky", "SC1", "unlucky", 386, 444, 12.5, "C-unA", True), green("unclean", "SC1", "unclean", 503, 444, 12.5, "C-unB", True)])

board("C", 3, "C1", (20, 459, 153, 475), [
    pick("C-h2", "C1", (45, 489, 290, 507), [(372.7, 491.6, 427.8, 505.7), (471.7, 491.6, 534.2, 505.7)], 1, solved_rect=(45, 488, 560, 508)),
    pick("C-tm6", "C1", (45, 517, 330, 536), [(382.3, 520.3, 418.1, 534.3), (446.7, 520.3, 491.6, 534.3), (508.3, 520.3, 556.2, 534.3)], 1, solved_rect=(45, 516, 560, 537)),
    pick("C-tm7", "C1", (45, 544, 205, 563), [(382.1, 547.3, 403.0, 561.3), (436.2, 547.3, 483.5, 561.3), (523.1, 547.3, 541.4, 561.3)], 0, solved_rect=(45, 543, 560, 564))])

ccols = [(39, 124), (124, 217), (217, 329), (329, 408), (408, 493), (493, 571)]
okrow = [0, 0, 0, 0, 1, 0]   # screen في الصف الثاني
board("C", 4, "C1", (20, 571, 153, 587), [
    pick(f"C-w{i+1}", "C1", (x0, 596, x1, 639), [(x0 + 2, 639, x1 - 2, 657), (x0 + 2, 657, x1 - 2, 675)], okrow[i], solved_rect=(x0, 596, x1, 675))
    for i, (x0, x1) in enumerate(ccols)])

lcols = [(120, 248), (248, 376), (376, 489)]
lok = [1, 0, 0]  # r · g · k
board("C", 5, "C1", (20, 675, 248, 691), [
    pick(f"C-sp{i+5}", "C1", (x0, 704, x1, 757), [(x0 + 30, 759.5, x1 - 30, 774.5), (x0 + 30, 777, x1 - 30, 791.5)], lok[i], solved_rect=(x0, 704, x1, 792), opad=1)
    for i, (x0, x1) in enumerate(lcols)])

# =====================================================================
# الورقة الثالثة (B) — صفحة 1
# =====================================================================
brow = [(157, 183), (183, 209), (209, 235), (235, 261), (261, 287), (287, 313)]
bkeys = ["b_sept", "b_bday", "b_150", "b_six", "b_ali", "b_30"]
board("B", 0, "B1", (34, 112, 365, 147),
      [slot("B-g6", "B1", (43, 157, 347, 183), "b_ali"), slot("B-g4", "B1", (43, 183, 347, 209), "b_sept"),
       slot("B-g7", "B1", (43, 209, 347, 235), "b_30"), slot("B-g8", "B1", (43, 235, 347, 261), "b_150"),
       slot("B-g9", "B1", (43, 261, 347, 287), "b_bday"), slot("B-g10", "B1", (43, 287, 347, 313), "b_six")],
      tray=[piece(k, "B1", (380, r0, 546, r1), f"B-a{i}", 0) for i, (k, (r0, r1)) in enumerate(zip(bkeys, brow))])

board("B", 1, "B1", (34, 312, 330, 347), [
    order("B-o3", "B1", (120, 348, 325, 366),
          {"long": (144.1, 350.4, 167.1, 363.4), "was": (177.1, 350.4, 197.3, 363.4),
           "your vacation?": (207.6, 350.4, 284.1, 363.4), "How": (294.4, 350.4, 319.6, 363.4)},
          ["How", "long", "was", "your vacation?"], (140, 366, 380, 382)),
    order("B-o4", "B1", (120, 383, 342, 400),
          {"December": (144.1, 385.0, 197.3, 398.0), "My favourite": (207.6, 385.0, 275.5, 398.0),
           "is": (285.8, 385.0, 294.5, 398.0), "month": (304.8, 385.0, 337.6, 398.0)},
          ["My favourite", "month", "is", "December"], (140, 400, 380, 416)),
    order("B-o5", "B1", (120, 417, 320, 434),
          {"the biggest": (144.1, 419.3, 200.4, 432.3), "is": (210.7, 419.3, 219.4, 432.3),
           "This": (229.4, 419.3, 252.5, 432.3), "classroom": (262.8, 419.3, 315.3, 432.3)},
          ["This", "is", "the biggest", "classroom"], (140, 434, 380, 450))])

board("B", 2, "B1", (392, 334, 552, 369),
      [slot("B-op1", "B1", (392, 376, 535, 394), "late"), slot("B-op2", "B1", (392, 394, 550, 411), "easy"),
       slot("B-op3", "B1", (392, 411, 535, 428), "big")],
      tray=[green("late", "SB1", "late", 452, 389, 12, "B-opA"), green("easy", "SB1", "easy", 468, 406.5, 12, "B-opB"),
            green("big", "SB1", "big", 454, 423.5, 12, "B-opC")])

board("B", 3, "B1", (88, 459, 430, 524),
      [slot("B-mo1", "B1", (127, 531, 298, 554), "March", solved_rect=(127, 531, 298, 554)),
       slot("B-mo2", "B1", (298, 531, 469, 554), "April"),
       slot("B-mo3", "B1", (381, 531, 554, 554), "June"),
       slot("B-mo4", "B1", (40, 554, 212, 576), "August"),
       slot("B-mo5", "B1", (298, 554, 469, 576), "November")],
      tray=[piece("August", "B1", (176.7, 509.8, 216.3, 522.8), "B-mbA", 2), piece("November", "B1", (229.5, 509.8, 286.9, 522.8), "B-mbB", 2),
            piece("March", "B1", (299.9, 509.8, 337.3, 522.8), "B-mbC", 2), piece("June", "B1", (350.3, 509.8, 376.7, 522.8), "B-mbD", 2),
            piece("April", "B1", (389.9, 509.8, 419.4, 522.8), "B-mbE", 2)])

board("B", 4, "B1", (40, 576, 554, 622),
      [slot("B-p1", "B1", (40, 622, 212, 640), "bought"), slot("B-p2", "B1", (40, 640, 212, 658), "go"),
       slot("B-p3", "B1", (212, 622, 381, 640), "woke up"), slot("B-p4", "B1", (212, 640, 381, 658), "took"),
       slot("B-p5", "B1", (381, 622, 554, 640), "make"), slot("B-p6", "B1", (381, 640, 554, 658), "is/am/are")],
      tray=[green("bought", "SB1", "bought", 169, 635, 11.5, "B-pA", True), green("go", "SB1", "go", 83, 653, 11.5, "B-pB", True),
            green("woke up", "SB1", "woke up", 340.5, 635, 11.5, "B-pC", True), green("took", "SB1", "took", 340.5, 653, 11.5, "B-pD", True),
            green("make", "SB1", "make", 426.5, 635, 11.5, "B-pE", True), green("is/am/are", "SB1", "is/am/are", 426.5, 653, 11.5, "B-pF", True)])

pcols = [(40, 171), (171, 298), (298, 412), (412, 554)]
pok = [1, 1, 1, 0]
board("B", 5, "B1", (33, 657, 455, 692), [
    pick(f"B-s{i+1}", "B1", (x0, 696, x1, 767), [(x0 + 1, 768.3, x1 - 1, 781.6), (x0 + 1, 783.4, x1 - 1, 796)], pok[i], solved_rect=(x0, 696, x1, 797), opad=1)
    for i, (x0, x1) in enumerate(pcols)])

# صفحة 2
ccols2 = [(36, 158), (158, 299), (299, 433), (433, 560)]
board("B", 6, "B2", (34, 34, 540, 83),
      [slot(f"B-c{i+1}", "B2", (x0, 86, x1, 214), k) for i, ((x0, x1), k) in enumerate(zip(ccols2, ["lion", "comic book", "snail", "calendar"]))],
      tray=[piece("comic book", "B2", (206.5, 60.5, 264.7, 72.5), "B-cbA"), piece("calendar", "B2", (276.8, 60.5, 321.5, 72.5), "B-cbB"),
            piece("lion", "B2", (333.2, 60.5, 352.4, 72.5), "B-cbC"), piece("snail", "B2", (364.7, 60.5, 388.6, 72.5), "B-cbD")])

gl = [(267.8, 280.8), (285.1, 298.1), (302.2, 315.1), (319.5, 332.4), (336.7, 349.7), (353.8, 366.7), (371.1, 384.0), (388.1, 401.1)]
def gopts(i):
    y0, y1 = gl[i]
    if i < 4:
        return [L(144.1, y0, 174.3, y1)[0:1] + (y0, 208.3, y1), R(221.6, y0, 279.0, y1)]
    return {
        4: [L(151.5, y0, 172.4, y1), (185.6, y0, 202.1, y1), R(213.2, y0, 251.1, y1)],
        5: [L(174.1, y0, 199.0, y1), (212.5, y0, 238.6, y1), R(252.1, y0, 300.1, y1)],
        6: [L(193.8, y0, 216.1, y1), (229.1, y0, 258.6, y1), R(271.5, y0, 309.0, y1)],
        7: [L(201.7, y0, 249.6, y1), (263.1, y0, 338.5, y1), R(352.0, y0, 429.7, y1)],
    }[i]
gok = [1, 0, 1, 0, 1, 0, 2, 2]
gid = ["h1", "h2", "h3", "h4", "tm4", "tm5", "cp2", "cp3"]
board("B", 7, "B2", (38, 230, 260, 265), [
    pick(f"B-{gid[i]}", "B2", (122, gl[i][0] - 2, 505, gl[i][1] + 2), gopts(i), gok[i]) for i in range(8)])

vcols = [(36, 141), (141, 246), (246, 350), (350, 455), (455, 560)]
board("B", 8, "B2", (33, 421, 400, 477),
      [slot(f"B-v{i+5}", "B2", (x0, 482, x1, 569), k) for i, ((x0, x1), k) in enumerate(zip(vcols, ["date", "classroom", "months", "late", "plus"]))],
      tray=[piece("months", "B2", (198.3, 462.3, 236.3, 474.3), "B-vbA"), piece("late", "B2", (248.5, 462.3, 267.0, 474.3), "B-vbB"),
            piece("date", "B2", (279.2, 462.3, 301.3, 474.3), "B-vbC"), piece("plus", "B2", (313.1, 462.3, 334.3, 474.3), "B-vbD"),
            piece("classroom", "B2", (346.5, 462.3, 397.5, 474.3), "B-vbE")])

ocols = [(36, 114), (114, 185), (185, 257), (257, 334), (334, 405), (405, 476), (476, 546)]
oletters = ["a", "b", "i", "t", "r", "c", "n"]
ocx = [73.25, 151.5, 213.25, 301.4, 376.0, 420.9, 507.05]
board("B", 9, "B2", (28, 588, 250, 622),
      [slot(f"B-sb{i+1}", "B2", (x0, 632, x1, 720), oletters[i]) for i, (x0, x1) in enumerate(ocols)],
      tray=[green(l, "SB2", l, cx, 712, 14, f"B-ol{i}", True) for i, (l, cx) in enumerate(zip(oletters, ocx))])

with open(OUT_JS, "w", encoding="utf-8") as f:
    f.write("// مولَّد آليًا من scripts/cut.py — قطع الأسئلة والأجوبة من أوراق الاختبار (لا تعدّله باليد)\n")
    f.write('export const CUT_BASE = "/assets/img/exams/tg2/cut/";\n')
    f.write("export const BOARDS = " + json.dumps(BOARDS, ensure_ascii=False, indent=1) + ";\n")
print("boards", len(BOARDS), "images", count)
