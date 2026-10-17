# يكتب الحل على أوراق الاختبار الثلاث (بالأخضر: كتابة، دوائر، توصيل) ويدمجها بنفس الترتيب في ملف واحد.
# الإحداثيات بنظام pdfplumber (الأعلى = 0)، وتتحول لنظام reportlab داخل الدوال.
import io, sys
from pypdf import PdfReader, PdfWriter
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.colors import HexColor

SRC, OUT = sys.argv[1], sys.argv[2]
pdfmetrics.registerFont(TTFont("Ans", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"))
GREEN = HexColor("#0f8a3c")
GREEN_FILL = HexColor("#e6f7ec")


class Ink:
    def __init__(self, c, H):
        self.c, self.H = c, H
        c.setStrokeColor(GREEN)
        c.setFillColor(GREEN)

    def y(self, top):
        return self.H - top

    def text(self, x, base, s, size=12, center=False, bg=False):
        c = self.c
        c.setFont("Ans", size)
        w = pdfmetrics.stringWidth(s, "Ans", size)
        x0 = x - w / 2 if center else x
        if bg:  # خلفية بيضاء خفيفة حتى ما يختلط الحل بالنقاط
            c.setFillColorRGB(1, 1, 1)
            c.rect(x0 - 2, self.y(base) - size * 0.28, w + 4, size * 1.12, stroke=0, fill=1)
            c.setFillColor(GREEN)
        c.drawString(x0, self.y(base), s)
        return w

    def ring(self, x0, top, x1, bottom, padx=4, pady=3, lw=1.8):
        c = self.c
        c.setLineWidth(lw)
        c.ellipse(x0 - padx, self.y(bottom) - pady, x1 + padx, self.y(top) + pady, stroke=1, fill=0)

    def line(self, x0, t0, x1, t1, lw=1.4, dash=None):
        c = self.c
        c.setLineWidth(lw)
        if dash:
            c.setDash(*dash)
        c.line(x0, self.y(t0), x1, self.y(t1))
        c.setDash()

    def badge(self, x, top_mid, n, r=7.5):
        c = self.c
        c.setLineWidth(1.4)
        c.setFillColor(GREEN_FILL)
        c.circle(x, self.y(top_mid), r, stroke=1, fill=1)
        c.setFillColor(GREEN)
        c.setFont("Ans", 10)
        c.drawCentredString(x, self.y(top_mid) - 3.6, str(n))

    def stamp(self, x, top, s):
        c = self.c
        c.setFont("Ans", 9)
        w = pdfmetrics.stringWidth(s, "Ans", 9)
        c.setLineWidth(1.2)
        c.setFillColor(GREEN_FILL)
        c.roundRect(x - w - 10, self.y(top) - 13, w + 12, 16, 4, stroke=1, fill=1)
        c.setFillColor(GREEN)
        c.drawString(x - w - 4, self.y(top) - 8.5, s)

    def match(self, q_end_x, q_mid, box_x, a_mid, n):
        # رقم السؤال داخل دائرة في المربع اللي جنب جوابه (نفس طريقة الحل في الورقة)
        self.badge(box_x, a_mid, n)


def mid(top, bottom):
    return (top + bottom) / 2


# ---------------------------------------------------------------
# نموذج ١ (وزارة) — صفحتان
# ---------------------------------------------------------------
def A1(k):
    k.stamp(560, 18, "ANSWER KEY")
    # المطابقة: رقم السؤال في المربع جنب جوابه
    rows = {1: (195.6, 207.6), 2: (221.0, 233.0), 3: (246.7, 258.7), 4: (272.2, 284.2)}
    pairs = [(3, 1), (1, 2), (4, 3), (2, 4)]  # (رقم السؤال، صف الجواب)
    for q, a in pairs:
        k.match(364, mid(*rows[q]), 381, mid(*rows[a]), q)
    # الترتيب
    k.text(62, 393, "We will go shopping this weekend.", 13, bg=True)
    k.text(62, 444, "His room is not tidy.", 13, bg=True)
    # صح / خطأ: ✓ x≈188-205 · ✗ x≈259-278
    tick, cross = (188.5, 205.0), (259.5, 277.6)
    for (top, bottom), ok, note in [
        ((524.9, 546.9), False, "folding paper"),
        ((586.6, 608.6), False, "12 months"),
        ((650.4, 672.5), True, ""),
        ((723.2, 745.3), False, "engineer"),
    ]:
        x0, x1 = tick if ok else cross
        k.ring(x0, top, x1, bottom, padx=6, pady=3)
        if note:  # تصحيح صغير يسار علامة ✓
            k.text(116, bottom - 7, note, 7.5)


def A2(k):
    k.stamp(560, 18, "ANSWER KEY")
    # القواعد: دائرة على الصح
    k.ring(213.2, 81.6, 258.5, 95.5)      # cooked
    k.ring(229.3, 101.3, 250.4, 115.2)    # will
    k.ring(149.1, 120.8, 169.3, 134.7)    # did
    k.ring(131.8, 140.2, 168.3, 154.1)    # taller
    # المفردات تحت الصور
    for cx, w in [(144, "ride"), (248, "snail"), (347, "layout"), (450, "Gate")]:
        k.text(cx, 404, w, 14, center=True)
    # الإملاء
    for cx, l in [(120.2, "e"), (222.3, "i"), (351.0, "u"), (486.6, "o")]:
        k.text(cx, 644, l, 17, center=True, bg=True)


# ---------------------------------------------------------------
# نموذج ٢ (مدرستي) — صفحة واحدة
# ---------------------------------------------------------------
def C1(k):
    k.stamp(150, 62, "ANSWER KEY")
    k.ring(107.9, 184.2, 227.0, 198.3, padx=11)  # A. In September 23rd.
    k.ring(353.8, 220.1, 495.4, 234.2, padx=11)  # B. playing video games
    # ✓ / ✗
    k.ring(89.1, 351.2, 99.8, 365.2, padx=6, pady=3)     # 122 ✓
    k.ring(332.4, 351.2, 343.1, 365.2, padx=6, pady=3)   # exercise ✓
    k.ring(521.6, 351.2, 530.7, 365.2, padx=6, pady=3)   # dance ✗ (he is sleeping)
    # Do as shown
    k.text(330, 416, "January - February - March - April", 11, bg=True)
    k.text(386, 444, "unlucky", 12.5, center=True, bg=True)
    k.text(503, 444, "unclean", 12.5, center=True, bg=True)
    # Choose the correct word
    k.text(97, 503, "How many", 11.5, center=True, bg=True)
    k.ring(471.7, 491.6, 534.2, 505.7)
    k.text(110, 532, "painted", 11.5, center=True, bg=True)
    k.ring(446.7, 520.3, 491.6, 534.3)
    k.text(103, 559, "will", 11.5, center=True, bg=True)
    k.ring(382.1, 547.3, 403.0, 561.3)
    # الصور: دائرة على الكلمة الصح
    k.ring(67.1, 642.2, 91.0, 656.3)       # Lion
    k.ring(142.7, 642.2, 192.3, 656.3)     # Rainbow
    k.ring(247.7, 642.2, 293.1, 656.3)     # horrible
    k.ring(342.1, 642.2, 389.8, 656.3)     # reporter
    k.ring(428.9, 659.8, 466.2, 673.8)     # screen
    k.ring(513.6, 642.2, 540.6, 656.3)     # Gate
    # الحرف الناقص
    k.ring(182.0, 778.0, 187.0, 792.0, padx=6, pady=2)   # r
    k.ring(308.8, 760.0, 315.5, 774.0, padx=6, pady=2)   # g
    k.ring(429.3, 760.0, 436.1, 774.0, padx=6, pady=2)   # k
    for cx, l in [(175.7, "r"), (309.4, "g"), (428.0, "k")]:
        k.text(cx, 751, l, 13, center=True, bg=True)


# ---------------------------------------------------------------
# ورقة المراجعة — صفحتان
# ---------------------------------------------------------------
def B1(k):
    k.stamp(560, 108, "ANSWER KEY")
    rows = {1: (159.1, 172.0), 2: (185.0, 198.0), 3: (210.9, 223.9), 4: (236.9, 249.8), 5: (262.8, 275.7), 6: (288.7, 301.7)}
    pairs = [(2, 1), (5, 2), (4, 3), (6, 4), (1, 5), (3, 6)]
    for q, a in pairs:
        k.match(349, mid(*rows[q]), 363, mid(*rows[a]), q)
    # الترتيب
    k.text(146, 378, "How long was your vacation?", 12, bg=True)
    k.text(146, 412.5, "My favourite month is December.", 12, bg=True)
    k.text(146, 446.5, "This is the biggest classroom.", 12, bg=True)
    # العكس
    k.text(452, 389, "late", 12, bg=True)
    k.text(468, 406.5, "easy", 12, bg=True)
    k.text(454, 423.5, "big", 12, bg=True)
    # الشهور
    for cx, base, m in [(258.8, 543, "March"), (345.5, 543, "April"), (520.5, 543, "June"), (173.6, 566, "August"), (436.5, 566, "November")]:
        k.text(cx, base, m, 10 if m == "November" else 11.5, center=True, bg=True)
    # دائرة على الشهور في المربع
    for x0, x1 in [(176.7, 216.3), (229.5, 286.9), (299.9, 337.3), (350.3, 376.7), (389.9, 419.4)]:
        k.ring(x0, 509.8, x1, 522.8, padx=3, pady=1, lw=1.1)
    # جدول الماضي
    for cx, base, w in [(169, 635, "bought"), (340.5, 635, "woke up"), (426.5, 635, "make"),
                        (83, 653, "go"), (340.5, 653, "took"), (426.5, 653, "is/am/are")]:
        k.text(cx, base, w, 11.5, center=True)
    # الجملة والصورة
    k.ring(41.8, 783.8, 139.1, 795.8, padx=3, pady=2)   # b- tired
    k.ring(176.2, 783.8, 280.0, 795.8, padx=3, pady=2)  # b- thousand
    k.ring(303.7, 783.8, 397.5, 795.8, padx=3, pady=2)  # b- mountain
    k.ring(417.3, 768.9, 550.7, 780.9, padx=3, pady=2)  # a- food festival


def B2(k):
    k.stamp(560, 18, "ANSWER KEY")
    # اقري وكمّلي
    for cx, w in [(98.2, "lion"), (227.8, "comic book"), (365.9, "snail"), (505.9, "calendar")]:
        k.text(cx, 208.5, w, 12, center=True, bg=True)
    # القواعد
    k.ring(221.6, 267.8, 276.0, 280.8)   # How long
    k.ring(148.0, 285.1, 208.3, 298.1)   # How many
    k.ring(221.6, 302.2, 276.0, 315.1)   # How long
    k.ring(148.0, 319.5, 208.3, 332.4)   # How many
    k.ring(185.6, 336.7, 202.1, 349.7)   # ate
    k.ring(177.5, 353.8, 199.0, 366.7)   # met
    k.ring(271.5, 371.1, 305.5, 384.0)   # tallest
    k.ring(352.0, 388.1, 426.5, 401.1)   # most difficult
    # المفردات تحت الصور
    for cx, w in [(88.5, "date"), (193, "classroom"), (297.5, "months"), (402.5, "late"), (507.5, "plus")]:
        k.text(cx, 565, w, 13, center=True)
    # دائرة على كلمات المربع
    for x0, x1 in [(198.3, 236.3), (248.5, 267.0), (279.2, 301.3), (313.1, 334.3), (346.5, 397.5)]:
        k.ring(x0, 462.3, x1, 474.3, padx=3, pady=1, lw=1.1)
    # الإملاء (الشرطتين = حرف واحد)
    for (x0, x1), l in [((66.3, 80.2), "a"), ((144.5, 158.5), "b"), ((206.3, 220.2), "i"), ((294.8, 308.0), "t"),
                        ((369.5, 382.5), "r"), ((414.4, 427.4), "c"), ((500.6, 513.5), "n")]:
        k.text((x0 + x1) / 2, 712, l, 14, center=True, bg=True)


PLAN = [("A", [A1, A2]), ("C", [C1]), ("B", [B1, B2])]

writer = PdfWriter()
for name, fns in PLAN:
    reader = PdfReader(f"{SRC}/{name}.pdf")
    for page, fn in zip(reader.pages, fns):
        W, H = float(page.mediabox.width), float(page.mediabox.height)
        buf = io.BytesIO()
        c = canvas.Canvas(buf, pagesize=(W, H))
        fn(Ink(c, H))
        c.save()
        buf.seek(0)
        page.merge_page(PdfReader(buf).pages[0])
        writer.add_page(page)

writer.add_metadata({"/Title": "Top Goal 2 — First Period Exam — Answer Key"})
with open(OUT, "wb") as f:
    writer.write(f)
print("ok", len(writer.pages), "pages")
