import * as assert from "assert";
import { parseDingLine, parseOrder, parseGenus, Genus, parseFamily, Family, Order, formatGenus, Dict_Card, formatDictCard, parseTranslate }
    from "../dingstructure";



suite('dingstructure', () => {

    function assertGenusEqual(f: Genus, expected: Genus, msg = "") {
        let parentMsg = msg.length > 0 ? `${msg} ` : '';
        assert.equal(f.orthography, expected.orthography, parentMsg);
        assert.equal(f.part_of_speech, expected.part_of_speech, parentMsg);
        assert.equal(f.domain.length, expected.domain.length, parentMsg);
        for (let i = 0; i < f.domain.length; ++i) {
            let fd = f.domain[i], ed = expected.domain[i];
            assert.equal(fd, ed, `${parentMsg}Expected domain[${i}] (${fd}) equal to ${ed}`);
        }
        assert.equal(f.extension.length, expected.extension.length, parentMsg);
        for (let i = 0; i < f.extension.length; ++i) {
            let fp = f.extension[i].position, ep = expected.extension[i].position,
                ft = f.extension[i].text, et = expected.extension[i].text;
            assert.equal(fp, ep, `${parentMsg}Expected extension[${i}].postion (${fp}) equal to ${ep}`);
            assert.equal(ft, et, `${parentMsg}Expected extension[${i}].text (${ft}) equal to ${et}`);
        }
        return true;
    }

    test('parse a simple genus', () => {
        let simpleLine = "Zaunkönig {m} (Troglodytes troglodytes) [ornith.]";
        let expected = {
            orthography: "Zaunkönig",
            part_of_speech: 'm',
            domain: ['ornith.'],
            extension: [
                { text: 'Troglodytes troglodytes', position: 14 }
            ]
        };
        let f = parseGenus(simpleLine);
        assertGenusEqual(f, expected);
    });

    test('parse genus with ( at begin', () => {
        let g = "(übertrieben) schwärmen";
        let expected = {
            orthography: "schwärmen",
            domain: [],
            part_of_speech: "",
            extension: [
                { position: 0, text: "übertrieben" }
            ]
        };
        let f = parseGenus(g);
        assertGenusEqual(f, expected);
    });

    function assertFamilyEqual(f: Family, expected: Family, msg = "") {
        let parentMsg = msg.length > 0 ? `${msg} ` : '';
        assert.equal(f.length, expected.length, `${parentMsg}`);
        for (let i = 0; i < f.length; ++i) {
            let fi = f[i], ei = expected[i];
            let m = `${parentMsg}Expected family[${i}] is equal to ${ei.toString()}`;
            assertGenusEqual(fi, ei, m);
        }
    }

    test('parse family', () => {
        let l = "(durch die Luft) rauschen; (in der Luft) rascheln; surren {vi} ";
        let expected = [
            {
                orthography: "rauschen",
                part_of_speech: "",
                domain: [],
                extension: [
                    { position: 0, text: "durch die Luft" }
                ]
            },
            {
                orthography: "rascheln",
                part_of_speech: "",
                domain: [],
                extension: [
                    { position: 0, text: "in der Luft" }
                ]
            },
            {
                orthography: "surren",
                part_of_speech: "vi",
                domain: [],
                extension: []
            }
        ];
        let f = parseFamily(l);
        //console.log(f);
        assertFamilyEqual(f, expected);
    });

    test('other family', () => {
        let l = 'Schneeräumfahrzeug {n}; Räumfahrzeug {n} (Winterdienst) [auto]';
        let e = [
            {
                orthography: "Schneeräumfahrzeug",
                part_of_speech: "n",
                domain: [],
                extension: []
            },
            {
                orthography: "Räumfahrzeug",
                part_of_speech: "n",
                domain: ["auto"],
                extension: [
                    { position: 17, text: "Winterdienst" }
                ]
            },
        ];
        let f = parseFamily(l);
        //console.log(f);
        assertFamilyEqual(f, e);
    });

    function assertOrderEqual(o: Order, e: Order) {
        for (let i = 0; i < o.length; ++i) {
            let fo = o[i], fe = e[i];
            assertFamilyEqual(fo, fe, `Expect family[${i}] equal to ${fe.toString()}`);
        }
    }
    // mauken; wintern {vi} | maukend; winternd | gemaukt; gewintert
    test('parse order', () => {
        let l = "mauken; wintern {vi} | maukend; winternd | gemaukt; gewintert";
        let e = [
            [
                {
                    orthography: "mauken",
                    part_of_speech: "",
                    domain: [],
                    extension: []
                },
                {
                    orthography: "wintern",
                    part_of_speech: "vi",
                    domain: [],
                    extension: []
                }
            ], [
                {
                    orthography: "maukend",
                    part_of_speech: "",
                    domain: [],
                    extension: []
                },
                {
                    orthography: "winternd",
                    part_of_speech: "",
                    domain: [],
                    extension: []
                }
            ], [
                {
                    orthography: "gemaukt",
                    part_of_speech: "",
                    domain: [],
                    extension: []
                },
                {
                    orthography: "gewintert",
                    part_of_speech: "",
                    domain: [],
                    extension: []
                }
            ]
        ];
        let o = parseOrder(l);
        assertOrderEqual(o, e);
    });
    
    test('parse long order', () => {
        let ml = ['auf etw. / einer Sache [geh.] folgen; nach etw. kommen {vi} (zeitlich oder örtlich anschließen) (Sache)',
            'folgend; nach kommend',
            'gefolgt; nach gekommen',
            'gefolgt werden von etw.',
            'Auf den Winter folgt der Frühling.; Dem Winter folgt der Frühling. [geh.]',
            'Die Nummer 28 kommt nach 27.',
            'Zunächst gab es die Ansprachen der Ehrengäste, dann folgte die Preisverleihung.',
            'Der Krieg war zu Ende. Es folgte eine lange Zeit des Wiederaufbaus.',
            'Darauf folgt ein sechsmonatiges Praktikum.'];
        let l = ml.join(' | ');
        let e = [
            [
                {
                    orthography: 'auf etw. / einer Sache  folgen',
                    part_of_speech: '',
                    domain: ['geh.'],
                    extension: []
                },
                {
                    orthography: 'nach etw. kommen',
                    part_of_speech: 'vi',
                    domain: [],
                    extension: [
                        {position: 22, text: "zeitlich oder örtlich anschließen"},
                        {position: 58, text: "Sache"}
                    ]
                }
            ],
            [
                {
                    orthography: 'folgend',
                    part_of_speech: '',
                    domain: [],
                    extension: []
                },
                {
                    orthography: 'nach kommend',
                    part_of_speech: '',
                    domain: [],
                    extension: []
                }
            ],
            [
                {
                    orthography: 'gefolgt',
                    part_of_speech: '',
                    domain: [],
                    extension: []
                },
                {
                    orthography: 'nach gekommen',
                    part_of_speech: '',
                    domain: [],
                    extension: []
                }
            ],
            [
                {
                    orthography: 'gefolgt werden von etw.',
                    part_of_speech: '',
                    domain: [],
                    extension: []
                }
            ],
            [
                {
                    orthography: 'Auf den Winter folgt der Frühling.',
                    part_of_speech: '',
                    domain: [],
                    extension: []
                },
                {
                    orthography: 'Dem Winter folgt der Frühling.',
                    part_of_speech: '',
                    domain: ['geh.'],
                    extension: []
                }
            ],
            [
                {
                    orthography: 'Die Nummer 28 kommt nach 27.',
                    part_of_speech: '',
                    domain: [],
                    extension: []
                }
            ],
            [
                {
                    orthography: 'Zunächst gab es die Ansprachen der Ehrengäste, dann folgte die Preisverleihung.',
                    part_of_speech: '',
                    domain: [],
                    extension: []
                }
            ],
            [
                {
                    orthography: 'Der Krieg war zu Ende. Es folgte eine lange Zeit des Wiederaufbaus.',
                    part_of_speech: '',
                    domain: [],
                    extension: []
                }
            ],
            [
                {
                    orthography: 'Darauf folgt ein sechsmonatiges Praktikum.',
                    part_of_speech: '',
                    domain: [],
                    extension: []
                }
            ]
        ];
        let order = parseOrder(l);
        assertOrderEqual(order, e);
    });

    test('format genus', () =>{
        let g:Genus = {
            orthography: "Räumfahrzeug",
            part_of_speech: "n",
            domain: ["auto"],
            extension: [
                { position: 17, text: "Winterdienst" }
            ]
        };
        let format = formatGenus(g);
        console.log(format);
    });

    test.only('format order', () => {
        let de:Order = [
            [
                {
                    orthography: 'auf etw. / einer Sache  folgen',
                    part_of_speech: '',
                    domain: ['geh.'],
                    extension: []
                },
                {
                    orthography: 'nach etw. kommen',
                    part_of_speech: 'vi',
                    domain: [],
                    extension: [
                        {position: 22, text: "zeitlich oder örtlich anschließen"},
                        {position: 58, text: "Sache"}
                    ]
                }
            ],
            [
                {
                    orthography: 'folgend',
                    part_of_speech: '',
                    domain: [],
                    extension: []
                },
                {
                    orthography: 'nach kommend',
                    part_of_speech: '',
                    domain: [],
                    extension: []
                }
            ],
            [
                {
                    orthography: 'gefolgt',
                    part_of_speech: '',
                    domain: [],
                    extension: []
                },
                {
                    orthography: 'nach gekommen',
                    part_of_speech: '',
                    domain: [],
                    extension: []
                }
            ],
            [
                {
                    orthography: 'gefolgt werden von etw.',
                    part_of_speech: '',
                    domain: [],
                    extension: []
                }
            ],
            [
                {
                    orthography: 'Auf den Winter folgt der Frühling.',
                    part_of_speech: '',
                    domain: [],
                    extension: []
                },
                {
                    orthography: 'Dem Winter folgt der Frühling.',
                    part_of_speech: '',
                    domain: ['geh.'],
                    extension: []
                }
            ],
            [
                {
                    orthography: 'Die Nummer 28 kommt nach 27.',
                    part_of_speech: '',
                    domain: [],
                    extension: []
                }
            ],
            [
                {
                    orthography: 'Zunächst gab es die Ansprachen der Ehrengäste, dann folgte die Preisverleihung.',
                    part_of_speech: '',
                    domain: [],
                    extension: []
                }
            ],
            [
                {
                    orthography: 'Der Krieg war zu Ende. Es folgte eine lange Zeit des Wiederaufbaus.',
                    part_of_speech: '',
                    domain: [],
                    extension: []
                }
            ],
            [
                {
                    orthography: 'Darauf folgt ein sechsmonatiges Praktikum.',
                    part_of_speech: '',
                    domain: [],
                    extension: []
                }
            ]
        ];
        let enText = [
            'to follow sth. (of a thing that comes after in time or place)' , 
            'following' , 
            'followed'  ,
            'to be followed by sth.',  
            'Spring follows winter.; Winter is followed by spring.',
            'The number 28 follows 27.',
            'First came the speeches of the guests of honour, and the presentation of awards followed.',
            'The war ended. There followed / Then came / Then there was a long period of rebuilding.',
            'This is followed by a six-month traineeship.'
        ].join(' | ');
        let en:Order = parseTranslate(enText);
        let card:Dict_Card = [de, en];
        let f = formatDictCard(card);
        console.log(f);
    });
});



