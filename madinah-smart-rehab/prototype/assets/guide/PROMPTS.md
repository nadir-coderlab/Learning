# الصور التوضيحية لأدوات القياس

ثماني صور، لكل وضعية صورة. ولّدها بأي أداة صور (ChatGPT، Midjourney، …) ثم احفظ كل صورة
بالاسم المذكور داخل هذا المجلد (`prototype/assets/guide/`). المنصة تعرضها تلقائيًا بدل الرسم
التخطيطي المضمّن؛ إذا لم يوجد الملف يبقى الرسم التخطيطي.

المواصفات: نسبة 4:3، عرض 1600 بكسل، صيغة PNG أو JPG، **بدون أي نص داخل الصورة** (النص
العربي تضيفه المنصة)، ونفس الشخصية والأسلوب في كل الصور.

## أسلوب موحّد (ألصقه في بداية كل برومبت)

```
Clean flat vector illustration, minimal medical-education style, soft off-white background (#F4F5F2),
thin dark ink outlines (#15201C), one accent color deep green (#176B50) for the phone screen and camera
sight line, warm amber (#C2792A) for the measured leg, muted sand for furniture. A single adult figure
in modest athletic wear (loose t-shirt, knee-length shorts), gender-neutral, no face detail. Side view
unless stated. Phone shown as a simple rounded rectangle on a small stand. Dashed line from the phone
camera to the knee. No text, no labels, no numbers, no watermark. Aspect ratio 4:3.
```

## البرومبتات

### 1. `knee-flexion-side.png` — ثني الركبة من الجانب
```
[style] Person lying on their back on an exercise mat, seen exactly from the side, the near knee bent
to about 90 degrees with the foot flat on the mat, the other leg straight. A smartphone stands upright
on a chair at knee height about two meters away, screen facing the person. Dashed sight line from the
phone to the knee. Full leg visible from hip to ankle.
```

### 2. `knee-extension-heel-prop.png` — فرد الركبة والكعب على لفافة
```
[style] Person lying on their back on a mat, seen from the side, the near leg straight with the heel
resting on a rolled towel so the knee hangs slightly above the mat, relaxed. Smartphone upright on a
chair at knee height about two meters away, dashed sight line to the knee.
```

### 3. `phone-inclinometer.png` — الجوال كمنقلة
```
[style] Person sitting on the edge of a bed, seen from the side, the knee bent. A smartphone lies flat
along the top of the thigh (long edge along the thigh bone, screen facing up and outward); a second,
faded ghost copy of the phone lies along the front of the shin. Two small curved arrows show the tilt
of the thigh and the shin. No camera stand in this image.
```

### 4. `straight-leg-raise.png` — رفع الساق مستقيمة
```
[style] Person lying on their back on a mat, seen from the side, the near leg raised straight about
30 degrees off the mat with the knee locked, the other knee bent with the foot flat. Smartphone upright
on a chair at hip height about two meters away, dashed sight line to the raised knee. Whole body visible.
```

### 5. `squat-side.png` — القرفصاء من الجانب
```
[style] Person standing in profile doing a shallow squat, knees bent about 60 degrees, arms forward,
heels on the floor, whole body visible from head to feet. Smartphone upright on a chair at knee height
about two meters away, dashed sight line to the knee.
```

### 6. `knee-valgus-front.png` — اتجاه الركبة من الأمام
```
[style] Person facing the viewer, standing in a shallow squat, both legs fully visible from hips to
feet, knees tracking straight over the feet. Smartphone upright on a chair at knee height in the
foreground between the viewer and the person, dashed sight line to the knees. Front view.
```

### 7. `wound-photo.png` — صورة الجرح
```
[style] Close view of a bent knee with a short, clean, healed-looking surgical incision below the
kneecap, a hand holding a smartphone about 25 cm away pointing at the knee, a window with daylight
in the background. No flash, no blood, calm and clinical.
```

### 8. `knee-girth-tape.png` — محيط الركبة
```
[style] A straight relaxed leg on a bed, seen from the side-front, a soft measuring tape wrapped
around the knee exactly at the middle of the kneecap, a hand reading the tape. Simple, calm.
```

## بعد التوليد

1. احفظ كل ملف بالاسم المذكور في `prototype/assets/guide/`.
2. إن أردت نسخة بشخصية أنثوية بلباس محتشم، أضف `female figure in modest long-sleeved sportswear and head covering` بعد `[style]` واحفظها بنفس الاسم مع لاحقة `-f` (مثال `knee-flexion-side-f.png`)؛ ستُستخدم لاحقًا حسب ملف المريض.
