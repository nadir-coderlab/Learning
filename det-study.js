(function () {
  "use strict";

  const CATEGORIES = {
    academic: "أكاديمي عام",
    thinking: "الرأي والحجج",
    education: "التعليم والتعلم",
    work: "العمل والقيادة",
    technology: "التقنية",
    environment: "البيئة والمدن",
    health: "الصحة ونمط الحياة",
    society: "المجتمع والثقافة",
    travel: "السفر والحياة اليومية",
    photo: "وصف الصور"
  };

  const VOCAB_ROWS = `
academic|approach|نهج أو طريقة|We need a practical approach to solve the problem.
academic|achieve|يحقق|Regular practice can help students achieve their goals.
academic|affect|يؤثر في|Poor sleep can affect concentration.
academic|analyze|يحلل|Researchers analyze the results carefully.
academic|assume|يفترض|We should not assume that one solution fits everyone.
academic|beneficial|مفيد|Daily reading is beneficial for language learners.
academic|challenge|تحد أو صعوبة|Learning a new skill can be a rewarding challenge.
academic|contribute|يسهم|Public parks contribute to healthier cities.
academic|decline|ينخفض أو تراجع|The number of visitors began to decline.
academic|demonstrate|يوضح أو يبرهن|This example demonstrates the value of teamwork.
academic|develop|يطور|People develop confidence through repeated practice.
academic|enhance|يعزز|Technology can enhance access to education.
academic|establish|ينشئ أو يثبت|The team established a clear process.
academic|evaluate|يقيم|Managers should evaluate both risks and benefits.
academic|evidence|دليل|There is strong evidence that exercise improves health.
academic|factor|عامل|Cost is an important factor in this decision.
academic|focus|يركز|Students should focus on clear communication.
academic|impact|أثر|Social media has a major impact on daily life.
academic|indicate|يشير|The results indicate a clear improvement.
academic|issue|قضية أو مشكلة|Traffic is a serious issue in large cities.
academic|maintain|يحافظ على|It is difficult to maintain a healthy routine.
academic|method|طريقة|This method saves time and reduces errors.
academic|obtain|يحصل على|Students can obtain information online.
academic|occur|يحدث|Unexpected problems can occur at any time.
academic|provide|يوفر|Libraries provide a quiet place to study.
academic|require|يتطلب|Success requires patience and consistent effort.
academic|respond|يستجيب|The team responded quickly to the emergency.
academic|result|نتيجة|Careful planning usually leads to better results.
academic|significant|مهم أو ملحوظ|The project produced a significant improvement.
academic|solution|حل|We need a solution that is simple and sustainable.
thinking|agree|يوافق|I agree that communication should be taught at school.
thinking|disagree|لا يوافق|I disagree because the policy may limit choice.
thinking|argument|حجة أو رأي مدعوم|A strong argument includes reasons and examples.
thinking|claim|يدعي أو زعم|The article claims that remote work saves time.
thinking|compare|يقارن|It is useful to compare both options before deciding.
thinking|contrast|يبرز الاختلاف|The report contrasts urban and rural lifestyles.
thinking|consequence|نتيجة مترتبة|Every major decision has a consequence.
thinking|consider|يفكر في أو يراعي|We should consider the needs of different groups.
thinking|convince|يقنع|Specific evidence can convince the reader.
thinking|decision|قرار|Making a difficult decision requires clear priorities.
thinking|despite|رغم|Despite the pressure the team remained calm.
thinking|however|لكن أو مع ذلك|The idea is useful. However it may be expensive.
thinking|likely|من المحتمل|Online learning is likely to become more common.
thinking|opinion|رأي|In my opinion public transport should be improved.
thinking|perspective|وجهة نظر|Travel can change a person's perspective.
thinking|prefer|يفضل|I prefer learning through practical examples.
thinking|reason|سبب|There are several reasons to support this view.
thinking|relevant|ذو صلة|Your example must be relevant to the question.
thinking|support|يدعم|Facts and examples support the main idea.
thinking|therefore|لذلك|The road was closed. Therefore we chose another route.
thinking|whereas|بينما للمقارنة|Cities are busy whereas villages are usually quieter.
thinking|advantage|ميزة|Flexibility is a major advantage of online learning.
thinking|disadvantage|عيب|A disadvantage of remote work is social isolation.
thinking|balance|يوازن أو توازن|People need to balance work and personal life.
thinking|alternative|بديل|Public transport is an alternative to private cars.
education|access|وصول أو إتاحة|Online courses improve access to education.
education|assignment|واجب أو مهمة دراسية|I completed the assignment before the deadline.
education|attend|يحضر|Students attend lectures and practical sessions.
education|course|مقرر أو دورة|The course helped me improve my writing.
education|curriculum|منهج دراسي|Schools should include communication in the curriculum.
education|degree|درجة علمية|A university degree can create new opportunities.
education|education|تعليم|Education supports both personal and social development.
education|exam|اختبار|Good preparation reduces anxiety before an exam.
education|feedback|تغذية راجعة|Useful feedback shows students how to improve.
education|graduate|يتخرج أو خريج|Many students graduate with practical experience.
education|improve|يحسن|Daily speaking practice can improve fluency.
education|knowledge|معرفة|Reading expands knowledge and vocabulary.
education|lecture|محاضرة|The professor explained the topic during the lecture.
education|learn|يتعلم|People learn faster when they use new information.
education|online|عبر الإنترنت|Online learning can be flexible and convenient.
education|practice|يتدرب أو ممارسة|Consistent practice is more useful than memorization.
education|professor|أستاذ جامعي|The professor gave clear advice about the project.
education|research|بحث|Academic research requires reliable sources.
education|resource|مورد أو مصدر|The library is a valuable learning resource.
education|skill|مهارة|Clear writing is an essential academic skill.
education|student|طالب|Each student learns at a different pace.
education|subject|مادة أو موضوع|Science was my favorite subject at school.
education|teach|يعلم|Good teachers teach students how to think.
education|theory|نظرية|Practical experience helps explain the theory.
education|training|تدريب|The training prepared employees for emergencies.
work|collaborate|يتعاون|Different departments collaborated on the project.
work|colleague|زميل عمل|A colleague offered a useful suggestion.
work|communicate|يتواصل|Leaders must communicate expectations clearly.
work|deadline|موعد نهائي|The team completed the work before the deadline.
work|efficient|فعال بكفاءة|A clear system makes the process more efficient.
work|employee|موظف|Every employee should understand their role.
work|employer|صاحب عمل|Employers value communication and problem-solving.
work|expertise|خبرة متخصصة|The project required technical expertise.
work|goal|هدف|The team shared one clear goal.
work|industry|قطاع أو صناعة|Technology is changing the healthcare industry.
work|lead|يقود|She was asked to lead the improvement project.
work|leadership|قيادة|Effective leadership builds trust and direction.
work|manage|يدير|Managers must manage time and resources.
work|motivate|يحفز|Recognition can motivate employees.
work|organize|ينظم|I organize my tasks by priority.
work|performance|أداء|Regular feedback can improve performance.
work|priority|أولوية|Patient safety was our highest priority.
work|project|مشروع|The project improved access to services.
work|responsibility|مسؤولية|Leaders have a responsibility to support their teams.
work|schedule|جدول أو يجدول|A realistic schedule reduces pressure.
work|strategy|استراتيجية|The team created a strategy for rapid recovery.
work|succeed|ينجح|Teams succeed when members share information.
work|teamwork|عمل جماعي|Teamwork was essential during the incident.
work|workplace|مكان العمل|A well-designed workplace supports concentration.
work|workload|عبء العمل|Managers should distribute the workload fairly.
technology|algorithm|خوارزمية|The algorithm identifies patterns in the data.
technology|artificial intelligence|الذكاء الاصطناعي|Artificial intelligence can support faster decisions.
technology|automate|يؤتمت|Software can automate repetitive tasks.
technology|cybersecurity|أمن سيبراني|Cybersecurity protects systems and sensitive data.
technology|data|بيانات|Reliable data helps leaders make better decisions.
technology|device|جهاز|Most students use a digital device every day.
technology|digital|رقمي|Digital services can improve access.
technology|innovation|ابتكار|Innovation often begins with a practical problem.
technology|internet|الإنترنت|The internet provides quick access to information.
technology|network|شبكة|The network connects several facilities.
technology|privacy|خصوصية|Users are increasingly concerned about privacy.
technology|remote|عن بعد|Remote work offers flexibility to some employees.
technology|security|أمان|Strong security reduces the risk of attacks.
technology|software|برنامج|The software helps staff organize information.
technology|system|نظام|The system went down during a busy shift.
technology|technical|تقني|The team solved the technical problem.
technology|technology|تقنية|Technology should support people rather than replace judgment.
technology|tool|أداة|A simple tool can save a great deal of time.
technology|update|تحديث أو يحدث|The company updated its security procedures.
technology|virtual|افتراضي|Virtual classrooms connect students from different places.
technology|reliable|موثوق|Critical services need reliable systems.
technology|connect|يربط أو يتصل|Digital platforms connect learners and teachers.
technology|information|معلومات|People should verify information before sharing it.
technology|risk|خطر أو مخاطرة|Every new system carries some risk.
technology|convenient|مريح أو مناسب|Online services are convenient for busy people.
environment|climate|مناخ|Climate change affects communities around the world.
environment|conservation|حماية الموارد|Conservation protects natural habitats.
environment|consume|يستهلك|Homes consume energy for lighting and cooling.
environment|environment|بيئة|Small choices can protect the environment.
environment|emission|انبعاث|Public transport can reduce carbon emissions.
environment|renewable energy|طاقة متجددة|Renewable energy can reduce dependence on oil.
environment|habitat|موطن طبيعي|Pollution can damage an animal's habitat.
environment|pollution|تلوث|Air pollution is a major urban problem.
environment|recycle|يعيد التدوير|Families can recycle paper and plastic.
environment|reduce|يقلل|Reusable bags reduce plastic waste.
environment|renewable|متجدد|Solar power is a renewable source of energy.
environment|reuse|يعيد الاستخدام|People can reuse bottles and containers.
environment|waste|نفايات أو يهدر|Food waste is both costly and harmful.
environment|sustainable|مستدام|Cities need sustainable transport systems.
environment|transport|نقل أو مواصلات|Public transport reduces traffic.
environment|urban|حضري|Urban areas offer many services.
environment|rural|ريفي|Rural communities may have limited transport.
environment|traffic|ازدحام مروري|Traffic increases stress and air pollution.
environment|public space|مساحة عامة|A safe public space brings communities together.
environment|pedestrian|مشاة أو متعلق بالمشاة|Pedestrian paths encourage people to walk.
environment|plastic|بلاستيك|Single-use plastic creates long-term waste.
environment|ecosystem|نظام بيئي|Whales play an important role in the marine ecosystem.
environment|protect|يحمي|Environmental laws protect natural resources.
environment|future generation|جيل قادم|We should protect resources for future generations.
environment|green space|مساحة خضراء|Green spaces support physical and mental health.
health|active|نشيط|An active lifestyle can prevent disease.
health|balanced|متوازن|A balanced diet includes different food groups.
health|cognitive|إدراكي أو ذهني|Exercise can improve cognitive performance.
health|confidence|ثقة|Practice increased my confidence.
health|diet|نظام غذائي|A healthy diet supports long-term wellbeing.
health|exercise|تمرين|Regular exercise reduces stress.
health|habit|عادة|A small daily habit can create lasting change.
health|healthy|صحي|Cities should make healthy choices easier.
health|mental|ذهني أو نفسي|Outdoor activity supports mental health.
health|nutrition|تغذية|Schools can teach basic nutrition.
health|physical|بدني|Walking is a simple form of physical activity.
health|prevent|يمنع أو يقي|Vaccination can prevent serious illness.
health|recover|يتعافى|The body needs rest to recover.
health|routine|روتين|A consistent routine improves sleep.
health|sleep|نوم|Enough sleep improves memory and attention.
health|stress|ضغط نفسي|Planning ahead can reduce stress.
health|wellbeing|عافية|Work-life balance supports wellbeing.
health|calm|هادئ|A calm leader helps the team think clearly.
health|pressure|ضغط|People react differently under pressure.
health|independence|استقلالية|Cooking gives young adults more independence.
health|outdoor|خارجي|Outdoor activities improve mood.
health|indoor|داخلي|Indoor entertainment can reduce physical activity.
health|symptom|عرض مرضي|Early symptoms should not be ignored.
health|treatment|علاج|The patient responded well to treatment.
health|recovery|تعاف|Support from family can improve recovery.
society|culture|ثقافة|Travel helps people understand another culture.
society|diverse|متنوع|A diverse team brings different perspectives.
society|equality|مساواة|Education can promote greater equality.
society|family|عائلة|Family support can build confidence.
society|friendship|صداقة|Trust is central to a strong friendship.
society|history|تاريخ|History helps societies learn from earlier decisions.
society|honesty|صدق|Honesty can be difficult but necessary.
society|influence|تأثير أو يؤثر|Teachers can influence students for years.
society|language|لغة|Learning a language improves communication.
society|media|إعلام|Media can shape public opinion.
society|relationship|علاقة|Close relationships develop through trust.
society|respect|احترام|Respect makes disagreement more constructive.
society|social|اجتماعي|Online platforms affect social behavior.
society|society|مجتمع|Education benefits society as a whole.
society|tradition|تقليد|Food is an important part of cultural tradition.
society|trust|ثقة|Trust usually develops over time.
society|value|قيمة|Different cultures may emphasize different values.
society|volunteer|يتطوع|Many people volunteer in their communities.
society|communication|تواصل|Clear communication prevents misunderstanding.
society|generation|جيل|Each generation faces different challenges.
society|background|خلفية|People from different backgrounds can learn from each other.
society|behavior|سلوك|Social norms influence behavior.
society|citizen|مواطن|Every citizen can contribute to the community.
society|identity|هوية|Language is closely connected to identity.
society|norm|عرف أو معيار اجتماعي|Privacy norms have changed in recent years.
travel|abroad|في الخارج|Studying abroad can build independence.
travel|accommodation|سكن|We booked accommodation near the city center.
travel|airport|مطار|We arrived at the airport early.
travel|journey|رحلة|The long journey taught me patience.
travel|local|محلي|Travelers should support local businesses.
travel|luggage|أمتعة|I kept my important documents in my luggage.
travel|destination|وجهة|The city is a popular tourist destination.
travel|explore|يستكشف|Travel gives people a chance to explore new places.
travel|landscape|منظر طبيعي|The desert landscape was quiet and impressive.
travel|meal|وجبة|Sharing a meal can bring people together.
travel|prepare|يستعد أو يجهز|Good travelers prepare for unexpected problems.
travel|purchase|يشتري أو عملية شراء|I purchased the ticket online.
travel|valuable|قيّم|Cultural exchange is a valuable experience.
travel|crowded|مزدحم|The market was crowded in the evening.
travel|route|مسار|We chose a safer route through the city.
travel|arrive|يصل|The train arrived on time.
travel|depart|يغادر|Our flight will depart in the morning.
travel|experience|تجربة أو يختبر|Travel allows people to experience new customs.
travel|custom|عادة اجتماعية|Visitors should respect local customs.
travel|memorable|لا ينسى|The family trip was a memorable experience.
photo|foreground|مقدمة الصورة|A bicycle is visible in the foreground.
photo|background|خلفية الصورة|Several buildings appear in the background.
photo|center|وسط|A large table stands in the center of the room.
photo|appear|يبدو أو يظهر|The people appear to be waiting for a bus.
photo|depict|يصور|The image depicts a busy outdoor market.
photo|beside|بجانب|A child is standing beside an older woman.
photo|beyond|خلف أو أبعد من|Mountains can be seen beyond the lake.
photo|bright|مشرق|Bright sunlight fills the street.
photo|empty|فارغ|The road appears almost empty.
photo|position|موضع|The camera position shows the whole room.
photo|scene|مشهد|The scene looks calm and peaceful.
photo|shadow|ظل|Long shadows suggest that it is late afternoon.
photo|wearing|يرتدي|The man is wearing a dark jacket.
photo|surrounded|محاط|The house is surrounded by trees.
photo|facing|مواجه|Two people are facing each other.
photo|standing|واقف|A woman is standing near the entrance.
photo|sitting|جالس|Three students are sitting around a table.
photo|walking|يمشي|A family is walking through the park.
photo|holding|يمسك|The child is holding a small umbrella.
photo|perhaps|ربما|Perhaps they are attending a public event.
photo|atmosphere|أجواء|The warm light creates a relaxed atmosphere.
photo|spacious|واسع|The room looks spacious and well organized.
photo|narrow|ضيق|A narrow path leads through the forest.
photo|gathered|متجمع|A group of people is gathered near the stage.
photo|visible|ظاهر|A bridge is visible in the distance.
  `.trim();

  const VOCAB = VOCAB_ROWS.split("\n").map((line, index) => {
    const parts = line.split("|");
    return { id: "v" + index, category: parts[0], word: parts[1], ar: parts[2], example: parts[3] };
  });

  const TOPICS = [
    {
      id: "challenge",
      title: "تجاوز تحد كبير",
      englishTitle: "Overcoming a Serious Challenge",
      words: "challenge · respond · priority · teamwork · recover",
      passage: `One of the most difficult situations I faced happened when a hospital information system suddenly went down. Staff could not use normal electronic orders or records. Our first priority was patient safety, so we activated the downtime procedure and moved to paper documentation. I coordinated with laboratory, pharmacy, and radiology teams while the technical team worked on recovery. We also checked critical requests manually and kept clear communication between departments. The situation was stressful, but the team remained calm and focused. The experience taught me that preparation is more valuable than confidence alone. A strong plan, clear roles, and regular practice can help people respond effectively when an unexpected problem occurs.`,
      translation: `من أصعب المواقف التي واجهتها تعطل نظام معلومات المستشفى بشكل مفاجئ. لم يتمكن الموظفون من استخدام الطلبات والسجلات الإلكترونية المعتادة. كانت سلامة المرضى أولويتنا الأولى. لذلك فعلنا إجراء التوقف وانتقلنا إلى التوثيق الورقي. نسقت مع فرق المختبر والصيدلية والأشعة بينما عمل الفريق التقني على استعادة النظام. كما راجعنا الطلبات الحرجة يدويا وحافظنا على تواصل واضح بين الأقسام. كان الموقف ضاغطا لكن الفريق بقي هادئا ومركزا. تعلمت أن الاستعداد أهم من الثقة وحدها. تساعد الخطة القوية والأدوار الواضحة والتدريب المنتظم على الاستجابة الفعالة عند حدوث مشكلة غير متوقعة.`,
      ideas: ["المشكلة: تعطل النظام وتوقف المسار الإلكتروني", "الإجراء: تفعيل الخطة الورقية وتوزيع الأدوار", "النتيجة والدرس: استمرار الخدمة وقيمة الاستعداد"],
      writing: "Describe a serious challenge you faced. Explain the actions you took and the lesson you learned.",
      speaking: ["What was the challenge and why was it difficult?", "How did teamwork help you solve it?", "What would you do differently next time?"]
    },
    {
      id: "culture",
      title: "السفر وفهم الثقافات",
      englishTitle: "Travel and Cultural Understanding",
      words: "culture · perspective · custom · respect · memorable",
      passage: `Travel can change the way people understand both the world and themselves. When visitors experience another culture directly, they notice different customs, communication styles, and daily routines. This can reduce unfair assumptions and build respect. Travel also teaches practical skills such as planning, adapting to change, and solving small problems independently. However, international travel can be expensive and may not be possible for everyone. People can still learn through books, documentaries, online conversations, and local cultural events. These alternatives are useful, but direct experience often creates stronger memories. In my view, the real value of travel is not taking photographs. It is learning to see familiar ideas from a different perspective.`,
      translation: `يمكن للسفر أن يغير طريقة فهم الناس للعالم ولأنفسهم. عندما يختبر الزوار ثقافة أخرى مباشرة فإنهم يلاحظون اختلاف العادات وأساليب التواصل والروتين اليومي. قد يقلل ذلك الافتراضات غير العادلة ويبني الاحترام. يعلم السفر أيضا مهارات عملية مثل التخطيط والتكيف مع التغيير وحل المشكلات الصغيرة باستقلالية. لكن السفر الدولي قد يكون مكلفا وغير ممكن للجميع. ما زال بإمكان الناس التعلم من الكتب والأفلام الوثائقية والمحادثات عبر الإنترنت والفعاليات الثقافية المحلية. هذه البدائل مفيدة لكن التجربة المباشرة غالبا تصنع ذكريات أقوى. في رأيي القيمة الحقيقية للسفر ليست التقاط الصور بل رؤية الأفكار المألوفة من منظور مختلف.`,
      ideas: ["الفائدة: فهم العادات وتقليل الأحكام المسبقة", "المهارات: التخطيط والتكيف والاستقلالية", "التوازن: بدائل أقل تكلفة لمن لا يستطيع السفر"],
      writing: "Do people need to travel to understand other cultures? Support your view with reasons and an example.",
      speaking: ["What can people learn from travel?", "How can someone learn about a culture without traveling?", "Describe a memorable place and what it taught you."]
    },
    {
      id: "outdoors",
      title: "الوقت خارج المنزل",
      englishTitle: "Spending Time Outdoors",
      words: "outdoor · wellbeing · active · reduce · balance",
      passage: `Modern life encourages people to spend many hours indoors. Work, study, entertainment, and social communication often happen through screens. Spending time outdoors offers a useful balance. Walking in a park can increase physical activity, reduce stress, and improve attention. Natural light may also support healthier sleep. Outdoor time does not need to be difficult or expensive. A short walk after work or a family visit to a public park can be enough. There are risks such as extreme heat or poor air quality, so people should choose safe times and suitable locations. The goal is not to reject technology. It is to create a routine in which technology and outdoor activity support rather than compete with wellbeing.`,
      translation: `تشجع الحياة الحديثة الناس على قضاء ساعات طويلة داخل المباني. يحدث العمل والدراسة والترفيه والتواصل الاجتماعي غالبا عبر الشاشات. يوفر قضاء الوقت في الخارج توازنا مفيدا. قد يزيد المشي في الحديقة النشاط البدني ويقلل الضغط ويحسن الانتباه. وقد يدعم الضوء الطبيعي نوما أفضل. لا يحتاج النشاط الخارجي أن يكون صعبا أو مكلفا. قد تكفي نزهة قصيرة بعد العمل أو زيارة عائلية لحديقة عامة. توجد مخاطر مثل الحرارة الشديدة أو سوء جودة الهواء. لذلك يجب اختيار الوقت والمكان المناسبين. الهدف ليس رفض التقنية بل بناء روتين تدعم فيه التقنية والنشاط الخارجي الصحة بدلا من أن يتنافسا معها.`,
      ideas: ["فوائد بدنية ونفسية", "حلول بسيطة تناسب الجدول المزدحم", "مراعاة الحرارة والهواء والسلامة"],
      writing: "Should people spend less time with screens and more time outdoors? Explain your opinion.",
      speaking: ["What outdoor activity do you enjoy?", "Why do people spend less time outdoors now?", "How can cities encourage outdoor activity?"]
    },
    {
      id: "learning",
      title: "تعلم مهارة جديدة",
      englishTitle: "Learning a New Skill",
      words: "practice · feedback · confidence · resource · improve",
      passage: `Learning English seriously has reminded me that progress is rarely immediate. At first, I understood many words when I heard them, but I could not organize them quickly while speaking. I started using short daily speaking exercises and asked for direct correction. I also recorded some answers so I could notice long pauses and repeated mistakes. The most difficult part was accepting that mistakes were necessary. After several sessions, I became faster at building sentences and more confident in conversation. This experience changed the way I learn. I now prefer frequent practice with feedback instead of reading rules for a long time. A new skill becomes useful only when we apply it under realistic conditions.`,
      translation: `ذكرني تعلم الإنجليزية بجدية بأن التقدم نادرا ما يكون فوريا. في البداية كنت أفهم كلمات كثيرة عند سماعها لكنني لم أستطع ترتيبها بسرعة أثناء الكلام. بدأت تمارين تحدث يومية قصيرة وطلبت تصحيحا مباشرا. كما سجلت بعض الإجابات لكي ألاحظ التوقفات الطويلة والأخطاء المتكررة. كان أصعب جزء هو تقبل أن الخطأ ضروري. بعد عدة جلسات أصبحت أسرع في بناء الجمل وأكثر ثقة في المحادثة. غيرت هذه التجربة طريقة تعلمي. أصبحت أفضل التدريب المتكرر مع التغذية الراجعة بدلا من قراءة القواعد لفترة طويلة. لا تصبح المهارة الجديدة مفيدة إلا عندما نستخدمها في ظروف واقعية.`,
      ideas: ["المشكلة: الفهم موجود لكن تركيب الجملة بطيء", "الطريقة: تدريب قصير وتسجيل وتصحيح", "النتيجة: سرعة وثقة وطريقة تعلم أفضل"],
      writing: "Describe a new skill you learned. Explain the process and how you used the skill.",
      speaking: ["What new skill have you learned recently?", "Which learning method works best for you?", "How do mistakes support learning?"]
    },
    {
      id: "happiness",
      title: "المال والنجاح والسعادة",
      englishTitle: "Money, Success, and Happiness",
      words: "success · balance · income · meaningful · priority",
      passage: `Money is important because it provides safety, choices, and access to education and healthcare. Ignoring financial needs can create serious stress. However, income alone does not guarantee a satisfying life. People also need meaningful relationships, physical health, personal growth, and enough time to rest. The best approach is balance rather than choosing one side completely. During the early stages of a career, someone may focus more on income and experience. Later, family time or flexible work may become a higher priority. Success should therefore be defined personally. For me, real success means doing useful work, supporting my family, continuing to learn, and having enough time to enjoy life without constant pressure.`,
      translation: `المال مهم لأنه يوفر الأمان والخيارات والوصول إلى التعليم والرعاية الصحية. تجاهل الاحتياجات المالية قد يصنع ضغطا كبيرا. لكن الدخل وحده لا يضمن حياة مرضية. يحتاج الناس أيضا إلى علاقات ذات معنى وصحة بدنية ونمو شخصي ووقت كاف للراحة. النهج الأفضل هو التوازن بدلا من اختيار طرف واحد بالكامل. في بداية المسار المهني قد يركز الشخص أكثر على الدخل والخبرة. ثم قد يصبح وقت العائلة أو مرونة العمل أولوية أعلى. لذلك يجب تعريف النجاح بصورة شخصية. بالنسبة لي يعني النجاح الحقيقي أداء عمل مفيد ودعم العائلة والاستمرار في التعلم ووجود وقت للاستمتاع بالحياة دون ضغط مستمر.`,
      ideas: ["المال يوفر الأمان والخيارات", "السعادة تحتاج صحة وعلاقات ووقت", "تعريف النجاح يتغير حسب مرحلة الحياة"],
      writing: "Is happiness more important than money and professional success? Give a balanced answer.",
      speaking: ["How do you define success?", "Can money buy happiness?", "How can people balance work and personal life?"]
    },
    {
      id: "plastic",
      title: "تقليل النفايات البلاستيكية",
      englishTitle: "Reducing Plastic Waste",
      words: "plastic · reuse · recycle · waste · sustainable",
      passage: `Plastic is useful, but single-use products create waste that can remain in the environment for many years. Individuals can reduce this problem through simple habits. They can carry reusable bottles and bags, avoid unnecessary packaging, and choose products that last longer. Families can also separate recyclable materials at home. Small actions matter most when many people repeat them consistently. Still, individual behavior is not enough. Companies should design better packaging, and governments should improve recycling systems and support sustainable alternatives. The most effective solution combines personal responsibility with strong public policy. Reducing plastic waste protects wildlife, keeps public spaces cleaner, and preserves resources for future generations.`,
      translation: `البلاستيك مفيد لكن المنتجات ذات الاستخدام الواحد تصنع نفايات قد تبقى في البيئة سنوات طويلة. يستطيع الأفراد تقليل المشكلة بعادات بسيطة. يمكنهم حمل عبوات وأكياس قابلة لإعادة الاستخدام وتجنب التغليف غير الضروري واختيار منتجات تدوم فترة أطول. كما تستطيع الأسر فصل المواد القابلة للتدوير في المنزل. تصبح الأفعال الصغيرة مهمة عندما يكررها عدد كبير من الناس باستمرار. مع ذلك لا يكفي سلوك الأفراد وحده. يجب أن تصمم الشركات تغليفا أفضل وأن تحسن الحكومات أنظمة التدوير وتدعم البدائل المستدامة. يجمع الحل الأكثر فاعلية بين المسؤولية الشخصية والسياسة العامة القوية. يحمي تقليل النفايات الحياة الفطرية ويحافظ على نظافة الأماكن العامة وموارد الأجيال القادمة.`,
      ideas: ["عادات فردية بسيطة", "دور الشركات والحكومة", "الأثر على البيئة والأجيال القادمة"],
      writing: "How can individuals and governments reduce plastic waste? Explain which actions matter most.",
      speaking: ["Which reusable products do you use?", "Are small environmental actions effective?", "What should companies change about packaging?"]
    },
    {
      id: "trust",
      title: "بناء الثقة والعلاقات",
      englishTitle: "Building Trust in Relationships",
      words: "trust · honesty · relationship · respect · gradually",
      passage: `Close relationships usually depend on trust, and trust is built through consistent behavior. People begin to trust someone when that person keeps promises, listens carefully, and speaks honestly. Shared experiences can create a quick connection, especially during a difficult event, but strong trust normally develops gradually. The process also differs by relationship. Friends may build trust through personal support. Coworkers often build it by meeting deadlines and sharing information. Family trust may depend on reliability over many years. When trust is damaged, a sincere apology is only the first step. The person must also change their behavior. In every type of relationship, respect and clear communication are essential.`,
      translation: `تعتمد العلاقات القريبة غالبا على الثقة. وتُبنى الثقة من خلال السلوك المستمر. يبدأ الناس بالثقة في شخص عندما يفي بوعوده ويستمع بعناية ويتحدث بصدق. قد تصنع التجارب المشتركة ارتباطا سريعا خصوصا خلال موقف صعب. لكن الثقة القوية تتطور عادة بالتدريج. تختلف العملية حسب نوع العلاقة. قد يبني الأصدقاء الثقة بالدعم الشخصي. ويبني زملاء العمل الثقة بالالتزام بالمواعيد ومشاركة المعلومات. وقد تعتمد ثقة العائلة على الموثوقية لسنوات. عندما تتضرر الثقة يكون الاعتذار الصادق خطوة أولى فقط. يجب أن يتغير السلوك أيضا. في كل العلاقات يبقى الاحترام والتواصل الواضح أساسيين.`,
      ideas: ["الثقة تنتج من سلوك ثابت", "تختلف علامات الثقة حسب العلاقة", "استعادة الثقة تحتاج اعتذارا وتغيرا فعليا"],
      writing: "How is trust built in friendships, families, and workplaces? Use examples.",
      speaking: ["What makes a person trustworthy?", "Can trust develop quickly?", "How can someone repair damaged trust?"]
    },
    {
      id: "online-learning",
      title: "التعليم عبر الإنترنت",
      englishTitle: "Online Learning",
      words: "access · flexible · virtual · resource · independent",
      passage: `Online learning makes education available to people who cannot attend a traditional classroom. A working adult can study after work, and a student in a remote area can access expert instruction. Recorded lessons also allow learners to repeat difficult sections. However, flexibility requires self-discipline. Some students postpone tasks or feel isolated without direct contact. Practical subjects may also need laboratories or supervised training. For these reasons, online education is most effective when it includes clear deadlines, live discussion, useful feedback, and opportunities to apply knowledge. It is not always better than classroom learning, but it can be the best option for busy learners, distant communities, or short professional courses.`,
      translation: `يجعل التعليم عبر الإنترنت الدراسة متاحة لمن لا يستطيع حضور فصل تقليدي. يستطيع الموظف الدراسة بعد العمل. كما يمكن لطالب في منطقة بعيدة الوصول إلى تدريس متخصص. وتسمح الدروس المسجلة بإعادة الأجزاء الصعبة. لكن المرونة تحتاج انضباطا ذاتيا. يؤجل بعض الطلاب المهام أو يشعرون بالعزلة دون تواصل مباشر. وقد تحتاج المواد العملية إلى مختبرات أو تدريب تحت الإشراف. لذلك يكون التعليم الإلكتروني أكثر فاعلية عندما يتضمن مواعيد واضحة ونقاشا مباشرا وتغذية راجعة مفيدة وفرصا لتطبيق المعرفة. ليس دائما أفضل من الفصل لكنه قد يكون الخيار الأنسب للمتعلمين المشغولين والمناطق البعيدة والدورات المهنية القصيرة.`,
      ideas: ["إتاحة ومرونة وإعادة الدروس", "تحديات الانضباط والعزلة والمهارات العملية", "الحل: مزيج من المحتوى والنقاش والتطبيق"],
      writing: "When is online learning more useful than classroom learning? Explain its strengths and limits.",
      speaking: ["Do you prefer online or classroom learning?", "What makes an online course effective?", "Which subjects are difficult to teach online?"]
    },
    {
      id: "language",
      title: "تعلم لغة جديدة",
      englishTitle: "Learning Another Language",
      words: "language · fluency · communicate · memory · opportunity",
      passage: `Learning another language has practical and personal benefits. It helps people communicate during travel, understand colleagues from different backgrounds, and access information that may not exist in translation. Language study also trains attention and memory because learners must notice patterns and recall words quickly. The process can be frustrating, especially when a person understands more than they can say. Progress becomes faster when learners speak regularly and use vocabulary in meaningful situations. Perfect grammar is not required for useful communication. Clear ideas, active listening, and the confidence to continue after a mistake are equally important. A new language is therefore more than an academic subject. It is a tool that can expand work, study, and social opportunities.`,
      translation: `لتعلم لغة أخرى فوائد عملية وشخصية. فهو يساعد الناس على التواصل أثناء السفر وفهم زملاء من خلفيات مختلفة والوصول إلى معلومات قد لا تتوفر مترجمة. كما يدرب تعلم اللغة الانتباه والذاكرة لأن المتعلم يحتاج إلى ملاحظة الأنماط واسترجاع الكلمات بسرعة. قد تكون العملية محبطة خصوصا عندما يفهم الشخص أكثر مما يستطيع قوله. يصبح التقدم أسرع عند التحدث بانتظام واستخدام المفردات في مواقف لها معنى. لا تحتاج الاستفادة من اللغة إلى قواعد مثالية. الأفكار الواضحة والاستماع النشط والثقة للاستمرار بعد الخطأ مهمة أيضا. لذلك فاللغة الجديدة ليست مادة أكاديمية فقط بل أداة توسع فرص العمل والدراسة والتواصل.`,
      ideas: ["فوائد في السفر والعمل والوصول للمعلومات", "تدريب الذاكرة والانتباه", "التقدم يحتاج استخداما واقعيا لا كمالا"],
      writing: "What are the most important benefits of learning another language? Use personal examples.",
      speaking: ["Why are you learning English?", "What is the hardest part of language learning?", "How can learners improve speaking confidence?"]
    },
    {
      id: "workplace",
      title: "تصميم مكان العمل",
      englishTitle: "A Productive Workplace",
      words: "workplace · layout · spacious · concentration · collaborate",
      passage: `The design of a workplace can influence concentration, communication, and wellbeing. Quiet rooms are useful for tasks that require deep focus. Shared areas make collaboration easier, but they can become noisy if they are not planned carefully. Good lighting, comfortable seating, and clear walking paths support both safety and performance. In a healthcare setting, the layout should also reduce unnecessary movement and help staff reach equipment quickly. No single design is perfect for every activity. A productive workplace needs different zones for focused work, teamwork, short meetings, and rest. The best layout is not necessarily the most expensive one. It is the design that matches the work people actually do.`,
      translation: `قد يؤثر تصميم مكان العمل في التركيز والتواصل والعافية. تفيد الغرف الهادئة في المهام التي تحتاج تركيزا عميقا. وتسهل المساحات المشتركة التعاون لكنها قد تصبح مزعجة إذا لم تخطط بعناية. تدعم الإضاءة الجيدة والمقاعد المريحة ومسارات الحركة الواضحة السلامة والأداء. في بيئة الرعاية الصحية يجب أن يقلل التصميم الحركة غير الضرورية ويساعد الموظفين على الوصول السريع للمعدات. لا يوجد تصميم واحد مثالي لكل نشاط. يحتاج مكان العمل المنتج إلى مناطق مختلفة للعمل المركز والعمل الجماعي والاجتماعات القصيرة والراحة. أفضل تصميم ليس بالضرورة الأغلى بل الذي يناسب العمل الفعلي للناس.`,
      ideas: ["مناطق للتركيز وأخرى للتعاون", "الإضاءة والجلوس والحركة تؤثر في الأداء", "التصميم يجب أن يتبع طبيعة العمل"],
      writing: "Describe an effective workplace or study space. Explain how its design affects users.",
      speaking: ["Describe the place where you work or study.", "Do open offices improve teamwork?", "What is one design change you would make?"]
    },
    {
      id: "honesty",
      title: "قول الحقيقة في موقف صعب",
      englishTitle: "Choosing Honesty",
      words: "honesty · unpopular · reaction · responsibility · respect",
      passage: `Telling the truth is easy when everyone wants to hear it. The real test of honesty happens when the truth may be unpopular. In a professional setting, a leader may need to explain that a plan is unsafe, unrealistic, or unlikely to succeed. The message should be direct but respectful. It is better to describe the evidence, explain the possible consequence, and suggest an alternative instead of simply criticizing. The immediate reaction may be uncomfortable, but avoiding the truth can create a larger problem later. Honest communication protects trust when it is combined with good judgment. People may disagree with a decision, yet they are more likely to respect a leader who explains difficult facts clearly and takes responsibility.`,
      translation: `يكون قول الحقيقة سهلا عندما يرغب الجميع في سماعها. يظهر الاختبار الحقيقي للصدق عندما تكون الحقيقة غير محبوبة. في العمل قد يحتاج القائد إلى توضيح أن خطة ما غير آمنة أو غير واقعية أو ضعيفة فرص النجاح. يجب أن تكون الرسالة مباشرة ومحترمة. من الأفضل عرض الدليل وشرح النتيجة المحتملة واقتراح بديل بدلا من الاكتفاء بالنقد. قد يكون رد الفعل الأول غير مريح لكن تجنب الحقيقة قد يصنع مشكلة أكبر لاحقا. يحمي التواصل الصادق الثقة عندما يقترن بحسن التقدير. قد يختلف الناس مع القرار لكنهم غالبا يحترمون قائدا يشرح الحقائق الصعبة بوضوح ويتحمل المسؤولية.`,
      ideas: ["الموقف: حقيقة غير مريحة", "الطريقة: دليل ونتيجة وبديل", "الدرس: الصدق المحترم يحمي الثقة"],
      writing: "Describe a time when honesty was difficult but necessary. Explain the outcome.",
      speaking: ["Why can honesty be difficult?", "How should a leader deliver bad news?", "Is complete honesty always the best choice?"]
    },
    {
      id: "decision",
      title: "قرار بمعلومات ناقصة",
      englishTitle: "Deciding with Incomplete Information",
      words: "decision · evidence · uncertainty · risk · priority",
      passage: `Important decisions are sometimes required before all information is available. Waiting may feel safer, but delay can also create risk. In this situation, I first separate confirmed facts from assumptions. Then I identify the decision that protects the highest priority, especially safety. I ask people with relevant expertise for a quick view and prepare a backup plan in case the first choice fails. After acting, I monitor the result and adjust the plan when new information appears. This approach does not remove uncertainty, but it makes the decision more responsible. Intuition can be useful when it is based on experience. However, it should support evidence rather than replace it.`,
      translation: `تكون بعض القرارات المهمة مطلوبة قبل توفر كل المعلومات. قد يبدو الانتظار أكثر أمانا لكن التأخير قد يصنع خطرا أيضا. في هذا الموقف أفصل أولا الحقائق المؤكدة عن الافتراضات. ثم أحدد القرار الذي يحمي الأولوية الأعلى خصوصا السلامة. أطلب رأيا سريعا من أصحاب الخبرة ذات الصلة وأجهز خطة بديلة في حال فشل الخيار الأول. بعد التنفيذ أراقب النتيجة وأعدل الخطة عندما تظهر معلومات جديدة. لا يزيل هذا النهج عدم اليقين لكنه يجعل القرار أكثر مسؤولية. قد يكون الحدس مفيدا عندما يعتمد على الخبرة. لكنه يجب أن يدعم الدليل لا أن يستبدله.`,
      ideas: ["افصل الحقائق عن الافتراضات", "احم الأولوية الأعلى وجهز خطة بديلة", "راقب وعدل القرار مع المعلومات الجديدة"],
      writing: "How should people make major decisions when information is incomplete?",
      speaking: ["Describe a difficult decision you made.", "Do you rely more on facts or intuition?", "When can delaying a decision be harmful?"]
    },
    {
      id: "calm",
      title: "الهدوء تحت الضغط",
      englishTitle: "Staying Calm Under Pressure",
      words: "calm · pressure · focus · communicate · recover",
      passage: `People who stay calm under pressure are not necessarily less worried than everyone else. They have learned how to control their response. A calm person usually pauses, identifies the immediate priority, and communicates one clear step at a time. This behavior is especially valuable in healthcare because panic can spread quickly and lead to mistakes. Preparation also matters. Teams respond better when they have practiced emergency procedures and understand their roles. After the event, a calm leader reviews what happened without blaming individuals. This creates learning and helps the team recover. Staying calm is therefore not a personality trait alone. It is a skill that can be developed through preparation, breathing, clear priorities, and repeated experience.`,
      translation: `الأشخاص الذين يبقون هادئين تحت الضغط ليسوا بالضرورة أقل قلقا من غيرهم. لكنهم تعلموا التحكم في استجابتهم. يتوقف الشخص الهادئ عادة لحظة ويحدد الأولوية الفورية ويتواصل بخطوة واضحة في كل مرة. لهذا السلوك قيمة كبيرة في الرعاية الصحية لأن الذعر قد ينتشر بسرعة ويسبب أخطاء. للاستعداد دور أيضا. تستجيب الفرق بصورة أفضل عندما تتدرب على إجراءات الطوارئ وتفهم أدوارها. بعد الحدث يراجع القائد الهادئ ما حدث دون لوم الأفراد. يصنع ذلك تعلما ويساعد الفريق على التعافي. لذلك الهدوء ليس صفة شخصية فقط بل مهارة تتطور بالاستعداد والتنفس والأولويات الواضحة والخبرة المتكررة.`,
      ideas: ["الهدوء هو إدارة للاستجابة لا غياب للقلق", "التدريب والأدوار الواضحة يقللان الأخطاء", "المراجعة بعد الحدث تحول الضغط إلى تعلم"],
      writing: "What helps people stay calm under pressure? Explain with an example.",
      speaking: ["Describe someone who stays calm under pressure.", "How does panic affect a team?", "Can calm behavior be learned?"]
    },
    {
      id: "cooking",
      title: "الطبخ كمهارة أساسية",
      englishTitle: "Cooking as a Basic Skill",
      words: "nutrition · independence · meal · practical · affordable",
      passage: `Basic cooking is a valuable life skill because it supports health, independence, and financial control. A person who can prepare a few simple meals is less dependent on restaurants and highly processed food. Cooking also helps people understand ingredients and portion sizes. Not everyone needs advanced techniques. The essential skills are planning a balanced meal, handling food safely, and using basic equipment. Some people have limited time or physical ability, so convenient prepared food will still have a role. However, even these people benefit from understanding nutrition and making informed choices. Schools could teach simple cooking through practical lessons. This would prepare students for daily life as directly as many traditional subjects.`,
      translation: `الطبخ الأساسي مهارة حياتية قيمة لأنه يدعم الصحة والاستقلالية والتحكم المالي. الشخص القادر على إعداد وجبات بسيطة يكون أقل اعتمادا على المطاعم والأطعمة شديدة التصنيع. يساعد الطبخ أيضا على فهم المكونات وحجم الحصص. لا يحتاج الجميع إلى تقنيات متقدمة. المهارات الأساسية هي تخطيط وجبة متوازنة والتعامل الآمن مع الطعام واستخدام المعدات البسيطة. بعض الناس لديهم وقت محدود أو قدرة بدنية محدودة. لذلك سيبقى للطعام الجاهز دور. مع ذلك يستفيد الجميع من فهم التغذية واتخاذ خيارات واعية. يمكن للمدارس تعليم الطبخ البسيط عبر دروس عملية. وهذا يجهز الطلاب للحياة اليومية بصورة مباشرة.`,
      ideas: ["الصحة والاستقلالية وتوفير المال", "المطلوب مهارات أساسية لا احتراف", "المدارس تستطيع تدريسه عمليا"],
      writing: "Should every student learn basic cooking at school? Give reasons and examples.",
      speaking: ["Can you cook a simple meal?", "How does cooking affect health?", "Should schools teach practical life skills?"]
    },
    {
      id: "lifestyles",
      title: "مقارنة أنماط الحياة",
      englishTitle: "Comparing Lifestyles",
      words: "lifestyle · tradition · urban · rural · community",
      passage: `Lifestyles differ between countries and even between cities in the same country. Large urban areas often offer more jobs, universities, entertainment, and specialized services. At the same time, residents may face traffic, higher costs, and less personal space. Smaller communities can provide quieter surroundings and stronger daily relationships, but choices may be limited. Culture also influences meal times, family contact, work schedules, and the use of public space. It is difficult to say that one lifestyle is universally better. A young professional may prefer a busy city, while a family may value safety and space. The best choice depends on priorities, responsibilities, and the stage of life.`,
      translation: `تختلف أنماط الحياة بين الدول وحتى بين مدن الدولة الواحدة. غالبا توفر المناطق الحضرية الكبيرة وظائف وجامعات وترفيها وخدمات متخصصة أكثر. وفي الوقت نفسه قد يواجه السكان الازدحام وارتفاع التكلفة وقلة المساحة الشخصية. قد توفر المجتمعات الصغيرة بيئة أهدأ وعلاقات يومية أقوى لكن الخيارات قد تكون محدودة. تؤثر الثقافة أيضا في مواعيد الوجبات والتواصل العائلي وجداول العمل واستخدام الأماكن العامة. من الصعب القول إن نمطا واحدا أفضل للجميع. قد يفضل الشاب المهني مدينة نشطة بينما تقدر العائلة الأمان والمساحة. يعتمد الخيار الأفضل على الأولويات والمسؤوليات ومرحلة الحياة.`,
      ideas: ["مزايا المدينة مقابل تكلفتها وضغطها", "مزايا المجتمع الصغير مقابل قلة الخيارات", "الاختيار يعتمد على المرحلة والأولويات"],
      writing: "Compare urban and smaller-community lifestyles. Which would you prefer and why?",
      speaking: ["Do you prefer a busy city or a quiet town?", "How does culture affect daily routines?", "What makes a place good for families?"]
    },
    {
      id: "communication",
      title: "تعليم التواصل الواضح",
      englishTitle: "Teaching Clear Communication",
      words: "communication · explain · listen · misunderstanding · confidence",
      passage: `Schools spend years teaching students facts, but many students receive little direct training in communication. Clear speaking and writing are essential in study, work, and relationships. Students should learn how to organize an idea, listen without interrupting, ask useful questions, and disagree respectfully. These skills do not need to replace mathematics or science. They can be practiced through presentations, group projects, and written explanations inside existing subjects. Communication training also builds confidence and reduces misunderstanding. Knowledge has limited value when a person cannot explain it to others. For this reason, schools should treat communication as a core skill that supports every academic subject rather than as a separate optional activity.`,
      translation: `تقضي المدارس سنوات في تعليم الطلاب الحقائق لكن كثيرا منهم لا يحصلون على تدريب مباشر كاف في التواصل. التحدث والكتابة بوضوح أساسيان في الدراسة والعمل والعلاقات. يجب أن يتعلم الطلاب تنظيم الفكرة والاستماع دون مقاطعة وطرح أسئلة مفيدة والاختلاف باحترام. لا تحتاج هذه المهارات إلى استبدال الرياضيات أو العلوم. يمكن تدريبها من خلال العروض والمشروعات الجماعية والشروحات المكتوبة داخل المواد الحالية. كما يبني تدريب التواصل الثقة ويقلل سوء الفهم. للمعرفة قيمة محدودة عندما لا يستطيع الشخص شرحها للآخرين. لذلك يجب اعتبار التواصل مهارة أساسية تدعم كل مادة أكاديمية.`,
      ideas: ["التواصل مهم في الدراسة والعمل والعلاقات", "يمكن دمجه داخل المواد الحالية", "المعرفة تحتاج قدرة على الشرح"],
      writing: "Should schools spend more time teaching communication skills? Compare this with other subjects.",
      speaking: ["Why is clear communication important?", "How can schools teach communication?", "Which is harder for you: speaking or writing?"]
    },
    {
      id: "advice",
      title: "نصيحة بقي أثرها",
      englishTitle: "Advice That Stayed with Me",
      words: "advice · influence · apply · memorable · perspective",
      passage: `One piece of advice I still remember is simple: do not wait for perfect information before taking a useful first step. A senior colleague gave me this advice when I was dealing with a complex improvement project. I had been spending too much time trying to design a complete solution. He suggested starting with the safest practical change, measuring the result, and improving it gradually. This advice has influenced the way I lead projects and learn new skills. It does not mean acting carelessly. It means combining action with measurement. The advice stayed with me because it was practical, easy to remember, and useful in many different situations.`,
      translation: `ما زلت أتذكر نصيحة بسيطة تقول لا تنتظر المعلومات المثالية قبل اتخاذ خطوة أولى مفيدة. قدمها لي زميل خبير عندما كنت أتعامل مع مشروع تحسين معقد. كنت أقضي وقتا طويلا في محاولة تصميم حل كامل. اقترح أن أبدأ بالتغيير العملي الأكثر أمانا وأن أقيس النتيجة ثم أحسنها تدريجيا. أثرت هذه النصيحة في طريقة قيادتي للمشروعات وتعلمي للمهارات الجديدة. لا تعني التصرف دون حذر. بل تعني الجمع بين التنفيذ والقياس. بقيت النصيحة معي لأنها عملية وسهلة التذكر ومفيدة في مواقف كثيرة.`,
      ideas: ["اذكر النصيحة وصاحبها", "اشرح الموقف الذي احتجتها فيه", "وضح كيف غيرت تصرفك لاحقا"],
      writing: "Describe advice that influenced you. Explain when you received it and how you apply it.",
      speaking: ["What advice do you still remember?", "Who gave it to you?", "Why is some advice more memorable than other advice?"]
    },
    {
      id: "history",
      title: "فائدة تعلم التاريخ",
      englishTitle: "Why History Matters",
      words: "history · consequence · evidence · society · decision",
      passage: `History is useful because it shows how present conditions developed. Laws, cities, institutions, and social values did not appear suddenly. They were shaped by earlier choices and conflicts. Studying history also teaches people to examine evidence and compare different accounts of the same event. This skill is important in a world where misleading information spreads quickly. History cannot provide a perfect answer to every modern problem because circumstances change. However, it can reveal repeated patterns such as the consequences of poor planning, discrimination, or uncontrolled conflict. Learning history therefore does not mean memorizing dates alone. It means understanding cause, consequence, and human behavior so that future decisions can be more informed.`,
      translation: `التاريخ مفيد لأنه يوضح كيف تطورت الظروف الحالية. لم تظهر القوانين والمدن والمؤسسات والقيم الاجتماعية فجأة. بل شكلتها اختيارات وصراعات سابقة. كما يعلم التاريخ الناس فحص الأدلة ومقارنة روايات مختلفة للحدث نفسه. لهذه المهارة أهمية في عالم تنتشر فيه المعلومات المضللة بسرعة. لا يقدم التاريخ إجابة مثالية لكل مشكلة حديثة لأن الظروف تتغير. لكنه يكشف أنماطا متكررة مثل نتائج التخطيط الضعيف والتمييز والصراع غير المنضبط. لذلك لا يعني تعلم التاريخ حفظ التواريخ فقط. بل يعني فهم السبب والنتيجة والسلوك البشري لكي تصبح القرارات المستقبلية أكثر معرفة.`,
      ideas: ["فهم أصل الحاضر", "تعلم فحص الأدلة والروايات", "اكتشاف أنماط تساعد القرارات المستقبلية"],
      writing: "Why should students learn history? Explain how it can influence present decisions.",
      speaking: ["Is history useful in daily life?", "What can societies learn from past mistakes?", "Why do accounts of history sometimes differ?"]
    },
    {
      id: "healthy-cities",
      title: "المدن الصحية",
      englishTitle: "Designing Healthier Cities",
      words: "urban · pedestrian · green space · access · active",
      passage: `A healthy city makes good choices easy. Safe sidewalks and shaded walking paths encourage daily movement. Parks provide space for exercise, relaxation, and family activity. Reliable public transport reduces traffic and helps people reach work, schools, and healthcare. Access to fresh food is equally important, especially in lower-income neighborhoods. Cities can also create problems. Long travel times, air pollution, noise, and limited green space increase stress and reduce activity. Improving health therefore requires cooperation between planners, transport services, health organizations, and communities. Building one park is not enough. Healthy design should connect housing, services, transport, and public spaces so that people can make healthier choices as part of normal daily life.`,
      translation: `تجعل المدينة الصحية الخيارات الجيدة سهلة. تشجع الأرصفة الآمنة ومسارات المشي المظللة الحركة اليومية. وتوفر الحدائق مساحة للرياضة والاسترخاء والنشاط العائلي. يقلل النقل العام الموثوق الازدحام ويساعد الناس على الوصول إلى العمل والمدارس والرعاية الصحية. كما أن الوصول إلى الغذاء الطازج مهم خصوصا في الأحياء الأقل دخلا. وقد تصنع المدن مشكلات أيضا. يزيد طول التنقل وتلوث الهواء والضوضاء وقلة المساحات الخضراء الضغط ويقلل النشاط. لذلك يحتاج تحسين الصحة إلى تعاون المخططين وخدمات النقل والجهات الصحية والمجتمعات. لا يكفي بناء حديقة واحدة. يجب أن يربط التصميم الصحي السكن والخدمات والنقل والأماكن العامة.`,
      ideas: ["المشي والحدائق والنقل والغذاء", "مشكلات التلوث والوقت والضوضاء", "الحل يحتاج تصميما متكاملا وتعاونا"],
      writing: "What features make a city healthy? Explain which improvement should come first.",
      speaking: ["Is your city easy to walk in?", "How do parks affect health?", "What should city planners improve first?"]
    },
    {
      id: "better-way",
      title: "إيجاد طريقة أفضل",
      englishTitle: "Finding a Better Way",
      words: "improve · process · measure · reduce · result",
      passage: `A meaningful improvement often begins by looking closely at an inefficient process. In one service, patients had been waiting a very long time for ultrasound appointments. Instead of accepting the delay as unavoidable, we reviewed demand, scheduling, staff use, and the patient pathway. The team changed how appointments were prioritized and monitored the waiting list regularly. Over time, the waiting period fell from about 300 days to around 10 days. The result was important, but the main lesson was the method. Define the problem clearly, use available data, involve the people doing the work, test practical changes, and measure the result. Improvement is usually not one dramatic idea. It is a series of focused decisions.`,
      translation: `يبدأ التحسين المؤثر غالبا بالنظر الدقيق إلى عملية غير فعالة. في إحدى الخدمات كان المرضى ينتظرون فترة طويلة جدا لمواعيد الأشعة الصوتية. بدلا من قبول التأخير كأمر لا يمكن تغييره راجعنا الطلب والجدولة واستخدام الموظفين ومسار المريض. غير الفريق طريقة ترتيب أولوية المواعيد وراقب قائمة الانتظار بانتظام. مع الوقت انخفض الانتظار من نحو 300 يوم إلى قرابة 10 أيام. كانت النتيجة مهمة لكن الدرس الأساسي كان الطريقة. حدد المشكلة بوضوح واستخدم البيانات المتاحة وأشرك منفذي العمل واختبر تغييرات عملية وقس النتيجة. التحسين عادة ليس فكرة واحدة ضخمة بل سلسلة قرارات مركزة.`,
      ideas: ["صف المشكلة بالأرقام إن أمكن", "اشرح التحليل والتغيير العملي", "اختم بالنتيجة والمنهج القابل للتكرار"],
      writing: "Describe a better way you found to complete a task or improve a service. What changed?",
      speaking: ["What process have you improved?", "Why is measurement important?", "Do small changes create large results?"]
    },
    {
      id: "technology-social",
      title: "التقنية والتواصل الاجتماعي",
      englishTitle: "Technology and Social Connection",
      words: "technology · connect · isolate · convenient · balance",
      passage: `Technology can make people both more connected and more isolated. Messaging and video calls help families and teams communicate across distance. Online communities also allow people with shared interests to find one another. At the same time, digital contact can replace deeper face-to-face conversation. Notifications interrupt attention, and social media may encourage comparison rather than genuine connection. The effect depends on how technology is used. A video call with a distant relative strengthens a relationship. Scrolling without purpose for an hour may weaken it. People need simple boundaries such as device-free meals, focused work periods, and time for direct conversation. Technology is most valuable when it supports human relationships instead of controlling them.`,
      translation: `قد تجعل التقنية الناس أكثر اتصالا وأكثر عزلة في الوقت نفسه. تساعد الرسائل ومكالمات الفيديو العائلات والفرق على التواصل عبر المسافات. كما تسمح المجتمعات الرقمية لأصحاب الاهتمامات المشتركة بالتعرف إلى بعضهم. لكن التواصل الرقمي قد يستبدل الحديث المباشر الأعمق. تقطع الإشعارات الانتباه وقد تشجع وسائل التواصل المقارنة بدلا من العلاقة الحقيقية. يعتمد الأثر على طريقة الاستخدام. تقوي مكالمة فيديو مع قريب بعيد العلاقة. وقد يضعفها تصفح بلا هدف لمدة ساعة. يحتاج الناس إلى حدود بسيطة مثل وجبات دون أجهزة وفترات عمل مركزة ووقت للمحادثة المباشرة. تكون التقنية أكثر قيمة عندما تدعم العلاقات الإنسانية بدلا من التحكم فيها.`,
      ideas: ["مزايا الاتصال عبر المسافة", "مخاطر العزلة والتشتت والمقارنة", "الحل حدود عملية لا رفض التقنية"],
      writing: "Does technology make people less social? Give a balanced response with examples.",
      speaking: ["How does technology help relationships?", "When does technology cause isolation?", "What digital boundary would you recommend?"]
    },
    {
      id: "teamwork",
      title: "العمل الجماعي والقيادة",
      englishTitle: "Teamwork and Leadership",
      words: "teamwork · leadership · collaborate · responsibility · goal",
      passage: `Strong teamwork does not happen simply because people are placed in the same group. A team needs a shared goal, clear responsibilities, and honest communication. The leader should provide direction while allowing members to contribute their expertise. When a problem occurs, blaming individuals usually reduces trust and hides useful information. A better response is to ask what happened, why the process allowed it, and how the team can prevent it. Recognition is also important. People are more motivated when their effort is noticed. In complex services, no single person has all the knowledge required. Effective leadership therefore means connecting different skills and helping people make coordinated decisions.`,
      translation: `لا يحدث العمل الجماعي القوي لمجرد وضع الناس في مجموعة واحدة. يحتاج الفريق إلى هدف مشترك ومسؤوليات واضحة وتواصل صادق. يجب أن يقدم القائد الاتجاه مع السماح للأعضاء بالمشاركة بخبراتهم. عندما تحدث مشكلة يقلل لوم الأفراد الثقة ويخفي معلومات مفيدة. الاستجابة الأفضل هي سؤال ماذا حدث ولماذا سمحت العملية به وكيف يمنعه الفريق. كما أن التقدير مهم. يزداد دافع الناس عندما يُلاحظ جهدهم. في الخدمات المعقدة لا يملك شخص واحد كل المعرفة المطلوبة. لذلك تعني القيادة الفعالة ربط المهارات المختلفة ومساعدة الناس على اتخاذ قرارات منسقة.`,
      ideas: ["هدف مشترك وأدوار واضحة", "حل المشكلات دون لوم", "القائد يربط الخبرات ويقدر الجهد"],
      writing: "What makes a team effective? Explain the leader's role and the members' responsibilities.",
      speaking: ["Describe a successful team you joined.", "How should leaders respond to mistakes?", "What motivates team members?"]
    }
  ];

  const WRITING_MODELS = [
    {
      id: "photo-market",
      title: "وصف صورة: سوق خارجي",
      task: "Write About the Photo · 60 seconds",
      prompt: "Describe a photo of a busy outdoor market.",
      structure: "مشهد عام ← شخص أو فعل واضح ← الخلفية والأجواء ← استنتاج حذر",
      model: `This image shows a busy outdoor market on a bright day. Several people are walking between small stalls, while a vendor in the foreground is arranging fresh fruit. In the background, colorful signs and narrow buildings make the area look lively. The people appear relaxed, so this may be a popular local market rather than a formal event.`,
      translation: `تظهر الصورة سوقا خارجيا مزدحما في يوم مشرق. يمشي عدة أشخاص بين الأكشاك الصغيرة بينما يرتب بائع في مقدمة الصورة فاكهة طازجة. وفي الخلفية تجعل اللافتات الملونة والمباني الضيقة المكان حيويا. يبدو الناس مرتاحين. لذلك قد يكون هذا سوقا محليا مشهورا وليس فعالية رسمية.`,
      note: "56 كلمة. استخدم الاستمرار للأفعال الموجودة في الصورة. استخدم may أو appear عند الاستنتاج."
    },
    {
      id: "photo-team",
      title: "وصف صورة: فريق داخل مكتب",
      task: "Write About the Photo · 60 seconds",
      prompt: "Describe a photo of coworkers around a table.",
      structure: "المكان ← الأشخاص ← ما يفعلونه ← غرض محتمل",
      model: `The photo depicts a small team sitting around a table in a modern office. One woman is pointing at a laptop, and the others are looking at the screen carefully. Papers and notebooks are spread across the table. The bright room and focused expressions suggest that they are discussing a project or solving a work-related problem together.`,
      translation: `تصور الصورة فريقا صغيرا يجلس حول طاولة في مكتب حديث. تشير امرأة إلى جهاز محمول وينظر الآخرون إلى الشاشة بعناية. تنتشر الأوراق والدفاتر على الطاولة. توحي الغرفة المضيئة وتعابير التركيز بأنهم يناقشون مشروعا أو يحلون مشكلة مرتبطة بالعمل معا.`,
      note: "54 كلمة. لا تكتب قائمة أشياء. اربط الأشياء بالفعل والمعنى المحتمل."
    },
    {
      id: "interactive-challenge",
      title: "تحد تجاوزته",
      task: "Interactive Writing · Step 1 · 5 minutes",
      prompt: "Describe a challenge. Explain what happened, how you responded, and what you learned.",
      structure: "موقف مباشر ← المشكلة ← 3 إجراءات مرتبة ← النتيجة ← الدرس",
      model: `One of the most serious challenges I faced occurred when a hospital information system stopped working during a busy period. Electronic orders and patient records were suddenly unavailable, so normal work could not continue. My first priority was safety. I activated the downtime procedure and asked each department to move to paper documentation. I then coordinated with laboratory, pharmacy, and radiology teams to identify urgent requests and prevent anything critical from being missed. Meanwhile, the technical team investigated the failure and shared regular updates. The situation was stressful because decisions had to be made quickly with incomplete information. However, clear roles and calm communication kept the service operating until the system recovered. This experience taught me that leadership during a crisis is not about having every answer. It is about protecting the main priority, organizing people, and adapting the plan as new information becomes available.`,
      translation: `واجهت تحديا كبيرا عندما توقف نظام معلومات مستشفى خلال فترة مزدحمة. أصبحت الطلبات والسجلات الإلكترونية غير متاحة ولم يعد العمل المعتاد ممكنا. كانت السلامة أولويتي. فعلت إجراء التوقف وطلبت من الأقسام الانتقال إلى التوثيق الورقي. ثم نسقت مع المختبر والصيدلية والأشعة لتحديد الطلبات العاجلة ومنع فقد أي حالة حرجة. وفي الوقت نفسه بحث الفريق التقني سبب العطل وقدم تحديثات منتظمة. كان الموقف ضاغطا لأن القرارات كانت مطلوبة بسرعة مع معلومات ناقصة. لكن الأدوار الواضحة والتواصل الهادئ حافظا على استمرار الخدمة حتى استعادة النظام. تعلمت أن القيادة في الأزمة ليست امتلاك كل الإجابات بل حماية الأولوية وتنظيم الناس وتعديل الخطة مع ظهور معلومات جديدة.`,
      note: "لا تحفظ النص. احفظ التسلسل: حدث ← خطر ← إجراء ← تنسيق ← نتيجة ← درس."
    },
    {
      id: "followup-challenge",
      title: "متابعة التحدي",
      task: "Interactive Writing · Step 2 · 3 minutes",
      prompt: "What unexpected obstacles appeared and how did you handle them?",
      structure: "اربط بالجواب الأول ← عقبتان ← تعديل عملي ← أثر التعديل",
      model: `One unexpected obstacle was that different departments had slightly different paper procedures. This created a risk of missing information during handoffs. To solve it, we agreed on one minimum set of details that every request had to include. Another difficulty was deciding which cases should be handled first. I asked clinical teams to identify urgent patients and created a simple priority list. These changes did not remove all pressure, but they made communication more consistent and helped staff focus on the most important work.`,
      translation: `كانت إحدى العقبات غير المتوقعة اختلاف الإجراءات الورقية قليلا بين الأقسام. صنع ذلك خطرا لفقد المعلومات أثناء تسليم العمل. ولحل المشكلة اتفقنا على حد أدنى موحد من البيانات في كل طلب. وكانت الصعوبة الأخرى تحديد الحالات التي يجب خدمتها أولا. طلبت من الفرق السريرية تحديد المرضى العاجلين وأنشأت قائمة أولوية بسيطة. لم تزل هذه التغييرات كل الضغط لكنها جعلت التواصل أكثر اتساقا وساعدت الموظفين على التركيز في العمل الأهم.`,
      note: "ابدأ من نقطة لم تغطها في Step 1. لا تعيد الفقرة الأولى بصياغة أخرى."
    },
    {
      id: "opinion-technology",
      title: "هل التقنية تقلل التواصل؟",
      task: "Interactive Writing or Writing Sample",
      prompt: "Does technology make people less social?",
      structure: "موقف متوازن ← فائدة بمثال ← خطر بمثال ← قاعدة استخدام ← خاتمة",
      model: `Technology does not automatically make people less social. Its effect depends on how it is used. On the positive side, messaging and video calls allow families, friends, and coworkers to communicate across distance. This is especially valuable when travel is difficult or teams work in different locations. However, technology can weaken relationships when online contact replaces meaningful conversation. Constant notifications also interrupt attention and make people feel that others are not listening. In my view, the solution is not to reject digital tools. People should use them with clear boundaries, such as device-free meals and focused time for face-to-face discussion. Overall, technology is most beneficial when it removes distance without removing attention. It should support human relationships rather than become a substitute for them.`,
      translation: `لا تجعل التقنية الناس أقل اجتماعية بصورة تلقائية. يعتمد أثرها على طريقة استخدامها. تسمح الرسائل ومكالمات الفيديو للعائلات والأصدقاء والزملاء بالتواصل عبر المسافات. وتزداد فائدتها عندما يكون السفر صعبا أو تعمل الفرق في مواقع مختلفة. لكن التقنية قد تضعف العلاقات عندما يحل الاتصال الرقمي محل الحديث ذي المعنى. كما تقطع الإشعارات الانتباه وتجعل الآخرين يشعرون بعدم الاستماع إليهم. الحل في رأيي ليس رفض الأدوات الرقمية. يجب استخدامها بحدود واضحة مثل الوجبات دون أجهزة ووقت مركز للمحادثة المباشرة. تكون التقنية أكثر فائدة عندما تزيل المسافة دون أن تزيل الانتباه.`,
      note: "الجواب المتوازن أقوى من رأي مطلق. اجعل موقفك واضحا من أول جملة."
    },
    {
      id: "opinion-travel",
      title: "السفر وفهم الثقافات",
      task: "Interactive Writing or Writing Sample",
      prompt: "Is travel important for understanding other cultures?",
      structure: "موقف ← فائدتان ← حد أو عيب ← بديل ← خلاصة",
      model: `I believe travel is one of the most effective ways to understand another culture because it turns abstract information into direct experience. Visitors observe how people communicate, organize daily life, and express respect. They also learn to adapt when familiar habits do not work. This can reduce unfair assumptions and improve communication between people from different backgrounds. Nevertheless, travel can be expensive and is not available to everyone. Books, documentaries, online discussions, and local cultural events are valuable alternatives. They may not create the same emotional memory, but they still expand knowledge. For this reason, travel should be encouraged when possible, but it should not be treated as the only path to cultural understanding. The real goal is curiosity, respect, and a willingness to question our own assumptions.`,
      translation: `أرى أن السفر من أكثر الطرق فاعلية لفهم ثقافة أخرى لأنه يحول المعلومات المجردة إلى تجربة مباشرة. يلاحظ الزوار طريقة تواصل الناس وتنظيم الحياة اليومية والتعبير عن الاحترام. كما يتعلمون التكيف عندما لا تنجح العادات المألوفة. قد يقلل ذلك الافتراضات غير العادلة ويحسن التواصل بين أصحاب الخلفيات المختلفة. مع ذلك قد يكون السفر مكلفا وغير متاح للجميع. تعد الكتب والأفلام الوثائقية والنقاشات الرقمية والفعاليات المحلية بدائل قيمة. قد لا تصنع الذاكرة العاطفية نفسها لكنها توسع المعرفة. لذلك يجب تشجيع السفر عند الإمكان دون اعتباره الطريق الوحيد للفهم الثقافي. الهدف الحقيقي هو الفضول والاحترام ومراجعة افتراضاتنا.`,
      note: "استخدم nevertheless لعرض الحد. ثم قدم بديلا حتى يكون جوابك متكاملا."
    },
    {
      id: "opinion-happiness",
      title: "السعادة مقابل المال",
      task: "Interactive Writing or Writing Sample",
      prompt: "Should people focus on happiness or financial success?",
      structure: "ارفض الثنائية ← دور المال ← حدود المال ← تعريفك للنجاح",
      model: `People should not be forced to choose completely between happiness and financial success. Money matters because it provides housing, healthcare, education, and protection from unexpected problems. Financial insecurity can create serious stress. At the same time, a high income does not guarantee health, close relationships, or a sense of purpose. The balance may also change during life. A young professional may focus on building experience and savings, while a parent may later value flexible time more. In my opinion, success means having enough financial stability to make responsible choices while protecting health, family relationships, and personal growth. A person who earns more but has no time or energy to live meaningfully may be successful on paper, but not in reality.`,
      translation: `لا يجب إجبار الناس على الاختيار الكامل بين السعادة والنجاح المالي. المال مهم لأنه يوفر السكن والرعاية الصحية والتعليم والحماية من المشكلات المفاجئة. وقد يصنع عدم الأمان المالي ضغطا كبيرا. وفي الوقت نفسه لا يضمن الدخل المرتفع الصحة أو العلاقات القريبة أو الشعور بالغاية. قد يتغير التوازن خلال الحياة أيضا. قد يركز الشاب على بناء الخبرة والادخار ثم يقدر الوالد المرونة في الوقت لاحقا. في رأيي النجاح هو استقرار مالي كاف لاتخاذ خيارات مسؤولة مع حماية الصحة وعلاقات الأسرة والنمو الشخصي. من يكسب أكثر دون وقت أو طاقة لحياة ذات معنى قد يكون ناجحا على الورق فقط.`,
      note: "ابدأ برفض الاختيار المصطنع بين طرفين. هذا يعطيك مساحة لحجة متوازنة."
    },
    {
      id: "opinion-online",
      title: "التعليم عبر الإنترنت",
      task: "Writing Sample · 5 minutes",
      prompt: "When is online learning the best option?",
      structure: "ميزة رئيسية ← من يستفيد ← حدود ← شروط النجاح ← خاتمة",
      model: `Online learning is the best option when distance, work, health, or family responsibilities make regular classroom attendance difficult. It gives learners flexible access to lessons and allows them to repeat complex material. A professional can study after work, while a student in a remote area can learn from an expert who is not locally available. However, online education is not automatically effective. Learners need clear deadlines, feedback, live discussion, and opportunities to apply knowledge. Some practical subjects also require laboratories or supervised training. For these reasons, online learning works best as a carefully designed system rather than a collection of recorded videos. When it combines flexibility with interaction and accountability, it can be as useful as classroom learning and more accessible for many people.`,
      translation: `يكون التعليم عبر الإنترنت الخيار الأفضل عندما تجعل المسافة أو العمل أو الصحة أو المسؤوليات العائلية حضور الفصل صعبا. فهو يمنح المتعلم وصولا مرنا للدروس ويسمح بتكرار المحتوى المعقد. يستطيع الموظف الدراسة بعد العمل كما يستطيع الطالب في منطقة بعيدة التعلم من خبير غير متاح محليا. لكن التعليم الإلكتروني ليس فعالا بصورة تلقائية. يحتاج المتعلم إلى مواعيد واضحة وتغذية راجعة ونقاش مباشر وفرص لتطبيق المعرفة. كما تحتاج بعض المواد العملية مختبرات أو إشرافا. لذلك ينجح التعليم الرقمي كنظام مصمم بعناية لا كمجموعة فيديوهات. عندما يجمع المرونة مع التفاعل والمساءلة قد يكون مفيدا مثل الفصل وأكثر إتاحة لكثير من الناس.`,
      note: "استخدم أمثلة لفئات محددة. الموظف. الطالب البعيد. المادة العملية."
    },
    {
      id: "summary-professor",
      title: "تلخيص محادثة مع أستاذ",
      task: "Interactive Listening Summary · 75 seconds",
      prompt: "A student asked a professor for help understanding an algorithm and discussed resources and testing.",
      structure: "من تحدث مع من ولماذا ← المشكلة ← التوضيح أو الحل ← الخطوة التالية",
      model: `In this conversation, I asked my professor for help understanding the logic of an algorithm. I explained that I was confused about how the steps produced the final result, so the professor used a clear example and advised me to test the algorithm gradually. The professor also recommended the textbook and several articles, and I decided to review those resources before completing my assignment.`,
      translation: `في هذه المحادثة طلبت من أستاذي مساعدة لفهم منطق خوارزمية. أوضحت أنني محتار في طريقة وصول الخطوات إلى النتيجة النهائية. لذلك استخدم الأستاذ مثالا واضحا ونصحني باختبار الخوارزمية تدريجيا. كما أوصى بالكتاب وعدة مقالات. وقررت مراجعة هذه المصادر قبل إكمال الواجب.`,
      note: "3 جمل تكفي. الماضي في أفعال المحادثة. لا تضف رأيا أو تفاصيل لم تسمعها."
    },
    {
      id: "healthy-city",
      title: "مدينة تدعم الصحة",
      task: "Speaking or Writing Sample",
      prompt: "What makes a city a healthy place to live?",
      structure: "تعريف ← 3 عناصر مترابطة ← مشكلة حالية ← أولوية عملية",
      model: `A healthy city is one that makes daily healthy choices practical. Safe sidewalks and shaded paths encourage residents to walk instead of using a car for every short journey. Parks provide space for exercise, family activities, and recovery from stress. Reliable public transport reduces traffic and helps people reach work, education, and healthcare. Access to fresh food is also essential. In contrast, long travel times, air pollution, and poor public spaces can damage both physical and mental health. If I could choose one priority, I would improve connected walking paths around homes, schools, and services. This change would support activity every day rather than only during planned exercise. Healthy urban design should become part of normal life.`,
      translation: `المدينة الصحية هي التي تجعل الخيارات اليومية الصحية عملية. تشجع الأرصفة الآمنة والمسارات المظللة السكان على المشي بدلا من استخدام السيارة في كل رحلة قصيرة. توفر الحدائق مساحة للرياضة ونشاط العائلة والتعافي من الضغط. يقلل النقل العام الموثوق الازدحام ويساعد الناس على الوصول إلى العمل والتعليم والرعاية الصحية. كما أن الوصول إلى الطعام الطازج أساسي. وعلى العكس قد يضر طول التنقل وتلوث الهواء وضعف الأماكن العامة بالصحة البدنية والنفسية. لو اخترت أولوية فسأحسن مسارات المشي المتصلة حول المنازل والمدارس والخدمات. يدعم ذلك الحركة اليومية لا الرياضة المخططة فقط.`,
      note: "اختر أولوية واحدة في النهاية. هذا يجعل الجواب محددا وقابلا للدفاع."
    }
  ];

  const GRAMMAR = [
    {
      title: "Past simple",
      rule: "استخدمه لحدث انتهى في الماضي. لا تستخدم was قبل فعل ماض بسيط.",
      wrong: "The system was went down.",
      right: "The system went down yesterday."
    },
    {
      title: "Past continuous",
      rule: "استخدم was أو were مع الفعل ing لحدث كان مستمرا عندما قطعه حدث آخر.",
      wrong: "I worked when the system went down.",
      right: "I was working when the system went down."
    },
    {
      title: "Past perfect",
      rule: "استخدم had مع التصريف الثالث لحدث انتهى قبل حدث ماض آخر.",
      wrong: "When I arrived, they finished dinner.",
      right: "When I arrived, they had finished dinner."
    },
    {
      title: "After and then",
      rule: "بعد after اذكر الحدث الذي وقع أولا. استخدم then لتسلسل بسيط.",
      wrong: "After I slept, I finished my work.",
      right: "After I finished my work, I slept."
    },
    {
      title: "Subject and verb agreement",
      rule: "مع he و she و it في المضارع البسيط أضف s للفعل. بعد does لا تضف s.",
      wrong: "She does not likes online learning.",
      right: "She does not like online learning."
    },
    {
      title: "Articles",
      rule: "استخدم a لشيء مفرد غير محدد. استخدم the لشيء محدد معروف.",
      wrong: "I checked patient file when system went down.",
      right: "I was checking a patient file when the system went down."
    },
    {
      title: "Adjective and adverb",
      rule: "الصفة تصف الاسم. الظرف يصف الفعل وغالبا ينتهي بـ ly.",
      wrong: "She spoke quiet during the meeting.",
      right: "She spoke quietly during the meeting."
    },
    {
      title: "Prepositions",
      rule: "قل listen to. قل arrive at لمكان صغير و arrive in لمدينة أو دولة. قل come into the room.",
      wrong: "I listened the recording and came in the room.",
      right: "I listened to the recording and came into the room."
    },
    {
      title: "Present perfect",
      rule: "استخدم have أو has مع التصريف الثالث لتجربة أو تغير مرتبط بالحاضر.",
      wrong: "I improved my English since last month.",
      right: "I have improved my English since last month."
    },
    {
      title: "Conditionals",
      rule: "للخيار الخيالي استخدم If + past ثم would + base verb.",
      wrong: "If I will have more time, I will practice.",
      right: "If I had more time, I would practice every day."
    },
    {
      title: "Because and however",
      rule: "because تربط السبب داخل الجملة. however تبدأ تضادا جديدا ويجب أن يتبعها معنى كامل.",
      wrong: "However the system was useful, it had risks.",
      right: "The system was useful. However, it also created security risks."
    },
    {
      title: "Common work phrases",
      rule: "لا تقل made control on data. استخدم protected أو maintained أو kept services running حسب المعنى.",
      wrong: "We made control on all patient data.",
      right: "We protected the data and kept patient care running."
    },
    {
      title: "Countable and uncountable",
      rule: "information و advice و equipment غير معدودة. لا تجمعها بـ s.",
      wrong: "The professor gave me many advices.",
      right: "The professor gave me useful advice."
    },
    {
      title: "Relative clauses",
      rule: "استخدم which أو who لإضافة تركيب متنوع وواضح.",
      wrong: "The project improved access. It changed my perspective.",
      right: "The project improved access, which changed my perspective."
    },
    {
      title: "Punctuation",
      rule: "ابدأ بحرف كبير. اختم بنقطة. لا تربط جملتين كاملتين بفاصلة إنجليزية فقط.",
      wrong: "the system recovered, we reviewed the incident",
      right: "The system recovered. We then reviewed the incident."
    }
  ];

  const STORAGE_KEY = "detStudyProgress.v1";
  let studyState = { known: {}, topics: {} };
  let unknownOnly = false;
  let currentTopic = TOPICS[0].id;
  let currentWriting = WRITING_MODELS[0].id;
  let timerSeconds = 35;
  let timerRemaining = 35;
  let timerHandle = null;

  const byId = (id) => document.getElementById(id);
  const escapeHtml = (value) => String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

  function loadStudyState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      if (saved && typeof saved === "object") {
        studyState.known = saved.known && typeof saved.known === "object" ? saved.known : {};
        studyState.topics = saved.topics && typeof saved.topics === "object" ? saved.topics : {};
      }
    } catch (error) {
      studyState = { known: {}, topics: {} };
    }
  }

  function saveStudyState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(studyState));
    } catch (error) {
      return false;
    }
    return true;
  }

  function setTab(name, updateHash = true) {
    const pane = byId("study-" + name);
    if (!pane) return;
    document.querySelectorAll("[data-study-tab]").forEach((button) => {
      button.setAttribute("aria-selected", String(button.dataset.studyTab === name));
    });
    document.querySelectorAll(".study-pane").forEach((pane) => pane.classList.remove("active"));
    pane.classList.add("active");
    if (updateHash && window.history && window.history.replaceState) {
      window.history.replaceState(null, "", "#" + name);
    }
  }

  function setupTabs() {
    document.querySelectorAll("[data-study-tab]").forEach((button) => {
      button.addEventListener("click", () => {
        setTab(button.dataset.studyTab);
        byId("study").scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
    document.querySelectorAll("[data-open-study]").forEach((button) => {
      button.addEventListener("click", () => {
        setTab(button.dataset.openStudy);
        byId("study").scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
    const requestedTab = window.location.hash.replace("#", "");
    if (requestedTab && byId("study-" + requestedTab)) setTab(requestedTab, false);
  }

  function setupVocabControls() {
    const select = byId("vocabCategory");
    select.innerHTML = '<option value="all">كل التصنيفات</option>' + Object.keys(CATEGORIES)
      .map((key) => '<option value="' + key + '">' + CATEGORIES[key] + "</option>")
      .join("");
    byId("vocabSearch").addEventListener("input", renderVocab);
    select.addEventListener("change", renderVocab);
    byId("vocabUnknown").addEventListener("click", () => {
      unknownOnly = !unknownOnly;
      byId("vocabUnknown").classList.toggle("primary", unknownOnly);
      byId("vocabUnknown").textContent = unknownOnly ? "إظهار الكل" : "غير المتقن فقط";
      renderVocab();
    });
  }

  function renderVocab() {
    const query = byId("vocabSearch").value.trim().toLowerCase();
    const category = byId("vocabCategory").value;
    const filtered = VOCAB.filter((item) => {
      if (category !== "all" && item.category !== category) return false;
      if (unknownOnly && studyState.known[item.id]) return false;
      if (!query) return true;
      return item.word.toLowerCase().includes(query) || item.ar.includes(query) || item.example.toLowerCase().includes(query);
    });

    const box = byId("vocabList");
    box.innerHTML = "";
    filtered.forEach((item) => {
      const card = document.createElement("article");
      card.className = "vocab-card" + (studyState.known[item.id] ? " known" : "");
      card.innerHTML =
        '<div class="vocab-top"><span class="vocab-word">' + escapeHtml(item.word) + "</span>" +
        '<span class="vocab-cat">' + escapeHtml(CATEGORIES[item.category]) + "</span>" +
        '<button class="icon-btn" type="button" aria-label="نطق الكلمة">🔊</button></div>' +
        '<div class="vocab-ar">' + escapeHtml(item.ar) + "</div>" +
        '<div class="vocab-ex">' + escapeHtml(item.example) + "</div>" +
        '<div style="margin-top:9px"><button class="known-btn" type="button">' +
        (studyState.known[item.id] ? "✓ متقنة" : "علّمها متقنة") + "</button></div>";

      card.querySelector(".icon-btn").addEventListener("click", () => speak(item.word));
      card.querySelector(".known-btn").addEventListener("click", () => {
        studyState.known[item.id] = !studyState.known[item.id];
        saveStudyState();
        renderVocab();
      });
      box.appendChild(card);
    });

    if (!filtered.length) {
      box.innerHTML = '<div class="note a"><b>لا توجد نتيجة</b>غيّر كلمة البحث أو التصنيف.</div>';
    }
    updateVocabProgress();
  }

  function updateVocabProgress() {
    const done = VOCAB.filter((item) => studyState.known[item.id]).length;
    const pct = Math.round((done / VOCAB.length) * 100);
    byId("vocabCount").textContent = done + " من " + VOCAB.length + " كلمة";
    byId("vocabPct").textContent = pct + "%";
    byId("vocabBar").style.width = pct + "%";
    const overview = byId("overviewVocabProgress");
    if (overview) overview.textContent = done ? done + " من " + VOCAB.length + " متقنة ←" : "ابدأ المذاكرة ←";
  }

  function speak(word) {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = "en-US";
    utterance.rate = 0.82;
    window.speechSynthesis.speak(utterance);
  }

  function renderTopics() {
    const list = byId("topicList");
    list.innerHTML = "";
    TOPICS.forEach((topic, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "topic-pick" + (topic.id === currentTopic ? " active" : "") +
        (studyState.topics[topic.id] ? " done" : "");
      button.textContent = (index + 1) + ". " + topic.title;
      button.addEventListener("click", () => {
        currentTopic = topic.id;
        renderTopics();
      });
      list.appendChild(button);
    });

    const topic = TOPICS.find((item) => item.id === currentTopic) || TOPICS[0];
    const isDone = !!studyState.topics[topic.id];
    byId("topicReader").innerHTML =
      "<h3>" + escapeHtml(topic.title) + ' <span class="en">' + escapeHtml(topic.englishTitle) + "</span></h3>" +
      '<div class="stats"><span><b>مفردات الموضوع:</b> ' + escapeHtml(topic.words) + "</span></div>" +
      "<h4>القطعة الإنجليزية</h4>" +
      '<div class="english-block">' + escapeHtml(topic.passage) + "</div>" +
      "<h4>الترجمة</h4>" +
      '<div class="arabic-block">' + escapeHtml(topic.translation) + "</div>" +
      "<h4>خطة الأفكار</h4>" +
      '<div class="idea-list">' + topic.ideas.map((idea) => "<div>" + escapeHtml(idea) + "</div>").join("") + "</div>" +
      "<h4>سؤال كتابة</h4>" +
      '<div class="prompt-box">' + escapeHtml(topic.writing) + "</div>" +
      "<h4>أسئلة تحدث</h4>" +
      '<div class="idea-list" style="direction:ltr;text-align:left">' + topic.speaking.map((prompt) => "<div>" + escapeHtml(prompt) + "</div>").join("") + "</div>" +
      '<div style="margin-top:14px"><button class="study-btn ' + (isDone ? "" : "primary") + '" id="topicDone" type="button">' +
      (isDone ? "✓ تمت مذاكرته" : "علّمه كمُذاكر") + "</button></div>";

    byId("topicDone").addEventListener("click", () => {
      studyState.topics[topic.id] = !studyState.topics[topic.id];
      saveStudyState();
      renderTopics();
    });
    updateTopicProgress();
  }

  function updateTopicProgress() {
    const done = TOPICS.filter((topic) => studyState.topics[topic.id]).length;
    const pct = Math.round((done / TOPICS.length) * 100);
    byId("topicCount").textContent = done + " من " + TOPICS.length + " موضوعا";
    byId("topicPct").textContent = pct + "%";
    byId("topicBar").style.width = pct + "%";
    const overview = byId("overviewTopicProgress");
    if (overview) overview.textContent = done ? done + " من " + TOPICS.length + " تمت مذاكرتها ←" : "ابدأ المذاكرة ←";
  }

  function renderWriting() {
    const list = byId("writingList");
    list.innerHTML = "";
    WRITING_MODELS.forEach((model, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "model-pick" + (model.id === currentWriting ? " active" : "");
      button.innerHTML = escapeHtml((index + 1) + ". " + model.title) + '<small style="display:block;color:var(--muted);margin-top:3px">' + escapeHtml(model.task) + "</small>";
      button.addEventListener("click", () => {
        currentWriting = model.id;
        renderWriting();
      });
      list.appendChild(button);
    });

    const model = WRITING_MODELS.find((item) => item.id === currentWriting) || WRITING_MODELS[0];
    byId("writingReader").innerHTML =
      "<h3>" + escapeHtml(model.title) + "</h3>" +
      '<div class="stats"><span><b>المهمة:</b> ' + escapeHtml(model.task) + "</span></div>" +
      "<h4>السؤال التدريبي</h4>" +
      '<div class="prompt-box">' + escapeHtml(model.prompt) + "</div>" +
      "<h4>الهيكل الذي تحفظه</h4>" +
      '<div class="idea-list"><div>' + escapeHtml(model.structure) + "</div></div>" +
      "<h4>النموذج الإنجليزي</h4>" +
      '<div class="english-block">' + escapeHtml(model.model) + "</div>" +
      "<h4>الترجمة</h4>" +
      '<div class="arabic-block">' + escapeHtml(model.translation) + "</div>" +
      '<div class="note g"><b>طريقة الاستخدام</b>' + escapeHtml(model.note) + "</div>";
  }

  const SPEAKING_PROMPTS = TOPICS.flatMap((topic) => topic.speaking.map((prompt) => ({ topic: topic.title, prompt })));

  function setupSpeaking() {
    document.querySelectorAll("[data-seconds]").forEach((button) => {
      button.addEventListener("click", () => {
        document.querySelectorAll("[data-seconds]").forEach((item) => item.classList.remove("primary"));
        button.classList.add("primary");
        timerSeconds = Number(button.dataset.seconds);
        resetTimer();
      });
    });
    const firstTimerButton = document.querySelector('[data-seconds="35"]');
    if (firstTimerButton) firstTimerButton.classList.add("primary");
    byId("newPrompt").addEventListener("click", newSpeakingPrompt);
    byId("timerStart").addEventListener("click", toggleTimer);
    byId("timerReset").addEventListener("click", resetTimer);
    newSpeakingPrompt();
    renderSpeakingGuide();
  }

  function newSpeakingPrompt() {
    const item = SPEAKING_PROMPTS[Math.floor(Math.random() * SPEAKING_PROMPTS.length)];
    byId("speakingPrompt").innerHTML = '<small style="display:block;color:var(--teal);direction:rtl;text-align:right">' +
      escapeHtml(item.topic) + "</small>" + escapeHtml(item.prompt);
    resetTimer();
  }

  function renderSpeakingGuide() {
    byId("speakingGuide").innerHTML =
      "<h3>هيكل الجواب حسب الوقت</h3>" +
      '<div class="grammar-grid">' +
      '<div class="grammar-card"><h4>35 ثانية · OREO</h4><div class="english-block">Opinion → Reason → Example → Opinion</div><p>موقف واضح. سبب واحد. مثال واحد. خاتمة قصيرة.</p></div>' +
      '<div class="grammar-card"><h4>90 ثانية</h4><div class="english-block">Answer → Point 1 + example → Point 2 + result → Closing</div><p>اختر نقطتين فقط. طور كل نقطة بمثال أو نتيجة.</p></div>' +
      '<div class="grammar-card"><h4>180 ثانية</h4><div class="english-block">Direct answer → 3 developed points → personal story → conclusion</div><p>استخدم قصة حقيقية واحدة. لا تحول الجواب إلى قائمة عامة.</p></div>' +
      '<div class="grammar-card"><h4>عبارات إنقاذ طبيعية</h4><div class="english-block">I have not considered this before, but...<br>One practical example is...<br>From my experience...<br>Overall, I would say...</div></div>' +
      "</div>" +
      "<h3 style=\"margin-top:18px\">قصصك الجاهزة كأفكار</h3>" +
      '<div class="idea-list"><div><b>تحد:</b> تعطل نظام المستشفى. تفعيل التوقف. تنسيق الفرق. استمرار الخدمة. درس الاستعداد.</div>' +
      '<div><b>إنجاز:</b> مراجعة مسار الأشعة الصوتية. تغيير الأولويات والمتابعة. خفض الانتظار من نحو 300 يوم إلى قرابة 10 أيام.</div>' +
      '<div><b>تعلم جديد:</b> تطوير الإنجليزية عبر إجابات قصيرة وتسجيل الصوت والتصحيح المباشر.</div>' +
      '<div><b>قرار بمعلومات ناقصة:</b> فصل الحقائق عن الافتراضات. حماية السلامة. استشارة الخبراء. تجهيز بديل.</div>' +
      '<div><b>تقنية:</b> الأنظمة تسرع الخدمة لكنها تحتاج أمنا سيبرانيا وخطة توقف.</div>' +
      '<div><b>قيادة:</b> هدف مشترك وأدوار واضحة وتواصل دون لوم ومراجعة بعد الحدث.</div></div>';
  }

  function toggleTimer() {
    if (timerHandle) {
      clearInterval(timerHandle);
      timerHandle = null;
      byId("timerStart").textContent = "استئناف";
      return;
    }
    if (timerRemaining <= 0) timerRemaining = timerSeconds;
    byId("timerStart").textContent = "إيقاف";
    timerHandle = setInterval(() => {
      timerRemaining -= 1;
      paintTimer();
      if (timerRemaining <= 0) {
        clearInterval(timerHandle);
        timerHandle = null;
        byId("timerStart").textContent = "ابدأ من جديد";
        if ("vibrate" in navigator) navigator.vibrate([120, 80, 120]);
      }
    }, 1000);
  }

  function resetTimer() {
    if (timerHandle) clearInterval(timerHandle);
    timerHandle = null;
    timerRemaining = timerSeconds;
    byId("timerStart").textContent = "ابدأ";
    paintTimer();
  }

  function paintTimer() {
    const minutes = Math.floor(timerRemaining / 60);
    const seconds = timerRemaining % 60;
    byId("timerClock").textContent = String(minutes).padStart(2, "0") + ":" + String(seconds).padStart(2, "0");
  }

  function renderGrammar() {
    byId("grammarGrid").innerHTML = GRAMMAR.map((item) =>
      '<article class="grammar-card"><h4>' + escapeHtml(item.title) + "</h4>" +
      "<p>" + escapeHtml(item.rule) + "</p>" +
      '<div class="fix" style="color:var(--red)">✕ ' + escapeHtml(item.wrong) + "</div>" +
      '<div class="fix" style="color:var(--green)">✓ ' + escapeHtml(item.right) + "</div></article>"
    ).join("");
  }

  function initStudyCenter() {
    if (!byId("study")) return;
    loadStudyState();
    setupTabs();
    setupVocabControls();
    renderVocab();
    renderTopics();
    renderWriting();
    setupSpeaking();
    renderGrammar();
  }

  initStudyCenter();
})();
