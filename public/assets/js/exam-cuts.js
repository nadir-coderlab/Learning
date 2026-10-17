// مولَّد آليًا من scripts/cut.py — قطع الأسئلة والأجوبة من أوراق الاختبار (لا تعدّله باليد)
export const CUT_BASE = "/assets/img/exams/tg2/cut/";
export const BOARDS = [
 {
  "paper": "A",
  "part": 0,
  "head": {
   "s": "A0-head.webp",
   "w": 306,
   "h": 47
  },
  "qs": [
   {
    "id": "A-g1",
    "kind": "slot",
    "q": {
     "s": "A-g1-q.webp",
     "w": 337,
     "h": 29
    },
    "ans": "a_key",
    "solved": {
     "s": "A-g1-s.webp",
     "w": 337,
     "h": 29
    }
   },
   {
    "id": "A-g2",
    "kind": "slot",
    "q": {
     "s": "A-g2-q.webp",
     "w": 337,
     "h": 30
    },
    "ans": "a_football",
    "solved": {
     "s": "A-g2-s.webp",
     "w": 337,
     "h": 30
    }
   },
   {
    "id": "A-g3",
    "kind": "slot",
    "q": {
     "s": "A-g3-q.webp",
     "w": 337,
     "h": 29
    },
    "ans": "a_sept",
    "solved": {
     "s": "A-g3-s.webp",
     "w": 337,
     "h": 29
    }
   },
   {
    "id": "A-g5",
    "kind": "slot",
    "q": {
     "s": "A-g5-q.webp",
     "w": 337,
     "h": 30
    },
    "ans": "a_bed",
    "solved": {
     "s": "A-g5-s.webp",
     "w": 337,
     "h": 30
    }
   }
  ],
  "tray": [
   {
    "s": "A-a0.webp",
    "w": 143,
    "h": 25,
    "k": "a_sept"
   },
   {
    "s": "A-a1.webp",
    "w": 143,
    "h": 26,
    "k": "a_key"
   },
   {
    "s": "A-a2.webp",
    "w": 143,
    "h": 25,
    "k": "a_bed"
   },
   {
    "s": "A-a3.webp",
    "w": 143,
    "h": 26,
    "k": "a_football"
   }
  ]
 },
 {
  "paper": "A",
  "part": 1,
  "head": {
   "s": "A1-head.webp",
   "w": 242,
   "h": 47
  },
  "qs": [
   {
    "id": "A-o1",
    "kind": "order",
    "q": {
     "s": "A-o1-q.webp",
     "w": 268,
     "h": 25
    },
    "pieces": [
     {
      "s": "A-o1-w0.webp",
      "w": 52.4,
      "h": 17.0,
      "k": "weekend"
     },
     {
      "s": "A-o1-w1.webp",
      "w": 17.8,
      "h": 17.0,
      "k": "go"
     },
     {
      "s": "A-o1-w2.webp",
      "w": 52.9,
      "h": 17.0,
      "k": "shopping"
     },
     {
      "s": "A-o1-w3.webp",
      "w": 26.9,
      "h": 17.0,
      "k": "this"
     },
     {
      "s": "A-o1-w4.webp",
      "w": 23.1,
      "h": 17.0,
      "k": "will"
     },
     {
      "s": "A-o1-w5.webp",
      "w": 24.0,
      "h": 17.0,
      "k": "We"
     }
    ],
    "target": [
     "We",
     "will",
     "go",
     "shopping",
     "this",
     "weekend"
    ],
    "solved": {
     "s": "A-o1-s.webp",
     "w": 529,
     "h": 25
    }
   },
   {
    "id": "A-o2",
    "kind": "order",
    "q": {
     "s": "A-o2-q.webp",
     "w": 188,
     "h": 28
    },
    "pieces": [
     {
      "s": "A-o2-w0.webp",
      "w": 23.3,
      "h": 17.0,
      "k": "His"
     },
     {
      "s": "A-o2-w1.webp",
      "w": 23.1,
      "h": 17.0,
      "k": "not"
     },
     {
      "s": "A-o2-w2.webp",
      "w": 27.4,
      "h": 17.0,
      "k": "tidy"
     },
     {
      "s": "A-o2-w3.webp",
      "w": 32.5,
      "h": 17.0,
      "k": "room"
     },
     {
      "s": "A-o2-w4.webp",
      "w": 14.2,
      "h": 17.0,
      "k": "is"
     }
    ],
    "target": [
     "His",
     "room",
     "is",
     "not",
     "tidy"
    ],
    "solved": {
     "s": "A-o2-s.webp",
     "w": 529,
     "h": 30
    }
   }
  ]
 },
 {
  "paper": "A",
  "part": 2,
  "head": {
   "s": "A2-head.webp",
   "w": 194,
   "h": 45
  },
  "qs": [
   {
    "id": "A-t1",
    "kind": "pick",
    "q": {
     "s": "A-t1-q.webp",
     "w": 383,
     "h": 65
    },
    "opts": [
     {
      "img": {
       "s": "A-t1-o0.webp",
       "w": 22.5,
       "h": 28.0
      },
      "ok": false
     },
     {
      "img": {
       "s": "A-t1-o1.webp",
       "w": 24.1,
       "h": 28.0
      },
      "ok": true
     }
    ],
    "solved": {
     "s": "A-t1-s.webp",
     "w": 383,
     "h": 65
    }
   },
   {
    "id": "A-t2",
    "kind": "pick",
    "q": {
     "s": "A-t2-q.webp",
     "w": 383,
     "h": 68
    },
    "opts": [
     {
      "img": {
       "s": "A-t2-o0.webp",
       "w": 22.5,
       "h": 28.0
      },
      "ok": false
     },
     {
      "img": {
       "s": "A-t2-o1.webp",
       "w": 24.1,
       "h": 28.0
      },
      "ok": true
     }
    ],
    "solved": {
     "s": "A-t2-s.webp",
     "w": 383,
     "h": 68
    }
   },
   {
    "id": "A-t3",
    "kind": "pick",
    "q": {
     "s": "A-t3-q.webp",
     "w": 383,
     "h": 77
    },
    "opts": [
     {
      "img": {
       "s": "A-t3-o0.webp",
       "w": 22.5,
       "h": 28.1
      },
      "ok": true
     },
     {
      "img": {
       "s": "A-t3-o1.webp",
       "w": 24.1,
       "h": 28.1
      },
      "ok": false
     }
    ],
    "solved": {
     "s": "A-t3-s.webp",
     "w": 383,
     "h": 77
    }
   },
   {
    "id": "A-t4",
    "kind": "pick",
    "q": {
     "s": "A-t4-q.webp",
     "w": 383,
     "h": 84
    },
    "opts": [
     {
      "img": {
       "s": "A-t4-o0.webp",
       "w": 22.5,
       "h": 28.1
      },
      "ok": false
     },
     {
      "img": {
       "s": "A-t4-o1.webp",
       "w": 24.1,
       "h": 28.1
      },
      "ok": true
     }
    ],
    "solved": {
     "s": "A-t4-s.webp",
     "w": 383,
     "h": 84
    }
   }
  ]
 },
 {
  "paper": "A",
  "part": 3,
  "head": {
   "s": "A3-head.webp",
   "w": 209,
   "h": 44
  },
  "qs": [
   {
    "id": "A-tm1",
    "kind": "pick",
    "q": {
     "s": "A-tm1-q.webp",
     "w": 366,
     "h": 23
    },
    "opts": [
     {
      "img": {
       "s": "A-tm1-o0.webp",
       "w": 35.6,
       "h": 19.9
      },
      "ok": false
     },
     {
      "img": {
       "s": "A-tm1-o1.webp",
       "w": 51.3,
       "h": 19.9
      },
      "ok": true
     }
    ],
    "solved": {
     "s": "A-tm1-s.webp",
     "w": 366,
     "h": 23
    }
   },
   {
    "id": "A-tm2",
    "kind": "pick",
    "q": {
     "s": "A-tm2-q.webp",
     "w": 336,
     "h": 22
    },
    "opts": [
     {
      "img": {
       "s": "A-tm2-o0.webp",
       "w": 27.1,
       "h": 19.9
      },
      "ok": true
     },
     {
      "img": {
       "s": "A-tm2-o1.webp",
       "w": 29.9,
       "h": 19.9
      },
      "ok": false
     }
    ],
    "solved": {
     "s": "A-tm2-s.webp",
     "w": 336,
     "h": 22
    }
   },
   {
    "id": "A-tm3",
    "kind": "pick",
    "q": {
     "s": "A-tm3-q.webp",
     "w": 306,
     "h": 23
    },
    "opts": [
     {
      "img": {
       "s": "A-tm3-o0.webp",
       "w": 21.5,
       "h": 19.9
      },
      "ok": false
     },
     {
      "img": {
       "s": "A-tm3-o1.webp",
       "w": 26.2,
       "h": 19.9
      },
      "ok": true
     }
    ],
    "solved": {
     "s": "A-tm3-s.webp",
     "w": 306,
     "h": 23
    }
   },
   {
    "id": "A-cp1",
    "kind": "pick",
    "q": {
     "s": "A-cp1-q.webp",
     "w": 276,
     "h": 22
    },
    "opts": [
     {
      "img": {
       "s": "A-cp1-o0.webp",
       "w": 42.5,
       "h": 19.9
      },
      "ok": true
     },
     {
      "img": {
       "s": "A-cp1-o1.webp",
       "w": 49.2,
       "h": 19.9
      },
      "ok": false
     }
    ],
    "solved": {
     "s": "A-cp1-s.webp",
     "w": 276,
     "h": 22
    }
   }
  ]
 },
 {
  "paper": "A",
  "part": 4,
  "head": {
   "s": "A4-head.webp",
   "w": 478,
   "h": 95
  },
  "qs": [
   {
    "id": "A-v1",
    "kind": "slot",
    "q": {
     "s": "A-v1-q.webp",
     "w": 112,
     "h": 130
    },
    "ans": "ride",
    "solved": {
     "s": "A-v1-s.webp",
     "w": 112,
     "h": 130
    }
   },
   {
    "id": "A-v2",
    "kind": "slot",
    "q": {
     "s": "A-v2-q.webp",
     "w": 105,
     "h": 130
    },
    "ans": "snail",
    "solved": {
     "s": "A-v2-s.webp",
     "w": 105,
     "h": 130
    }
   },
   {
    "id": "A-v3",
    "kind": "slot",
    "q": {
     "s": "A-v3-q.webp",
     "w": 100,
     "h": 130
    },
    "ans": "layout",
    "solved": {
     "s": "A-v3-s.webp",
     "w": 100,
     "h": 130
    }
   },
   {
    "id": "A-v4",
    "kind": "slot",
    "q": {
     "s": "A-v4-q.webp",
     "w": 114,
     "h": 130
    },
    "ans": "Gate",
    "solved": {
     "s": "A-v4-s.webp",
     "w": 114,
     "h": 130
    }
   }
  ],
  "tray": [
   {
    "s": "A-vb0.webp",
    "w": 41.5,
    "h": 22.1,
    "k": "Gate"
   },
   {
    "s": "A-vb1.webp",
    "w": 36.1,
    "h": 22.1,
    "k": "ride"
   },
   {
    "s": "A-vb2.webp",
    "w": 51.0,
    "h": 22.1,
    "k": "layout"
   },
   {
    "s": "A-vb3.webp",
    "w": 39.4,
    "h": 22.1,
    "k": "snail"
   }
  ]
 },
 {
  "paper": "A",
  "part": 5,
  "head": {
   "s": "A5-head.webp",
   "w": 442,
   "h": 49
  },
  "qs": [
   {
    "id": "A-sp1",
    "kind": "slot",
    "q": {
     "s": "A-sp1-q.webp",
     "w": 125,
     "h": 139
    },
    "ans": "e",
    "solved": {
     "s": "A-sp1-s.webp",
     "w": 125,
     "h": 139
    }
   },
   {
    "id": "A-sp2",
    "kind": "slot",
    "q": {
     "s": "A-sp2-q.webp",
     "w": 138,
     "h": 139
    },
    "ans": "i",
    "solved": {
     "s": "A-sp2-s.webp",
     "w": 138,
     "h": 139
    }
   },
   {
    "id": "A-sp3",
    "kind": "slot",
    "q": {
     "s": "A-sp3-q.webp",
     "w": 125,
     "h": 139
    },
    "ans": "u",
    "solved": {
     "s": "A-sp3-s.webp",
     "w": 125,
     "h": 139
    }
   },
   {
    "id": "A-sp4",
    "kind": "slot",
    "q": {
     "s": "A-sp4-q.webp",
     "w": 118,
     "h": 139
    },
    "ans": "o",
    "solved": {
     "s": "A-sp4-s.webp",
     "w": 118,
     "h": 139
    }
   }
  ],
  "tray": [
   {
    "s": "A-sb0.webp",
    "w": 18.5,
    "h": 26.0,
    "k": "i"
   },
   {
    "s": "A-sb1.webp",
    "w": 18.5,
    "h": 26.0,
    "k": "o"
   },
   {
    "s": "A-sb2.webp",
    "w": 19.0,
    "h": 26.0,
    "k": "e"
   },
   {
    "s": "A-sb3.webp",
    "w": 18.3,
    "h": 26.0,
    "k": "u"
   }
  ]
 },
 {
  "paper": "C",
  "part": 0,
  "head": {
   "s": "C0-head.webp",
   "w": 151,
   "h": 22
  },
  "qs": [
   {
    "id": "C-g3",
    "kind": "pick",
    "q": {
     "s": "C-g3-q.webp",
     "w": 319,
     "h": 24
    },
    "opts": [
     {
      "img": {
       "s": "C-g3-o0.webp",
       "w": 130.1,
       "h": 21.3
      },
      "ok": true
     },
     {
      "img": {
       "s": "C-g3-o1.webp",
       "w": 103.8,
       "h": 20.1
      },
      "ok": false
     }
    ],
    "solved": {
     "s": "C-g3-s.webp",
     "w": 434,
     "h": 42
    }
   },
   {
    "id": "C-g2",
    "kind": "pick",
    "q": {
     "s": "C-g2-q.webp",
     "w": 204,
     "h": 22
    },
    "opts": [
     {
      "img": {
       "s": "C-g2-o0.webp",
       "w": 93.2,
       "h": 22.0
      },
      "ok": false
     },
     {
      "img": {
       "s": "C-g2-o1.webp",
       "w": 148.2,
       "h": 22.0
      },
      "ok": true
     }
    ],
    "solved": {
     "s": "C-g2-s.webp",
     "w": 439,
     "h": 42
    }
   }
  ]
 },
 {
  "paper": "C",
  "part": 1,
  "head": {
   "s": "C1-head.webp",
   "w": 106,
   "h": 22
  },
  "qs": [
   {
    "id": "C-t5",
    "kind": "pick",
    "q": {
     "s": "C-t5-q.webp",
     "w": 171,
     "h": 81
    },
    "opts": [
     {
      "img": {
       "s": "C-t5-o0.webp",
       "w": 16.7,
       "h": 20.0
      },
      "ok": true
     },
     {
      "img": {
       "s": "C-t5-o1.webp",
       "w": 15.1,
       "h": 20.0
      },
      "ok": false
     }
    ],
    "solved": {
     "s": "C-t5-s.webp",
     "w": 171,
     "h": 100
    }
   },
   {
    "id": "C-t6",
    "kind": "pick",
    "q": {
     "s": "C-t6-q.webp",
     "w": 198,
     "h": 81
    },
    "opts": [
     {
      "img": {
       "s": "C-t6-o0.webp",
       "w": 15.0,
       "h": 20.0
      },
      "ok": false
     },
     {
      "img": {
       "s": "C-t6-o1.webp",
       "w": 16.7,
       "h": 20.0
      },
      "ok": true
     }
    ],
    "solved": {
     "s": "C-t6-s.webp",
     "w": 198,
     "h": 100
    }
   },
   {
    "id": "C-t7",
    "kind": "pick",
    "q": {
     "s": "C-t7-q.webp",
     "w": 142,
     "h": 81
    },
    "opts": [
     {
      "img": {
       "s": "C-t7-o0.webp",
       "w": 16.7,
       "h": 20.0
      },
      "ok": false
     },
     {
      "img": {
       "s": "C-t7-o1.webp",
       "w": 15.1,
       "h": 20.0
      },
      "ok": true
     }
    ],
    "solved": {
     "s": "C-t7-s.webp",
     "w": 142,
     "h": 100
    }
   }
  ]
 },
 {
  "paper": "C",
  "part": 2,
  "head": {
   "s": "C2-head.webp",
   "w": 172,
   "h": 22
  },
  "qs": [
   {
    "id": "C-mo6",
    "kind": "order",
    "q": {
     "s": "C-mo6-q.webp",
     "w": 304,
     "h": 23
    },
    "pieces": [
     {
      "s": "C-mo6-w0.webp",
      "w": 32.0,
      "h": 19.0,
      "k": "April"
     },
     {
      "s": "C-mo6-w1.webp",
      "w": 41.0,
      "h": 19.0,
      "k": "march"
     },
     {
      "s": "C-mo6-w2.webp",
      "w": 55.9,
      "h": 19.0,
      "k": "February"
     },
     {
      "s": "C-mo6-w3.webp",
      "w": 48.9,
      "h": 19.0,
      "k": "January"
     }
    ],
    "target": [
     "January",
     "February",
     "march",
     "April"
    ],
    "solved": {
     "s": "C-mo6-s.webp",
     "w": 554,
     "h": 24
    }
   },
   {
    "id": "C-un1",
    "kind": "slot",
    "q": {
     "s": "C-un1-q.webp",
     "w": 41,
     "h": 23
    },
    "ans": "unlucky",
    "solved": {
     "s": "C-un1-s.webp",
     "w": 204,
     "h": 23
    },
    "ctx": {
     "s": "C-un-ctx.webp",
     "w": 194,
     "h": 24
    }
   },
   {
    "id": "C-un2",
    "kind": "slot",
    "q": {
     "s": "C-un2-q.webp",
     "w": 42,
     "h": 23
    },
    "ans": "unclean",
    "solved": {
     "s": "C-un2-s.webp",
     "w": 278,
     "h": 23
    },
    "ctx": {
     "s": "C-un-ctx.webp",
     "w": 194,
     "h": 24
    }
   }
  ],
  "tray": [
   {
    "s": "C-unA.webp",
    "w": 57.3,
    "h": 13.0,
    "k": "unlucky"
   },
   {
    "s": "C-unB.webp",
    "w": 57.7,
    "h": 13.0,
    "k": "unclean"
   }
  ]
 },
 {
  "paper": "C",
  "part": 3,
  "head": {
   "s": "C3-head.webp",
   "w": 139,
   "h": 22
  },
  "qs": [
   {
    "id": "C-h2",
    "kind": "pick",
    "q": {
     "s": "C-h2-q.webp",
     "w": 249,
     "h": 22
    },
    "opts": [
     {
      "img": {
       "s": "C-h2-o0.webp",
       "w": 61.1,
       "h": 20.1
      },
      "ok": false
     },
     {
      "img": {
       "s": "C-h2-o1.webp",
       "w": 68.5,
       "h": 20.1
      },
      "ok": true
     }
    ],
    "solved": {
     "s": "C-h2-s.webp",
     "w": 519,
     "h": 24
    }
   },
   {
    "id": "C-tm6",
    "kind": "pick",
    "q": {
     "s": "C-tm6-q.webp",
     "w": 289,
     "h": 23
    },
    "opts": [
     {
      "img": {
       "s": "C-tm6-o0.webp",
       "w": 41.8,
       "h": 20.0
      },
      "ok": false
     },
     {
      "img": {
       "s": "C-tm6-o1.webp",
       "w": 50.9,
       "h": 20.0
      },
      "ok": true
     },
     {
      "img": {
       "s": "C-tm6-o2.webp",
       "w": 53.9,
       "h": 20.0
      },
      "ok": false
     }
    ],
    "solved": {
     "s": "C-tm6-s.webp",
     "w": 519,
     "h": 25
    }
   },
   {
    "id": "C-tm7",
    "kind": "pick",
    "q": {
     "s": "C-tm7-q.webp",
     "w": 164,
     "h": 23
    },
    "opts": [
     {
      "img": {
       "s": "C-tm7-o0.webp",
       "w": 26.9,
       "h": 20.0
      },
      "ok": true
     },
     {
      "img": {
       "s": "C-tm7-o1.webp",
       "w": 53.3,
       "h": 20.0
      },
      "ok": false
     },
     {
      "img": {
       "s": "C-tm7-o2.webp",
       "w": 24.3,
       "h": 20.0
      },
      "ok": false
     }
    ],
    "solved": {
     "s": "C-tm7-s.webp",
     "w": 519,
     "h": 25
    }
   }
  ]
 },
 {
  "paper": "C",
  "part": 4,
  "head": {
   "s": "C4-head.webp",
   "w": 139,
   "h": 22
  },
  "qs": [
   {
    "id": "C-w1",
    "kind": "pick",
    "q": {
     "s": "C-w1-q.webp",
     "w": 89,
     "h": 47
    },
    "opts": [
     {
      "img": {
       "s": "C-w1-o0.webp",
       "w": 87,
       "h": 24
      },
      "ok": true
     },
     {
      "img": {
       "s": "C-w1-o1.webp",
       "w": 87,
       "h": 24
      },
      "ok": false
     }
    ],
    "solved": {
     "s": "C-w1-s.webp",
     "w": 89,
     "h": 83
    }
   },
   {
    "id": "C-w2",
    "kind": "pick",
    "q": {
     "s": "C-w2-q.webp",
     "w": 97,
     "h": 47
    },
    "opts": [
     {
      "img": {
       "s": "C-w2-o0.webp",
       "w": 95,
       "h": 24
      },
      "ok": true
     },
     {
      "img": {
       "s": "C-w2-o1.webp",
       "w": 95,
       "h": 24
      },
      "ok": false
     }
    ],
    "solved": {
     "s": "C-w2-s.webp",
     "w": 97,
     "h": 83
    }
   },
   {
    "id": "C-w3",
    "kind": "pick",
    "q": {
     "s": "C-w3-q.webp",
     "w": 116,
     "h": 47
    },
    "opts": [
     {
      "img": {
       "s": "C-w3-o0.webp",
       "w": 114,
       "h": 24
      },
      "ok": true
     },
     {
      "img": {
       "s": "C-w3-o1.webp",
       "w": 114,
       "h": 24
      },
      "ok": false
     }
    ],
    "solved": {
     "s": "C-w3-s.webp",
     "w": 116,
     "h": 83
    }
   },
   {
    "id": "C-w4",
    "kind": "pick",
    "q": {
     "s": "C-w4-q.webp",
     "w": 83,
     "h": 47
    },
    "opts": [
     {
      "img": {
       "s": "C-w4-o0.webp",
       "w": 81,
       "h": 24
      },
      "ok": true
     },
     {
      "img": {
       "s": "C-w4-o1.webp",
       "w": 81,
       "h": 24
      },
      "ok": false
     }
    ],
    "solved": {
     "s": "C-w4-s.webp",
     "w": 83,
     "h": 83
    }
   },
   {
    "id": "C-w5",
    "kind": "pick",
    "q": {
     "s": "C-w5-q.webp",
     "w": 89,
     "h": 47
    },
    "opts": [
     {
      "img": {
       "s": "C-w5-o0.webp",
       "w": 87,
       "h": 24
      },
      "ok": false
     },
     {
      "img": {
       "s": "C-w5-o1.webp",
       "w": 87,
       "h": 24
      },
      "ok": true
     }
    ],
    "solved": {
     "s": "C-w5-s.webp",
     "w": 89,
     "h": 83
    }
   },
   {
    "id": "C-w6",
    "kind": "pick",
    "q": {
     "s": "C-w6-q.webp",
     "w": 82,
     "h": 47
    },
    "opts": [
     {
      "img": {
       "s": "C-w6-o0.webp",
       "w": 80,
       "h": 24
      },
      "ok": true
     },
     {
      "img": {
       "s": "C-w6-o1.webp",
       "w": 80,
       "h": 24
      },
      "ok": false
     }
    ],
    "solved": {
     "s": "C-w6-s.webp",
     "w": 82,
     "h": 83
    }
   }
  ]
 },
 {
  "paper": "C",
  "part": 5,
  "head": {
   "s": "C5-head.webp",
   "w": 234,
   "h": 22
  },
  "qs": [
   {
    "id": "C-sp5",
    "kind": "pick",
    "q": {
     "s": "C-sp5-q.webp",
     "w": 132,
     "h": 57
    },
    "opts": [
     {
      "img": {
       "s": "C-sp5-o0.webp",
       "w": 70,
       "h": 17.0
      },
      "ok": false
     },
     {
      "img": {
       "s": "C-sp5-o1.webp",
       "w": 70,
       "h": 16.5
      },
      "ok": true
     }
    ],
    "solved": {
     "s": "C-sp5-s.webp",
     "w": 132,
     "h": 92
    }
   },
   {
    "id": "C-sp6",
    "kind": "pick",
    "q": {
     "s": "C-sp6-q.webp",
     "w": 132,
     "h": 57
    },
    "opts": [
     {
      "img": {
       "s": "C-sp6-o0.webp",
       "w": 70,
       "h": 17.0
      },
      "ok": true
     },
     {
      "img": {
       "s": "C-sp6-o1.webp",
       "w": 70,
       "h": 16.5
      },
      "ok": false
     }
    ],
    "solved": {
     "s": "C-sp6-s.webp",
     "w": 132,
     "h": 92
    }
   },
   {
    "id": "C-sp7",
    "kind": "pick",
    "q": {
     "s": "C-sp7-q.webp",
     "w": 117,
     "h": 57
    },
    "opts": [
     {
      "img": {
       "s": "C-sp7-o0.webp",
       "w": 55,
       "h": 17.0
      },
      "ok": true
     },
     {
      "img": {
       "s": "C-sp7-o1.webp",
       "w": 55,
       "h": 16.5
      },
      "ok": false
     }
    ],
    "solved": {
     "s": "C-sp7-s.webp",
     "w": 117,
     "h": 92
    }
   }
  ]
 },
 {
  "paper": "B",
  "part": 0,
  "head": {
   "s": "B0-head.webp",
   "w": 337,
   "h": 41
  },
  "qs": [
   {
    "id": "B-g6",
    "kind": "slot",
    "q": {
     "s": "B-g6-q.webp",
     "w": 308,
     "h": 30
    },
    "ans": "b_ali",
    "solved": {
     "s": "B-g6-s.webp",
     "w": 308,
     "h": 30
    }
   },
   {
    "id": "B-g4",
    "kind": "slot",
    "q": {
     "s": "B-g4-q.webp",
     "w": 308,
     "h": 30
    },
    "ans": "b_sept",
    "solved": {
     "s": "B-g4-s.webp",
     "w": 308,
     "h": 30
    }
   },
   {
    "id": "B-g7",
    "kind": "slot",
    "q": {
     "s": "B-g7-q.webp",
     "w": 308,
     "h": 30
    },
    "ans": "b_30",
    "solved": {
     "s": "B-g7-s.webp",
     "w": 308,
     "h": 30
    }
   },
   {
    "id": "B-g8",
    "kind": "slot",
    "q": {
     "s": "B-g8-q.webp",
     "w": 308,
     "h": 30
    },
    "ans": "b_150",
    "solved": {
     "s": "B-g8-s.webp",
     "w": 308,
     "h": 30
    }
   },
   {
    "id": "B-g9",
    "kind": "slot",
    "q": {
     "s": "B-g9-q.webp",
     "w": 308,
     "h": 30
    },
    "ans": "b_bday",
    "solved": {
     "s": "B-g9-s.webp",
     "w": 308,
     "h": 30
    }
   },
   {
    "id": "B-g10",
    "kind": "slot",
    "q": {
     "s": "B-g10-q.webp",
     "w": 308,
     "h": 30
    },
    "ans": "b_six",
    "solved": {
     "s": "B-g10-s.webp",
     "w": 308,
     "h": 30
    }
   }
  ],
  "tray": [
   {
    "s": "B-a0.webp",
    "w": 166,
    "h": 26,
    "k": "b_sept"
   },
   {
    "s": "B-a1.webp",
    "w": 166,
    "h": 26,
    "k": "b_bday"
   },
   {
    "s": "B-a2.webp",
    "w": 166,
    "h": 26,
    "k": "b_150"
   },
   {
    "s": "B-a3.webp",
    "w": 166,
    "h": 26,
    "k": "b_six"
   },
   {
    "s": "B-a4.webp",
    "w": 166,
    "h": 26,
    "k": "b_ali"
   },
   {
    "s": "B-a5.webp",
    "w": 166,
    "h": 26,
    "k": "b_30"
   }
  ]
 },
 {
  "paper": "B",
  "part": 1,
  "head": {
   "s": "B1-head.webp",
   "w": 302,
   "h": 41
  },
  "qs": [
   {
    "id": "B-o3",
    "kind": "order",
    "q": {
     "s": "B-o3-q.webp",
     "w": 209,
     "h": 22
    },
    "pieces": [
     {
      "s": "B-o3-w0.webp",
      "w": 28.0,
      "h": 18.0,
      "k": "long"
     },
     {
      "s": "B-o3-w1.webp",
      "w": 25.2,
      "h": 18.0,
      "k": "was"
     },
     {
      "s": "B-o3-w2.webp",
      "w": 81.5,
      "h": 18.0,
      "k": "your vacation?"
     },
     {
      "s": "B-o3-w3.webp",
      "w": 30.2,
      "h": 18.0,
      "k": "How"
     }
    ],
    "target": [
     "How",
     "long",
     "was",
     "your vacation?"
    ],
    "solved": {
     "s": "B-o3-s.webp",
     "w": 244,
     "h": 20
    }
   },
   {
    "id": "B-o4",
    "kind": "order",
    "q": {
     "s": "B-o4-q.webp",
     "w": 226,
     "h": 21
    },
    "pieces": [
     {
      "s": "B-o4-w0.webp",
      "w": 58.2,
      "h": 18.0,
      "k": "December"
     },
     {
      "s": "B-o4-w1.webp",
      "w": 72.9,
      "h": 18.0,
      "k": "My favourite"
     },
     {
      "s": "B-o4-w2.webp",
      "w": 13.7,
      "h": 18.0,
      "k": "is"
     },
     {
      "s": "B-o4-w3.webp",
      "w": 37.8,
      "h": 18.0,
      "k": "month"
     }
    ],
    "target": [
     "My favourite",
     "month",
     "is",
     "December"
    ],
    "solved": {
     "s": "B-o4-s.webp",
     "w": 244,
     "h": 20
    }
   },
   {
    "id": "B-o5",
    "kind": "order",
    "q": {
     "s": "B-o5-q.webp",
     "w": 204,
     "h": 21
    },
    "pieces": [
     {
      "s": "B-o5-w0.webp",
      "w": 61.3,
      "h": 18.0,
      "k": "the biggest"
     },
     {
      "s": "B-o5-w1.webp",
      "w": 13.7,
      "h": 18.0,
      "k": "is"
     },
     {
      "s": "B-o5-w2.webp",
      "w": 28.1,
      "h": 18.0,
      "k": "This"
     },
     {
      "s": "B-o5-w3.webp",
      "w": 57.5,
      "h": 18.0,
      "k": "classroom"
     }
    ],
    "target": [
     "This",
     "is",
     "the biggest",
     "classroom"
    ],
    "solved": {
     "s": "B-o5-s.webp",
     "w": 244,
     "h": 20
    }
   }
  ]
 },
 {
  "paper": "B",
  "part": 2,
  "head": {
   "s": "B2-head.webp",
   "w": 166,
   "h": 41
  },
  "qs": [
   {
    "id": "B-op1",
    "kind": "slot",
    "q": {
     "s": "B-op1-q.webp",
     "w": 147,
     "h": 22
    },
    "ans": "late",
    "solved": {
     "s": "B-op1-s.webp",
     "w": 147,
     "h": 22
    }
   },
   {
    "id": "B-op2",
    "kind": "slot",
    "q": {
     "s": "B-op2-q.webp",
     "w": 162,
     "h": 21
    },
    "ans": "easy",
    "solved": {
     "s": "B-op2-s.webp",
     "w": 162,
     "h": 21
    }
   },
   {
    "id": "B-op3",
    "kind": "slot",
    "q": {
     "s": "B-op3-q.webp",
     "w": 147,
     "h": 21
    },
    "ans": "big",
    "solved": {
     "s": "B-op3-s.webp",
     "w": 147,
     "h": 21
    }
   }
  ],
  "tray": [
   {
    "s": "B-opA.webp",
    "w": 28.5,
    "h": 12.5,
    "k": "late"
   },
   {
    "s": "B-opB.webp",
    "w": 33.6,
    "h": 12.5,
    "k": "easy"
   },
   {
    "s": "B-opC.webp",
    "w": 23.7,
    "h": 12.5,
    "k": "big"
   }
  ]
 },
 {
  "paper": "B",
  "part": 3,
  "head": {
   "s": "B3-head.webp",
   "w": 348,
   "h": 71
  },
  "qs": [
   {
    "id": "B-mo1",
    "kind": "slot",
    "q": {
     "s": "B-mo1-q.webp",
     "w": 175,
     "h": 27
    },
    "ans": "March",
    "solved": {
     "s": "B-mo1-s.webp",
     "w": 175,
     "h": 27
    }
   },
   {
    "id": "B-mo2",
    "kind": "slot",
    "q": {
     "s": "B-mo2-q.webp",
     "w": 175,
     "h": 27
    },
    "ans": "April",
    "solved": {
     "s": "B-mo2-s.webp",
     "w": 175,
     "h": 27
    }
   },
   {
    "id": "B-mo3",
    "kind": "slot",
    "q": {
     "s": "B-mo3-q.webp",
     "w": 177,
     "h": 27
    },
    "ans": "June",
    "solved": {
     "s": "B-mo3-s.webp",
     "w": 177,
     "h": 27
    }
   },
   {
    "id": "B-mo4",
    "kind": "slot",
    "q": {
     "s": "B-mo4-q.webp",
     "w": 176,
     "h": 26
    },
    "ans": "August",
    "solved": {
     "s": "B-mo4-s.webp",
     "w": 176,
     "h": 26
    }
   },
   {
    "id": "B-mo5",
    "kind": "slot",
    "q": {
     "s": "B-mo5-q.webp",
     "w": 175,
     "h": 26
    },
    "ans": "November",
    "solved": {
     "s": "B-mo5-s.webp",
     "w": 175,
     "h": 26
    }
   }
  ],
  "tray": [
   {
    "s": "B-mbA.webp",
    "w": 43.6,
    "h": 17.0,
    "k": "August"
   },
   {
    "s": "B-mbB.webp",
    "w": 61.4,
    "h": 17.0,
    "k": "November"
   },
   {
    "s": "B-mbC.webp",
    "w": 41.4,
    "h": 17.0,
    "k": "March"
   },
   {
    "s": "B-mbD.webp",
    "w": 30.4,
    "h": 17.0,
    "k": "June"
   },
   {
    "s": "B-mbE.webp",
    "w": 33.5,
    "h": 17.0,
    "k": "April"
   }
  ]
 },
 {
  "paper": "B",
  "part": 4,
  "head": {
   "s": "B4-head.webp",
   "w": 520,
   "h": 52
  },
  "qs": [
   {
    "id": "B-p1",
    "kind": "slot",
    "q": {
     "s": "B-p1-q.webp",
     "w": 176,
     "h": 22
    },
    "ans": "bought",
    "solved": {
     "s": "B-p1-s.webp",
     "w": 176,
     "h": 22
    }
   },
   {
    "id": "B-p2",
    "kind": "slot",
    "q": {
     "s": "B-p2-q.webp",
     "w": 176,
     "h": 22
    },
    "ans": "go",
    "solved": {
     "s": "B-p2-s.webp",
     "w": 176,
     "h": 22
    }
   },
   {
    "id": "B-p3",
    "kind": "slot",
    "q": {
     "s": "B-p3-q.webp",
     "w": 173,
     "h": 22
    },
    "ans": "woke up",
    "solved": {
     "s": "B-p3-s.webp",
     "w": 173,
     "h": 22
    }
   },
   {
    "id": "B-p4",
    "kind": "slot",
    "q": {
     "s": "B-p4-q.webp",
     "w": 173,
     "h": 22
    },
    "ans": "took",
    "solved": {
     "s": "B-p4-s.webp",
     "w": 173,
     "h": 22
    }
   },
   {
    "id": "B-p5",
    "kind": "slot",
    "q": {
     "s": "B-p5-q.webp",
     "w": 177,
     "h": 22
    },
    "ans": "make",
    "solved": {
     "s": "B-p5-s.webp",
     "w": 177,
     "h": 22
    }
   },
   {
    "id": "B-p6",
    "kind": "slot",
    "q": {
     "s": "B-p6-q.webp",
     "w": 177,
     "h": 22
    },
    "ans": "is/am/are",
    "solved": {
     "s": "B-p6-s.webp",
     "w": 177,
     "h": 22
    }
   }
  ],
  "tray": [
   {
    "s": "B-pA.webp",
    "w": 48.6,
    "h": 12.0,
    "k": "bought"
   },
   {
    "s": "B-pB.webp",
    "w": 18.5,
    "h": 12.0,
    "k": "go"
   },
   {
    "s": "B-pC.webp",
    "w": 56.8,
    "h": 12.0,
    "k": "woke up"
   },
   {
    "s": "B-pD.webp",
    "w": 31.3,
    "h": 12.0,
    "k": "took"
   },
   {
    "s": "B-pE.webp",
    "w": 37.6,
    "h": 12.0,
    "k": "make"
   },
   {
    "s": "B-pF.webp",
    "w": 62.6,
    "h": 12.0,
    "k": "is/am/are"
   }
  ]
 },
 {
  "paper": "B",
  "part": 5,
  "head": {
   "s": "B5-head.webp",
   "w": 428,
   "h": 41
  },
  "qs": [
   {
    "id": "B-s1",
    "kind": "pick",
    "q": {
     "s": "B-s1-q.webp",
     "w": 135,
     "h": 75
    },
    "opts": [
     {
      "img": {
       "s": "B-s1-o0.webp",
       "w": 131,
       "h": 15.3
      },
      "ok": false
     },
     {
      "img": {
       "s": "B-s1-o1.webp",
       "w": 131,
       "h": 14.6
      },
      "ok": true
     }
    ],
    "solved": {
     "s": "B-s1-s.webp",
     "w": 135,
     "h": 105
    }
   },
   {
    "id": "B-s2",
    "kind": "pick",
    "q": {
     "s": "B-s2-q.webp",
     "w": 131,
     "h": 75
    },
    "opts": [
     {
      "img": {
       "s": "B-s2-o0.webp",
       "w": 127,
       "h": 15.3
      },
      "ok": false
     },
     {
      "img": {
       "s": "B-s2-o1.webp",
       "w": 127,
       "h": 14.6
      },
      "ok": true
     }
    ],
    "solved": {
     "s": "B-s2-s.webp",
     "w": 131,
     "h": 105
    }
   },
   {
    "id": "B-s3",
    "kind": "pick",
    "q": {
     "s": "B-s3-q.webp",
     "w": 118,
     "h": 75
    },
    "opts": [
     {
      "img": {
       "s": "B-s3-o0.webp",
       "w": 114,
       "h": 15.3
      },
      "ok": false
     },
     {
      "img": {
       "s": "B-s3-o1.webp",
       "w": 114,
       "h": 14.6
      },
      "ok": true
     }
    ],
    "solved": {
     "s": "B-s3-s.webp",
     "w": 118,
     "h": 105
    }
   },
   {
    "id": "B-s4",
    "kind": "pick",
    "q": {
     "s": "B-s4-q.webp",
     "w": 146,
     "h": 75
    },
    "opts": [
     {
      "img": {
       "s": "B-s4-o0.webp",
       "w": 142,
       "h": 15.3
      },
      "ok": true
     },
     {
      "img": {
       "s": "B-s4-o1.webp",
       "w": 142,
       "h": 14.6
      },
      "ok": false
     }
    ],
    "solved": {
     "s": "B-s4-s.webp",
     "w": 146,
     "h": 105
    }
   }
  ]
 },
 {
  "paper": "B",
  "part": 6,
  "head": {
   "s": "B6-head.webp",
   "w": 512,
   "h": 55
  },
  "qs": [
   {
    "id": "B-c1",
    "kind": "slot",
    "q": {
     "s": "B-c1-q.webp",
     "w": 126,
     "h": 132
    },
    "ans": "lion",
    "solved": {
     "s": "B-c1-s.webp",
     "w": 126,
     "h": 132
    }
   },
   {
    "id": "B-c2",
    "kind": "slot",
    "q": {
     "s": "B-c2-q.webp",
     "w": 145,
     "h": 132
    },
    "ans": "comic book",
    "solved": {
     "s": "B-c2-s.webp",
     "w": 145,
     "h": 132
    }
   },
   {
    "id": "B-c3",
    "kind": "slot",
    "q": {
     "s": "B-c3-q.webp",
     "w": 138,
     "h": 132
    },
    "ans": "snail",
    "solved": {
     "s": "B-c3-s.webp",
     "w": 138,
     "h": 132
    }
   },
   {
    "id": "B-c4",
    "kind": "slot",
    "q": {
     "s": "B-c4-q.webp",
     "w": 131,
     "h": 132
    },
    "ans": "calendar",
    "solved": {
     "s": "B-c4-s.webp",
     "w": 131,
     "h": 132
    }
   }
  ],
  "tray": [
   {
    "s": "B-cbA.webp",
    "w": 64.2,
    "h": 18.0,
    "k": "comic book"
   },
   {
    "s": "B-cbB.webp",
    "w": 50.7,
    "h": 18.0,
    "k": "calendar"
   },
   {
    "s": "B-cbC.webp",
    "w": 25.2,
    "h": 18.0,
    "k": "lion"
   },
   {
    "s": "B-cbD.webp",
    "w": 29.9,
    "h": 18.0,
    "k": "snail"
   }
  ]
 },
 {
  "paper": "B",
  "part": 7,
  "head": {
   "s": "B7-head.webp",
   "w": 228,
   "h": 41
  },
  "qs": [
   {
    "id": "B-h1",
    "kind": "pick",
    "q": {
     "s": "B-h1-q.webp",
     "w": 387,
     "h": 21.0
    },
    "opts": [
     {
      "img": {
       "s": "B-h1-o0.webp",
       "w": 65.6,
       "h": 19.0
      },
      "ok": false
     },
     {
      "img": {
       "s": "B-h1-o1.webp",
       "w": 58.8,
       "h": 19.0
      },
      "ok": true
     }
    ],
    "solved": {
     "s": "B-h1-s.webp",
     "w": 387,
     "h": 21.0
    }
   },
   {
    "id": "B-h2",
    "kind": "pick",
    "q": {
     "s": "B-h2-q.webp",
     "w": 387,
     "h": 21.0
    },
    "opts": [
     {
      "img": {
       "s": "B-h2-o0.webp",
       "w": 65.6,
       "h": 19.0
      },
      "ok": true
     },
     {
      "img": {
       "s": "B-h2-o1.webp",
       "w": 58.8,
       "h": 19.0
      },
      "ok": false
     }
    ],
    "solved": {
     "s": "B-h2-s.webp",
     "w": 387,
     "h": 21.0
    }
   },
   {
    "id": "B-h3",
    "kind": "pick",
    "q": {
     "s": "B-h3-q.webp",
     "w": 387,
     "h": 20.9
    },
    "opts": [
     {
      "img": {
       "s": "B-h3-o0.webp",
       "w": 65.6,
       "h": 18.9
      },
      "ok": false
     },
     {
      "img": {
       "s": "B-h3-o1.webp",
       "w": 58.8,
       "h": 18.9
      },
      "ok": true
     }
    ],
    "solved": {
     "s": "B-h3-s.webp",
     "w": 387,
     "h": 20.9
    }
   },
   {
    "id": "B-h4",
    "kind": "pick",
    "q": {
     "s": "B-h4-q.webp",
     "w": 387,
     "h": 20.9
    },
    "opts": [
     {
      "img": {
       "s": "B-h4-o0.webp",
       "w": 65.6,
       "h": 18.9
      },
      "ok": true
     },
     {
      "img": {
       "s": "B-h4-o1.webp",
       "w": 58.8,
       "h": 18.9
      },
      "ok": false
     }
    ],
    "solved": {
     "s": "B-h4-s.webp",
     "w": 387,
     "h": 20.9
    }
   },
   {
    "id": "B-tm4",
    "kind": "pick",
    "q": {
     "s": "B-tm4-q.webp",
     "w": 387,
     "h": 21.0
    },
    "opts": [
     {
      "img": {
       "s": "B-tm4-o0.webp",
       "w": 22.3,
       "h": 19.0
      },
      "ok": false
     },
     {
      "img": {
       "s": "B-tm4-o1.webp",
       "w": 22.5,
       "h": 19.0
      },
      "ok": true
     },
     {
      "img": {
       "s": "B-tm4-o2.webp",
       "w": 39.3,
       "h": 19.0
      },
      "ok": false
     }
    ],
    "solved": {
     "s": "B-tm4-s.webp",
     "w": 387,
     "h": 21.0
    }
   },
   {
    "id": "B-tm5",
    "kind": "pick",
    "q": {
     "s": "B-tm5-q.webp",
     "w": 387,
     "h": 20.9
    },
    "opts": [
     {
      "img": {
       "s": "B-tm5-o0.webp",
       "w": 26.3,
       "h": 18.9
      },
      "ok": true
     },
     {
      "img": {
       "s": "B-tm5-o1.webp",
       "w": 32.1,
       "h": 18.9
      },
      "ok": false
     },
     {
      "img": {
       "s": "B-tm5-o2.webp",
       "w": 49.4,
       "h": 18.9
      },
      "ok": false
     }
    ],
    "solved": {
     "s": "B-tm5-s.webp",
     "w": 387,
     "h": 20.9
    }
   },
   {
    "id": "B-cp2",
    "kind": "pick",
    "q": {
     "s": "B-cp2-q.webp",
     "w": 387,
     "h": 20.9
    },
    "opts": [
     {
      "img": {
       "s": "B-cp2-o0.webp",
       "w": 23.7,
       "h": 18.9
      },
      "ok": false
     },
     {
      "img": {
       "s": "B-cp2-o1.webp",
       "w": 35.5,
       "h": 18.9
      },
      "ok": false
     },
     {
      "img": {
       "s": "B-cp2-o2.webp",
       "w": 38.9,
       "h": 18.9
      },
      "ok": true
     }
    ],
    "solved": {
     "s": "B-cp2-s.webp",
     "w": 387,
     "h": 20.9
    }
   },
   {
    "id": "B-cp3",
    "kind": "pick",
    "q": {
     "s": "B-cp3-q.webp",
     "w": 387,
     "h": 21.0
    },
    "opts": [
     {
      "img": {
       "s": "B-cp3-o0.webp",
       "w": 49.3,
       "h": 19.0
      },
      "ok": false
     },
     {
      "img": {
       "s": "B-cp3-o1.webp",
       "w": 81.4,
       "h": 19.0
      },
      "ok": false
     },
     {
      "img": {
       "s": "B-cp3-o2.webp",
       "w": 79.1,
       "h": 19.0
      },
      "ok": true
     }
    ],
    "solved": {
     "s": "B-cp3-s.webp",
     "w": 387,
     "h": 21.0
    }
   }
  ]
 },
 {
  "paper": "B",
  "part": 8,
  "head": {
   "s": "B8-head.webp",
   "w": 373,
   "h": 62
  },
  "qs": [
   {
    "id": "B-v5",
    "kind": "slot",
    "q": {
     "s": "B-v5-q.webp",
     "w": 109,
     "h": 91
    },
    "ans": "date",
    "solved": {
     "s": "B-v5-s.webp",
     "w": 109,
     "h": 91
    }
   },
   {
    "id": "B-v6",
    "kind": "slot",
    "q": {
     "s": "B-v6-q.webp",
     "w": 109,
     "h": 91
    },
    "ans": "classroom",
    "solved": {
     "s": "B-v6-s.webp",
     "w": 109,
     "h": 91
    }
   },
   {
    "id": "B-v7",
    "kind": "slot",
    "q": {
     "s": "B-v7-q.webp",
     "w": 108,
     "h": 91
    },
    "ans": "months",
    "solved": {
     "s": "B-v7-s.webp",
     "w": 108,
     "h": 91
    }
   },
   {
    "id": "B-v8",
    "kind": "slot",
    "q": {
     "s": "B-v8-q.webp",
     "w": 109,
     "h": 91
    },
    "ans": "late",
    "solved": {
     "s": "B-v8-s.webp",
     "w": 109,
     "h": 91
    }
   },
   {
    "id": "B-v9",
    "kind": "slot",
    "q": {
     "s": "B-v9-q.webp",
     "w": 109,
     "h": 91
    },
    "ans": "plus",
    "solved": {
     "s": "B-v9-s.webp",
     "w": 109,
     "h": 91
    }
   }
  ],
  "tray": [
   {
    "s": "B-vbA.webp",
    "w": 44.0,
    "h": 18.0,
    "k": "months"
   },
   {
    "s": "B-vbB.webp",
    "w": 24.5,
    "h": 18.0,
    "k": "late"
   },
   {
    "s": "B-vbC.webp",
    "w": 28.1,
    "h": 18.0,
    "k": "date"
   },
   {
    "s": "B-vbD.webp",
    "w": 27.2,
    "h": 18.0,
    "k": "plus"
   },
   {
    "s": "B-vbE.webp",
    "w": 57.0,
    "h": 18.0,
    "k": "classroom"
   }
  ]
 },
 {
  "paper": "B",
  "part": 9,
  "head": {
   "s": "B9-head.webp",
   "w": 228,
   "h": 40
  },
  "qs": [
   {
    "id": "B-sb1",
    "kind": "slot",
    "q": {
     "s": "B-sb1-q.webp",
     "w": 82,
     "h": 92
    },
    "ans": "a",
    "solved": {
     "s": "B-sb1-s.webp",
     "w": 82,
     "h": 92
    }
   },
   {
    "id": "B-sb2",
    "kind": "slot",
    "q": {
     "s": "B-sb2-q.webp",
     "w": 75,
     "h": 92
    },
    "ans": "b",
    "solved": {
     "s": "B-sb2-s.webp",
     "w": 75,
     "h": 92
    }
   },
   {
    "id": "B-sb3",
    "kind": "slot",
    "q": {
     "s": "B-sb3-q.webp",
     "w": 76,
     "h": 92
    },
    "ans": "i",
    "solved": {
     "s": "B-sb3-s.webp",
     "w": 76,
     "h": 92
    }
   },
   {
    "id": "B-sb4",
    "kind": "slot",
    "q": {
     "s": "B-sb4-q.webp",
     "w": 81,
     "h": 92
    },
    "ans": "t",
    "solved": {
     "s": "B-sb4-s.webp",
     "w": 81,
     "h": 92
    }
   },
   {
    "id": "B-sb5",
    "kind": "slot",
    "q": {
     "s": "B-sb5-q.webp",
     "w": 75,
     "h": 92
    },
    "ans": "r",
    "solved": {
     "s": "B-sb5-s.webp",
     "w": 75,
     "h": 92
    }
   },
   {
    "id": "B-sb6",
    "kind": "slot",
    "q": {
     "s": "B-sb6-q.webp",
     "w": 75,
     "h": 92
    },
    "ans": "c",
    "solved": {
     "s": "B-sb6-s.webp",
     "w": 75,
     "h": 92
    }
   },
   {
    "id": "B-sb7",
    "kind": "slot",
    "q": {
     "s": "B-sb7-q.webp",
     "w": 74,
     "h": 92
    },
    "ans": "n",
    "solved": {
     "s": "B-sb7-s.webp",
     "w": 74,
     "h": 92
    }
   }
  ],
  "tray": [
   {
    "s": "B-ol0.webp",
    "w": 11.8,
    "h": 14.6,
    "k": "a"
   },
   {
    "s": "B-ol1.webp",
    "w": 12.4,
    "h": 14.6,
    "k": "b"
   },
   {
    "s": "B-ol2.webp",
    "w": 7.2,
    "h": 14.6,
    "k": "i"
   },
   {
    "s": "B-ol3.webp",
    "w": 9.1,
    "h": 14.6,
    "k": "t"
   },
   {
    "s": "B-ol4.webp",
    "w": 9.3,
    "h": 14.6,
    "k": "r"
   },
   {
    "s": "B-ol5.webp",
    "w": 10.7,
    "h": 14.6,
    "k": "c"
   },
   {
    "s": "B-ol6.webp",
    "w": 12.4,
    "h": 14.6,
    "k": "n"
   }
  ]
 }
];
